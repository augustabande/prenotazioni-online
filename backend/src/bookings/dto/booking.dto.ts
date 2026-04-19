import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  slotId!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class RescheduleBookingDto {
  @IsUUID()
  newSlotId!: string;
}
