import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { OpenMeteoService } from './open-meteo.service';
import { WeatherCronService } from './weather-cron.service';
import { WeatherController } from './weather.controller';
import { PaymentsModule } from '../payments/payments.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [JwtModule.register({}), PaymentsModule, NotificationsModule],
  controllers: [WeatherController],
  providers: [OpenMeteoService, WeatherCronService],
  exports: [OpenMeteoService],
})
export class WeatherModule {}
