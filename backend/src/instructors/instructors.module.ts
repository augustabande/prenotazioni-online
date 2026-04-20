import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { InstructorsController } from './instructors.controller';
import { InstructorsService } from './instructors.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [InstructorsController],
  providers: [InstructorsService],
})
export class InstructorsModule {}
