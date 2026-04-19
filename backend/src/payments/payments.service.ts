import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { SlotStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private stripe: InstanceType<typeof Stripe>;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.stripe = new Stripe(this.config.getOrThrow<string>('STRIPE_SECRET_KEY'));
  }

  async createPaymentIntent(amountCents: number, metadata: Record<string, string>) {
    return this.stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'eur',
      capture_method: 'manual',
      metadata,
    });
  }

  async capturePaymentIntent(paymentIntentId: string) {
    try {
      return await this.stripe.paymentIntents.capture(paymentIntentId);
    } catch (e) {
      this.logger.error(`Failed to capture PI ${paymentIntentId}`, e);
      throw e;
    }
  }

  async cancelPaymentIntent(paymentIntentId: string) {
    try {
      return await this.stripe.paymentIntents.cancel(paymentIntentId);
    } catch (e) {
      this.logger.error(`Failed to cancel PI ${paymentIntentId}`, e);
      throw e;
    }
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const secret = this.config.getOrThrow<string>('STRIPE_WEBHOOK_SECRET');
    const event = this.stripe.webhooks.constructEvent(rawBody, signature, secret);

    const obj = event.data.object as { id: string; payment_intent?: string | { id: string } };

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.updateBookingByPi(obj.id, SlotStatus.PENDING);
        break;
      case 'payment_intent.canceled':
        await this.updateBookingByPi(obj.id, SlotStatus.CANCELLED_BY_SCHOOL);
        break;
      case 'charge.refunded':
        if (obj.payment_intent) {
          const piId = typeof obj.payment_intent === 'string' ? obj.payment_intent : obj.payment_intent.id;
          await this.updateBookingByPi(piId, SlotStatus.CANCELLED_BY_SCHOOL);
        }
        break;
    }

    return { received: true };
  }

  private async updateBookingByPi(paymentIntentId: string, status: SlotStatus) {
    const booking = await this.prisma.booking.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
    });
    if (!booking) {
      this.logger.warn(`No booking found for PI ${paymentIntentId}`);
      return;
    }
    await this.prisma.booking.update({
      where: { id: booking.id },
      data: { status },
    });
    await this.prisma.bookingHistory.create({
      data: {
        bookingId: booking.id,
        fromStatus: booking.status,
        toStatus: status,
        reason: `Stripe webhook: ${status}`,
        changedBy: 'SYSTEM',
      },
    });
  }
}
