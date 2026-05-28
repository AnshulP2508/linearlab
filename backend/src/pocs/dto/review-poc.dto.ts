import { IsOptional, IsString, MinLength } from 'class-validator';

export class ReviewPocDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  reason?: string;
}
