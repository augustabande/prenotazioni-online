import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SlotStatus } from '@prisma/client';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({ id: 'pi_1', client_secret: 'cs_1' }),
      capture: jest.fn().mockResolvedValue({ id: 'pi_1', status: 'succeeded' }),
      cancel: jest.fn().mockResolvedValue({ id: 'pi_1', status: 'canceled' }),
    },
    webhooks: {
      constructEvent: jest.fn().mockImplementation((_body: Buffer, _sig: string, _secret: string) => ({
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_1' } },
      })),
    },
  }));
});

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: { booking: { findFirst: jest.Mock; update: jest.Mock }; bookingHistory: { create: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      booking: { findFirst: jest.fn(), update: jest.fn() },
      bookingHistory: { create: jest.fn() },
    };

    const module = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: { getOrThrow: () => 'sk_test', get: () => 'whsec_test' } },
      ],
    }).compile();

    service = module.get(PaymentsService);
  });

  describe('createPaymentIntent', () => {
    it('creates a payment intent with correct params', async () => {
      const result = await service.createPaymentIntent(4500, { slotId: 's-1', userId: 'u-1' });
      expect(result.id).toBe('pi_1');
      expect(result.client_secret).toBe('cs_1');
    });
  });

  describe('handleWebhook', () => {
    it('updates booking on payment_intent.succeeded', async () => {
      prisma.booking.findFirst.mockResolvedValue({ id: 'b-1', status: SlotStatus.PENDING });
      prisma.booking.update.mockResolvedValue({ id: 'b-1', status: SlotStatus.PENDING });

      const result = await service.handleWebhook(Buffer.from('{}'), 'sig');
      expect(result).toEqual({ received: true });
      expect(prisma.booking.findFirst).toHaveBeenCalledWith({ where: { stripePaymentIntentId: 'pi_1' } });
    });

    it('logs warning when no booking found for PI', async () => {
      prisma.booking.findFirst.mockResolvedValue(null);

      const result = await service.handleWebhook(Buffer.from('{}'), 'sig');
      expect(result).toEqual({ received: true });
      expect(prisma.booking.update).not.toHaveBeenCalled();
    });
  });
});
