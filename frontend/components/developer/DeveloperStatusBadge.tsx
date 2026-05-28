"use client";

import { cn } from "@/components/admin/primitives";
import { DeveloperStage } from "@/types/developer";
import { developerStageClassName, developerStageLabel } from "./developerUtils";

export function DeveloperStatusBadge({ stage }: { stage: DeveloperStage }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold",
        developerStageClassName[stage],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {developerStageLabel[stage]}
    </span>
  );
}
