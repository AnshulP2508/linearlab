import { DeveloperPriority, DeveloperStage } from "@/types/developer";

export const developerStageOrder: DeveloperStage[] = [
  "ASSIGNED",
  "IN_PROGRESS",
  "DEVELOPMENT_COMPLETED",
  "UNDER_ADMIN_REVIEW",
  "PUBLISHED",
];

export const developerStageLabel: Record<DeveloperStage, string> = {
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  DEVELOPMENT_COMPLETED: "Development Completed",
  UNDER_ADMIN_REVIEW: "Under Review",
  PUBLISHED: "Published",
};

export const developerStageClassName: Record<DeveloperStage, string> = {
  ASSIGNED: "bg-slate-500/10 text-slate-700",
  IN_PROGRESS: "bg-blue-500/10 text-blue-700",
  DEVELOPMENT_COMPLETED: "bg-yellow-500/10 text-yellow-700",
  UNDER_ADMIN_REVIEW: "bg-orange-500/10 text-orange-700",
  PUBLISHED: "bg-emerald-500/10 text-emerald-700",
};

export const developerPriorityClassName: Record<DeveloperPriority, string> = {
  HIGH: "bg-rose-500/10 text-rose-700",
  MEDIUM: "bg-yellow-500/10 text-yellow-700",
  LOW: "bg-emerald-500/10 text-emerald-700",
};

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function relativeDeadlineTone(value: string) {
  const diff = Math.ceil(
    (new Date(value).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );

  if (diff < 0) return "text-rose-700";
  if (diff <= 7) return "text-amber-700";
  return "text-on-surface";
}

export function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}
