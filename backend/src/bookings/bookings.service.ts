import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { SlotStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { CreateBookingDto, RescheduleBookingDto } from './dto/booking.dto';
import { SlotStateMachine } from '../slots/slot-state-machine';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentsService,
  ) {}

  async create(dto: CreateBookingDto, userId: string) {
    const slot = await this.prisma.slot.findUnique({
      where: { id: dto.slotId },
      include: { lessonType: true, bookings: true },
    });
    if (!slot) throw new NotFoundException('Slot not found');

    if (slot.status !== SlotStatus.AVAILABLE && slot.status !== SlotStatus.PENDING) {
      throw new BadRequestException('Slot is not bookable');
    }

    const currentBookings = slot.bookings.filter(
      (b) => b.status !== SlotStatus.CANCELLED_BY_WEATHER && b.status !== SlotStatus.CANCELLED_BY_SCHOOL,
    );
    if (currentBookings.length >= slot.maxStudents) {
      throw new BadRequestException('Slot is full');
    }

    const totalAmount = Number(slot.lessonType.pricePerPerson);
    const depositAmount = Math.round(totalAmount * 0.3 * 100) / 100;
    const depositCents = Math.round(depositAmount * 100);

    const pi = await this.payments.createPaymentIntent(depositCents, {
      slotId: slot.id,
      userId,
    });

    const booking = await this.prisma.$transaction(async (tx) => {
      if (slot.status === SlotStatus.AVAILABLE) {
        await tx.slot.update({
          where: { id: slot.id },
          data: { status: SlotStatus.PENDING },
        });
      }

      const b = await tx.booking.create({
        data: {
          slotId: slot.id,
          userId,
          status: SlotStatus.PENDING,
          stripePaymentIntentId: pi.id,
          depositAmount,
          totalAmount,
          notes: dto.notes,
        },
      });

      await tx.bookingHistory.create({
        data: {
          bookingId: b.id,
          fromStatus: SlotStatus.AVAILABLE,
          toStatus: SlotStatus.PENDING,
          reason: 'Booking created',
          changedBy: userId,
        },
      });

      return b;
    });

    return { booking, clientSecret: pi.client_secret };
  }

  findMine(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: { slot: { include: { lessonType: true, instructor: { include: { user: true } }, location: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  findAll() {
    return this.prisma.booking.findMany({
      include: { slot: { include: { lessonType: true } }, user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancel(bookingId: string, userId: string, isAdmin: boolean) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { slot: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (!isAdmin && booking.userId !== userId) throw new ForbiddenException();

    if (!isAdmin) {
      const hoursUntilStart = (booking.slot.startsAt.getTime() - Date.now()) / 3_600_000;
      if (hoursUntilStart < 48) {
        throw new BadRequestException('Cannot cancel less than 48h before start');
      }
    }

    if (booking.stripePaymentIntentId) {
      await this.payments.cancelPaymentIntent(booking.stripePaymentIntentId);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: { status: SlotStatus.CANCELLED_BY_SCHOOL },
      });

      await tx.bookingHistory.create({
        data: {
          bookingId,
          fromStatus: booking.status,
          toStatus: SlotStatus.CANCELLED_BY_SCHOOL,
          reason: isAdmin ? 'Cancelled by admin' : 'Cancelled by customer',
          changedBy: userId,
        },
      });

      const activeBookings = await tx.booking.count({
        where: {
          slotId: booking.slotId,
          status: { notIn: [SlotStatus.CANCELLED_BY_WEATHER, SlotStatus.CANCELLED_BY_SCHOOL] },
        },
      });
      if (activeBookings === 0) {
        await tx.slot.update({
          where: { id: booking.slotId },
          data: { status: SlotStatus.AVAILABLE },
        });
      }

      return updated;
    });
  }

  async reschedule(bookingId: string, dto: RescheduleBookingDto, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { slot: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.userId !== userId) throw new ForbiddenException();

    const newSlot = await this.prisma.slot.findUnique({
      where: { id: dto.newSlotId },
      include: { bookings: true },
    });
    if (!newSlot) throw new NotFoundException('New slot not found');
    if (newSlot.status !== SlotStatus.AVAILABLE && newSlot.status !== SlotStatus.PENDING) {
      throw new BadRequestException('New slot is not available');
    }

    const activeBookings = newSlot.bookings.filter(
      (b) => b.status !== SlotStatus.CANCELLED_BY_WEATHER && b.status !== SlotStatus.CANCELLED_BY_SCHOOL,
    );
    if (activeBookings.length >= newSlot.maxStudents) {
      throw new BadRequestException('New slot is full');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: SlotStatus.CANCELLED_BY_SCHOOL },
      });
      await tx.bookingHistory.create({
        data: {
          bookingId,
          fromStatus: booking.status,
          toStatus: SlotStatus.CANCELLED_BY_SCHOOL,
          reason: 'Rescheduled to new slot',
          changedBy: userId,
        },
      });

      if (newSlot.status === SlotStatus.AVAILABLE) {
        await tx.slot.update({ where: { id: newSlot.id }, data: { status: SlotStatus.PENDING } });
      }

      const newBooking = await tx.booking.create({
        data: {
          slotId: newSlot.id,
          userId,
          status: SlotStatus.PENDING,
          stripePaymentIntentId: booking.stripePaymentIntentId,
          depositAmount: booking.depositAmount,
          totalAmount: booking.totalAmount,
        },
      });

      await tx.bookingHistory.create({
        data: {
          bookingId: newBooking.id,
          fromStatus: SlotStatus.AVAILABLE,
          toStatus: SlotStatus.PENDING,
          reason: `Rescheduled from booking ${bookingId}`,
          changedBy: userId,
        },
      });

      return newBooking;
    });
  }
}
