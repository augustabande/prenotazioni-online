import { Module } from '@nestjs/common';
import { OpenMeteoService } from './open-meteo.service';
import { WeatherCronService } from './weather-cron.service';
import { PaymentsModule } from '../payments/payments.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PaymentsModule, NotificationsModule],
  providers: [OpenMeteoService, WeatherCronService],
  exports: [OpenMeteoService],
})
export class WeatherModule {}
