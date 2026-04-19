import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SlotsController } from './slots.controller';
import { SlotsService } from './slots.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [SlotsController],
  providers: [SlotsService],
  exports: [SlotsService],
})
export class SlotsModule {}
