import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { FeedbackStatuses } from '../../common/admin-domain';

export class QueryFeedbackDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(FeedbackStatuses)
  status?: string;

  @IsOptional()
  @IsString()
  pocId?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 10;
}
