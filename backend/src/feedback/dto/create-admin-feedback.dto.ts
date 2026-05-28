import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAdminFeedbackDto {
  @IsString()
  @IsNotEmpty()
  pocId: string;

  @IsString()
  @IsNotEmpty()
  comment: string;

  @IsNumber()
  @IsOptional()
  rating?: number;
}
