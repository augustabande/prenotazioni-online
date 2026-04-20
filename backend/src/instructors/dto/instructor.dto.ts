import { IsArray, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateInstructorDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(2) name!: string;
  @IsString() bio!: string;
  @IsArray() @IsString({ each: true }) certifications!: string[];
  @IsString() colorHex!: string;
}

export class UpdateInstructorDto {
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) certifications?: string[];
  @IsOptional() @IsString() colorHex?: string;
}
