import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLessonTypeDto {
  @IsString()
  code!: string;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationMinutes!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  minParticipants!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxParticipants!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pricePerPerson!: number;

  @Type(() => Number)
  @IsInt()
  requiredWindKnotsMin!: number;

  @Type(() => Number)
  @IsInt()
  requiredWindKnotsMax!: number;
}

export class UpdateLessonTypeDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) durationMinutes?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) minParticipants?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) maxParticipants?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) pricePerPerson?: number;
  @IsOptional() @Type(() => Number) @IsInt() requiredWindKnotsMin?: number;
  @IsOptional() @Type(() => Number) @IsInt() requiredWindKnotsMax?: number;
  @IsOptional() @IsBoolean() active?: boolean;
}
