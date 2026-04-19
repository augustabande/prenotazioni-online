import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SlotStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSlotDto, QuerySlotsDto, UpdateSlotStatusDto } from './dto/slot.dto';
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
}
