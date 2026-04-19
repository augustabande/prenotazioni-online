import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: jest.fn().mockResolvedValue({ id: 'email-1' }) },
  })),
}));

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: ConfigService, useValue: { get: () => 're_test' } },
      ],
    }).compile();

    service = module.get(EmailService);
  });

  const ctx = { to: 'test@test.com', customerName: 'Sofia', lessonTitle: 'Privata 2h', date: '20/07/2025', instructorName: 'Marco' };

  it('sendSlotConfirmed does not throw', async () => {
    await expect(service.sendSlotConfirmed(ctx)).resolves.not.toThrow();
  });

  it('sendSlotCancelledWeather does not throw', async () => {
    await expect(service.sendSlotCancelledWeather({ ...ctx, reason: 'Vento basso', rescheduleUrl: 'http://localhost/reschedule' })).resolves.not.toThrow();
  });

  it('sendBookingReceived does not throw', async () => {
    await expect(service.sendBookingReceived(ctx)).resolves.not.toThrow();
  });

  it('handles send failure gracefully', async () => {
    const { Resend } = require('resend');
    Resend.mockImplementationOnce(() => ({
      emails: { send: jest.fn().mockRejectedValue(new Error('API down')) },
    }));

    const module = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: ConfigService, useValue: { get: () => 're_test' } },
      ],
    }).compile();

    const failService = module.get(EmailService);
    await expect(failService.sendSlotConfirmed(ctx)).resolves.not.toThrow();
  });
});
