export declare const DashboardRanges: readonly ["day", "week", "month", "year"];
export type DashboardRange = (typeof DashboardRanges)[number];
export declare class QueryDashboardDto {
    range?: DashboardRange;
}
