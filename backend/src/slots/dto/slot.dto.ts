import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { SlotStatus } from '@prisma/client';

export class QuerySlotsDto {
  @IsOptional() @IsDateString() startAfter?: string;
  @IsOptional() @IsDateString() startBefore?: string;
  @IsOptional() @IsEnum(SlotStatus) status?: SlotStatus;
  @IsOptional() @IsUUID() instructorId?: string;
  @IsOptional() @IsUUID() lessonTypeId?: string;
}

export class CreateSlotDto {
  @IsUUID() instructorId!: string;
  @IsUUID() locationId!: string;
  @IsUUID() lessonTypeId!: string;
  @IsDateString() startsAt!: string;
  @IsDateString() endsAt!: string;
  @Type(() => Number) @IsInt() @Min(1) maxStudents!: number;
}

export class UpdateSlotStatusDto {
  @IsEnum(SlotStatus) newStatus!: SlotStatus;
  @IsOptional() @IsString() reason?: string;
}

export class CancelDayDto {
  @IsDateString() date!: string;
  @IsString() reason!: string;
}
