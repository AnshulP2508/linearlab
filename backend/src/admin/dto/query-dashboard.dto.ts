import { IsIn, IsOptional } from 'class-validator';

export const DashboardRanges = ['day', 'week', 'month', 'year'] as const;
export type DashboardRange = (typeof DashboardRanges)[number];

export class QueryDashboardDto {
  @IsOptional()
  @IsIn(DashboardRanges)
  range?: DashboardRange = 'month';
}
