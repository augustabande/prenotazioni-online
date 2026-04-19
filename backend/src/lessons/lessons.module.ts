import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [LessonsController],
  providers: [LessonsService],
  exports: [LessonsService],
})
export class LessonsModule {}
