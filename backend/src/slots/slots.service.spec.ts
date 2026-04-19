import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SlotStatus } from '@prisma/client';
import { SlotsService } from './slots.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SlotsService', () => {
  let service: SlotsService;
  let prisma: { slot: { findMany: jest.Mock; create: jest.Mock; findUnique: jest.Mock; update: jest.Mock }; booking: { update: jest.Mock }; bookingHistory: { create: jest.Mock }; $transaction: jest.Mock };

  beforeEach(async () => {
    prisma = {
      slot: { findMany: jest.fn(), create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
      booking: { update: jest.fn() },
      bookingHistory: { create: jest.fn() },
      $transaction: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        SlotsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(SlotsService);
  });

  describe('findAll', () => {
    it('excludes PENDING slots for anonymous users', async () => {
      prisma.slot.findMany.mockResolvedValue([]);
      await service.findAll({}, false);

      expect(prisma.slot.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: { not: SlotStatus.PENDING } }) }),
      );
    });

    it('includes all statuses for authenticated users', async () => {
      prisma.slot.findMany.mockResolvedValue([]);
      await service.findAll({}, true);

      expect(prisma.slot.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.not.objectContaining({ status: { not: SlotStatus.PENDING } }) }),
      );
    });
  });

  describe('create', () => {
    it('creates a slot', async () => {
      const dto = { instructorId: 'i-1', locationId: 'l-1', lessonTypeId: 'lt-1', startsAt: '2025-08-01T10:00:00Z', endsAt: '2025-08-01T12:00:00Z', maxStudents: 2 };
      prisma.slot.create.mockResolvedValue({ id: 's-1', ...dto });

      const result = await service.create(dto);
      expect(result.id).toBe('s-1');
    });
  });

  describe('updateStatus', () => {
    it('throws NotFoundException if slot not found', async () => {
      prisma.slot.findUnique.mockResolvedValue(null);
      await expect(service.updateStatus('s-x', { newStatus: SlotStatus.CONFIRMED }, 'u-1')).rejects.toThrow(NotFoundException);
    });

    it('transitions slot and cascades to bookings', async () => {
      prisma.slot.findUnique.mockResolvedValue({
        id: 's-1', status: SlotStatus.PENDING, bookings: [{ id: 'b-1', status: SlotStatus.PENDING }],
      });
      const updatedSlot = { id: 's-1', status: SlotStatus.CONFIRMED };
      prisma.$transaction.mockResolvedValue([updatedSlot]);

      const result = await service.updateStatus('s-1', { newStatus: SlotStatus.CONFIRMED }, 'u-1');
      expect(result).toEqual(updatedSlot);
    });
  });
});
