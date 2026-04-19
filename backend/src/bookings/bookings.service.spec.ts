import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SlotStatus } from '@prisma/client';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';

describe('BookingsService', () => {
  let service: BookingsService;
  let prisma: { slot: { findUnique: jest.Mock }; booking: { create: jest.Mock }; bookingHistory: { create: jest.Mock }; $transaction: jest.Mock };
  let payments: { createPaymentIntent: jest.Mock };

  beforeEach(async () => {
    prisma = {
      slot: { findUnique: jest.fn() },
      booking: { create: jest.fn() },
      bookingHistory: { create: jest.fn() },
      $transaction: jest.fn(),
    };
    payments = {
      createPaymentIntent: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: prisma },
        { provide: PaymentsService, useValue: payments },
      ],
    }).compile();

    service = module.get(BookingsService);
  });

  describe('create', () => {
    const userId = 'user-1';
    const slotId = 'slot-1';

    it('throws NotFoundException if slot does not exist', async () => {
      prisma.slot.findUnique.mockResolvedValue(null);
      await expect(service.create({ slotId }, userId)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException if slot is CONFIRMED', async () => {
      prisma.slot.findUnique.mockResolvedValue({
        id: slotId,
        status: SlotStatus.CONFIRMED,
        lessonType: { pricePerPerson: 150 },
        bookings: [],
        maxStudents: 1,
      });
      await expect(service.create({ slotId }, userId)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if slot is full', async () => {
      prisma.slot.findUnique.mockResolvedValue({
        id: slotId,
        status: SlotStatus.AVAILABLE,
        lessonType: { pricePerPerson: 150 },
        bookings: [{ status: SlotStatus.PENDING }],
        maxStudents: 1,
      });
      await expect(service.create({ slotId }, userId)).rejects.toThrow(BadRequestException);
    });

    it('creates booking and returns clientSecret on success', async () => {
      prisma.slot.findUnique.mockResolvedValue({
        id: slotId,
        status: SlotStatus.AVAILABLE,
        lessonType: { pricePerPerson: 150 },
        bookings: [],
        maxStudents: 1,
      });

      payments.createPaymentIntent.mockResolvedValue({
        id: 'pi_test',
        client_secret: 'cs_test',
      });

      const mockBooking = { id: 'booking-1', slotId, userId, status: SlotStatus.PENDING };
      prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          slot: { update: jest.fn() },
          booking: { create: jest.fn().mockResolvedValue(mockBooking) },
          bookingHistory: { create: jest.fn() },
        };
        return fn(tx);
      });

      const result = await service.create({ slotId }, userId);

      expect(payments.createPaymentIntent).toHaveBeenCalledWith(4500, { slotId, userId });
      expect(result.clientSecret).toBe('cs_test');
      expect(result.booking).toEqual(mockBooking);
    });
  });
});
