import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

interface EmailContext {
  to: string;
  customerName: string;
  lessonTitle?: string;
  date?: string;
  instructorName?: string;
  reason?: string;
  rescheduleUrl?: string;
}

@Injectable()
export class EmailService {
  private resend: Resend;
  private from: string;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {
    this.resend = new Resend(this.config.get('RESEND_API_KEY', 're_test'));
    this.from = 'Kami Kite <noreply@kamikite.com>';
  }

  async sendBookingReceived(ctx: EmailContext) {
    return this.send(ctx.to, 'Prenotazione ricevuta', this.wrap(`
      <h2>Ciao ${ctx.customerName},</h2>
      <p>La tua prenotazione per <strong>${ctx.lessonTitle}</strong> del <strong>${ctx.date}</strong>
      con l'istruttore <strong>${ctx.instructorName}</strong> è stata ricevuta.</p>
      <p>Riceverai una conferma definitiva dopo la verifica delle condizioni meteo.</p>
    `));
  }

  async sendSlotConfirmed(ctx: EmailContext) {
    return this.send(ctx.to, 'Lezione confermata! ✅', this.wrap(`
      <h2>Ciao ${ctx.customerName},</h2>
      <p>Ottime notizie! La tua lezione <strong>${ctx.lessonTitle}</strong> del <strong>${ctx.date}</strong>
      è stata <strong>confermata</strong>.</p>
      <p>Le condizioni meteo sono ideali. Ci vediamo in spiaggia!</p>
    `));
  }

  async sendSlotCancelledWeather(ctx: EmailContext) {
    return this.send(ctx.to, 'Lezione annullata per meteo ⛈️', this.wrap(`
      <h2>Ciao ${ctx.customerName},</h2>
      <p>Purtroppo la lezione <strong>${ctx.lessonTitle}</strong> del <strong>${ctx.date}</strong>
      è stata annullata per condizioni meteo non idonee.</p>
      <p><strong>Motivo:</strong> ${ctx.reason}</p>
      <p>Il deposito verrà rimborsato automaticamente.</p>
      ${ctx.rescheduleUrl ? `<p><a href="${ctx.rescheduleUrl}">Riprogramma la tua lezione →</a></p>` : ''}
    `));
  }

  async sendRescheduleReminder(ctx: EmailContext) {
    return this.send(ctx.to, 'Riprogramma la tua lezione', this.wrap(`
      <h2>Ciao ${ctx.customerName},</h2>
      <p>Ti ricordiamo che puoi riprogrammare la tua lezione annullata.</p>
      ${ctx.rescheduleUrl ? `<p><a href="${ctx.rescheduleUrl}">Scegli una nuova data →</a></p>` : ''}
    `));
  }

  async sendPaymentFailed(ctx: EmailContext) {
    return this.send(ctx.to, 'Problema con il pagamento', this.wrap(`
      <h2>Ciao ${ctx.customerName},</h2>
      <p>Si è verificato un problema con il pagamento per la lezione <strong>${ctx.lessonTitle}</strong>.</p>
      <p>Ti preghiamo di riprovare o contattarci per assistenza.</p>
    `));
  }

  private wrap(body: string): string {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
    <body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333">
      ${body}
      <hr style="margin-top:30px;border:none;border-top:1px solid #eee">
      <p style="font-size:12px;color:#999">Kami Kite Experience — El Cotillo, Fuerteventura</p>
    </body></html>`;
  }

  private async send(to: string, subject: string, html: string) {
    try {
      await this.resend.emails.send({ from: this.from, to, subject, html });
    } catch (e) {
      this.logger.error(`Failed to send email to ${to}: ${subject}`, e);
    }
  }
}
