import { Type } from 'class-transformer';
import { IsInt, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateFeedbackDto {
  @IsString()
  @MinLength(1)
  pocId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  rating: number;

  @IsString()
  @MinLength(10)
  @MaxLength(2_000)
  comment: string;
}
