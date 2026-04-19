import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SlotStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OpenMeteoService } from './open-meteo.service';
import { PaymentsService } from '../payments/payments.service';
import { EmailService } from '../notifications/email.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WeatherCronService {
  private readonly logger = new Logger(WeatherCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly meteo: OpenMeteoService,
    private readonly payments: PaymentsService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
  ) {}

  @Cron('0 8,18 * * *')
  async checkWeather() {
    const now = new Date();
    const from12h = new Date(now.getTime() + 12 * 3_600_000);
    const to36h = new Date(now.getTime() + 36 * 3_600_000);

    const slots = await this.prisma.slot.findMany({
      where: {
        status: SlotStatus.PENDING,
        startsAt: { gte: from12h, lte: to36h },
      },
      include: {
        lessonType: true,
        location: true,
        bookings: { include: { user: true } },
        instructor: { include: { user: true } },
      },
    });

    this.logger.log(`Weather check: evaluating ${slots.length} pending slots`);

    for (const slot of slots) {
      await this.evaluateSlot(slot);
    }
  }

  async evaluateSlot(slot: Awaited<ReturnType<typeof this.findSlotWithRelations>>) {
    try {
      const forecast = await this.meteo.getWindForecast(
        slot.location.lat,
        slot.location.lng,
        slot.startsAt.toISOString(),
        slot.endsAt.toISOString(),
      );

      if (forecast.length === 0) {
        this.logger.warn(`No forecast data for slot ${slot.id}`);
        return;
      }

      const avgWind = forecast.reduce((sum, f) => sum + f.windSpeedKnots, 0) / forecast.length;

      const lessonMin = slot.lessonType.requiredWindKnotsMin;
      const lessonMax = slot.lessonType.requiredWindKnotsMax;
      const locationMin = slot.location.windMinKnots;
      const locationMax = slot.location.windMaxKnots;

      const effectiveMin = Math.max(lessonMin, locationMin);
      const effectiveMax = Math.min(lessonMax, locationMax);

      const windOk = avgWind >= effectiveMin && avgWind <= effectiveMax;

      const reason = windOk
        ? `Vento medio ${avgWind.toFixed(1)} nodi nel range ${effectiveMin}-${effectiveMax}`
        : `Vento medio ${avgWind.toFixed(1)} nodi fuori dal range ${effectiveMin}-${effectiveMax}`;

      const newStatus = windOk ? SlotStatus.CONFIRMED : SlotStatus.CANCELLED_BY_WEATHER;

      await this.prisma.slot.update({
        where: { id: slot.id },
        data: {
          status: newStatus,
          weatherCheckedAt: new Date(),
          windForecastKnots: avgWind,
          weatherDecisionReason: reason,
        },
      });

      const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:4200');

      for (const booking of slot.bookings) {
        await this.prisma.booking.update({
          where: { id: booking.id },
          data: { status: newStatus },
        });
        await this.prisma.bookingHistory.create({
          data: {
            bookingId: booking.id,
            fromStatus: SlotStatus.PENDING,
            toStatus: newStatus,
            reason,
            changedBy: 'SYSTEM',
          },
        });

        if (windOk) {
          if (booking.stripePaymentIntentId) {
            await this.payments.capturePaymentIntent(booking.stripePaymentIntentId);
          }
          await this.email.sendSlotConfirmed({
            to: booking.user.email,
            customerName: booking.user.name,
            lessonTitle: slot.lessonType.title,
            date: slot.startsAt.toLocaleDateString('it-IT'),
            instructorName: slot.instructor.user.name,
          });
        } else {
          if (booking.stripePaymentIntentId) {
            await this.payments.cancelPaymentIntent(booking.stripePaymentIntentId);
          }
          await this.email.sendSlotCancelledWeather({
            to: booking.user.email,
            customerName: booking.user.name,
            lessonTitle: slot.lessonType.title,
            date: slot.startsAt.toLocaleDateString('it-IT'),
            reason,
            rescheduleUrl: `${frontendUrl}/bookings/${booking.id}/reschedule`,
          });
        }
      }

      this.logger.log(`Slot ${slot.id}: ${newStatus} — ${reason}`);
    } catch (e) {
      this.logger.error(`Failed to evaluate slot ${slot.id}`, e);
    }
  }

  private findSlotWithRelations(id?: string) {
    return this.prisma.slot.findFirstOrThrow({
      where: id ? { id } : undefined,
      include: {
        lessonType: true,
        location: true,
        bookings: { include: { user: true } },
        instructor: { include: { user: true } },
      },
    });
  }
}
