"use client";

import { cn } from "@/components/admin/primitives";
import { DeveloperPriority } from "@/types/developer";
import { developerPriorityClassName } from "./developerUtils";

export function DeveloperPriorityBadge({
  priority,
}: {
  priority: DeveloperPriority;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-[12px] font-semibold",
        developerPriorityClassName[priority],
      )}
    >
      {priority}
    </span>
  );
}
