import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SlotStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSlotDto, QuerySlotsDto, UpdateSlotStatusDto, CancelDayDto } from './dto/slot.dto';
import { SlotStateMachine } from './slot-state-machine';

@Injectable()
export class SlotsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(dto: QuerySlotsDto, isAuthenticated: boolean) {
    const where: Prisma.SlotWhereInput = {};

    if (dto.startAfter) where.startsAt = { ...(where.startsAt as object), gte: new Date(dto.startAfter) };
    if (dto.startBefore) where.startsAt = { ...(where.startsAt as object), lte: new Date(dto.startBefore) };
    if (dto.status) where.status = dto.status;
    if (dto.instructorId) where.instructorId = dto.instructorId;
    if (dto.lessonTypeId) where.lessonTypeId = dto.lessonTypeId;

    if (!isAuthenticated) {
      where.status = { not: SlotStatus.PENDING };
    }

    return this.prisma.slot.findMany({
      where,
      include: { instructor: { include: { user: true } }, lessonType: true, location: true },
      orderBy: { startsAt: 'asc' },
    });
  }

  create(dto: CreateSlotDto) {
    return this.prisma.slot.create({
      data: {
        instructorId: dto.instructorId,
        locationId: dto.locationId,
        lessonTypeId: dto.lessonTypeId,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        maxStudents: dto.maxStudents,
      },
    });
  }

  async updateStatus(id: string, dto: UpdateSlotStatusDto, changedBy: string) {
    const slot = await this.prisma.slot.findUnique({
      where: { id },
      include: { bookings: true },
    });
    if (!slot) throw new NotFoundException('Slot not found');

    SlotStateMachine.assertTransition(slot.status, dto.newStatus);

    const [updatedSlot] = await this.prisma.$transaction([
      this.prisma.slot.update({
        where: { id },
        data: { status: dto.newStatus },
      }),
      ...slot.bookings.map((b) =>
        this.prisma.booking.update({
          where: { id: b.id },
          data: { status: dto.newStatus },
        }),
      ),
      ...slot.bookings.map((b) =>
        this.prisma.bookingHistory.create({
          data: {
            bookingId: b.id,
            fromStatus: slot.status,
            toStatus: dto.newStatus,
            reason: dto.reason,
            changedBy,
          },
        }),
      ),
    ]);

    return updatedSlot;
  }

  async cancelDay(dto: CancelDayDto, changedBy: string) {
    const dayStart = new Date(dto.date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dto.date);
    dayEnd.setHours(23, 59, 59, 999);

    const slots = await this.prisma.slot.findMany({
      where: {
        startsAt: { gte: dayStart, lte: dayEnd },
        status: { in: [SlotStatus.AVAILABLE, SlotStatus.PENDING, SlotStatus.CONFIRMED] },
      },
      include: { bookings: true },
    });

    for (const slot of slots) {
      await this.prisma.$transaction([
        this.prisma.slot.update({ where: { id: slot.id }, data: { status: SlotStatus.CANCELLED_BY_SCHOOL } }),
        ...slot.bookings.map((b) =>
          this.prisma.booking.update({ where: { id: b.id }, data: { status: SlotStatus.CANCELLED_BY_SCHOOL } }),
        ),
        ...slot.bookings.map((b) =>
          this.prisma.bookingHistory.create({
            data: { bookingId: b.id, fromStatus: slot.status, toStatus: SlotStatus.CANCELLED_BY_SCHOOL, reason: dto.reason, changedBy },
          }),
        ),
      ]);
    }

    return { cancelled: slots.length };
  }
}
