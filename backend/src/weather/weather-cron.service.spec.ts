import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SlotStatus } from '@prisma/client';
import { WeatherCronService } from './weather-cron.service';
import { PrismaService } from '../prisma/prisma.service';
import { OpenMeteoService } from './open-meteo.service';
import { PaymentsService } from '../payments/payments.service';
import { EmailService } from '../notifications/email.service';

describe('WeatherCronService', () => {
  let service: WeatherCronService;
  let prisma: Record<string, Record<string, jest.Mock>>;
  let meteo: { getWindForecast: jest.Mock };
  let payments: { capturePaymentIntent: jest.Mock; cancelPaymentIntent: jest.Mock };
  let email: { sendSlotConfirmed: jest.Mock; sendSlotCancelledWeather: jest.Mock };

  const baseSlot = {
    id: 'slot-1',
    status: SlotStatus.PENDING,
    startsAt: new Date('2025-07-20T10:00:00Z'),
    endsAt: new Date('2025-07-20T12:00:00Z'),
    lessonType: { requiredWindKnotsMin: 12, requiredWindKnotsMax: 30, title: 'Privata 2h' },
    location: { lat: 28.68, lng: -14.01, windMinKnots: 12, windMaxKnots: 35 },
    instructor: { user: { name: 'Marco' } },
    bookings: [
      {
        id: 'b-1',
        status: SlotStatus.PENDING,
        stripePaymentIntentId: 'pi_1',
        user: { email: 'test@test.com', name: 'Sofia' },
      },
    ],
  };

  beforeEach(async () => {
    prisma = {
      slot: { update: jest.fn(), findMany: jest.fn() },
      booking: { update: jest.fn() },
      bookingHistory: { create: jest.fn() },
    };
    meteo = { getWindForecast: jest.fn() };
    payments = { capturePaymentIntent: jest.fn(), cancelPaymentIntent: jest.fn() };
    email = { sendSlotConfirmed: jest.fn(), sendSlotCancelledWeather: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        WeatherCronService,
        { provide: PrismaService, useValue: prisma },
        { provide: OpenMeteoService, useValue: meteo },
        { provide: PaymentsService, useValue: payments },
        { provide: EmailService, useValue: email },
        { provide: ConfigService, useValue: { get: () => 'http://localhost:4200' } },
      ],
    }).compile();

    service = module.get(WeatherCronService);
  });

  it('confirms slot when wind is in range', async () => {
    meteo.getWindForecast.mockResolvedValue([
      { time: '2025-07-20T10:00', windSpeedKnots: 18, windDirection: 30 },
      { time: '2025-07-20T11:00', windSpeedKnots: 20, windDirection: 35 },
    ]);

    await service.evaluateSlot(baseSlot as any);

    expect(prisma.slot.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: SlotStatus.CONFIRMED }),
      }),
    );
    expect(payments.capturePaymentIntent).toHaveBeenCalledWith('pi_1');
    expect(email.sendSlotConfirmed).toHaveBeenCalled();
  });

  it('cancels slot when wind is too low', async () => {
    meteo.getWindForecast.mockResolvedValue([
      { time: '2025-07-20T10:00', windSpeedKnots: 5, windDirection: 30 },
      { time: '2025-07-20T11:00', windSpeedKnots: 7, windDirection: 35 },
    ]);

    await service.evaluateSlot(baseSlot as any);

    expect(prisma.slot.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: SlotStatus.CANCELLED_BY_WEATHER }),
      }),
    );
    expect(payments.cancelPaymentIntent).toHaveBeenCalledWith('pi_1');
    expect(email.sendSlotCancelledWeather).toHaveBeenCalled();
  });

  it('cancels slot when wind is too high', async () => {
    meteo.getWindForecast.mockResolvedValue([
      { time: '2025-07-20T10:00', windSpeedKnots: 38, windDirection: 30 },
      { time: '2025-07-20T11:00', windSpeedKnots: 40, windDirection: 35 },
    ]);

    await service.evaluateSlot(baseSlot as any);

    expect(prisma.slot.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: SlotStatus.CANCELLED_BY_WEATHER }),
      }),
    );
  });

  it('skips evaluation when no forecast data', async () => {
    meteo.getWindForecast.mockResolvedValue([]);

    await service.evaluateSlot(baseSlot as any);

    expect(prisma.slot.update).not.toHaveBeenCalled();
  });
});
