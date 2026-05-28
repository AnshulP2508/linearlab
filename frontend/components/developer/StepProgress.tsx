"use client";

import { MaterialIcon } from "@/components/admin/primitives";
import { DeveloperStage } from "@/types/developer";
import { developerStageLabel, developerStageOrder } from "./developerUtils";

export function StepProgress({ current }: { current: DeveloperStage }) {
  const activeIndex = developerStageOrder.indexOf(current);

  return (
    <div className="relative flex flex-wrap gap-4 sm:flex-nowrap sm:justify-between">
      <div className="absolute left-0 top-4 hidden h-[2px] w-full bg-outline-variant sm:block" />
      <div
        className="absolute left-0 top-4 hidden h-[2px] bg-primary sm:block"
        style={{
          width: `${Math.max(0, (activeIndex / (developerStageOrder.length - 1)) * 100)}%`,
        }}
      />
      {developerStageOrder.map((stage, index) => {
        const active = index <= activeIndex;
        return (
          <div key={stage} className="relative z-10 flex flex-1 flex-col items-center gap-2">
            <div
              className={
                active
                  ? "flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white"
                  : "flex h-8 w-8 items-center justify-center rounded-full border-2 border-outline-variant bg-white text-on-surface-variant"
              }
            >
              <MaterialIcon className="text-[16px]" filled={active}>
                {active ? "check" : "chevron_right"}
              </MaterialIcon>
            </div>
            <span
              className={
                active
                  ? "text-center text-[11px] font-semibold text-primary"
                  : "text-center text-[11px] text-on-surface-variant"
              }
            >
              {developerStageLabel[stage]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
