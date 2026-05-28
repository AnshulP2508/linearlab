"use client";

import { AdminDashboardSummary } from "@/types/admin";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ActionButton, EmptyState, MaterialIcon, StatCard, SurfaceCard, TableCell, TableRow, TableWrapper } from "./primitives";
import { assignTechColors } from "@/lib/techColors";
import { useRemoteData } from "./useRemoteData";

const initialDashboard: AdminDashboardSummary = {
  summary: {
    totalPocs: 0,
    totalDevelopers: 0,
    totalUsers: 0,
    pendingApprovals: 0,
    activeDemos: 0,
    averageRating: 0,
    unreadNotifications: 0,
  },
  recentActivity: [],
  pendingApprovals: [],
  categoryCounts: [],
  techDistribution: [],
  userGrowth: [],
};

function buildTechDistribution(
  items: AdminDashboardSummary["techDistribution"],
) {
  const grouped = new Map<string, { name: string; total: number }>();

  for (const item of items) {
    const name = item.name.trim();
    if (!name) continue;

    const key = name.toLowerCase();
    const existing = grouped.get(key);
    grouped.set(key, {
      name: existing?.name ?? name,
      total: (existing?.total ?? 0) + item.total,
    });
  }

  const normalized = [...grouped.values()]
    .sort((left, right) => right.total - left.total)
    .slice(0, 6);
  const total = normalized.reduce((sum, item) => sum + item.total, 0);

  if (total <= 0) {
    return [];
  }

  const colorByTech = assignTechColors(normalized.map((item) => item.name));

  const withRemainders = normalized.map((item) => {
    const rawPercentage = (item.total / total) * 100;
    const colorKey = item.name.toLowerCase().trim();
    return {
      ...item,
      color: colorByTech.get(colorKey) ?? "#94a3b8",
      percentage: Math.floor(rawPercentage),
      remainder: rawPercentage % 1,
    };
  });

  let remaining = 100 - withRemainders.reduce((sum, item) => sum + item.percentage, 0);
  const remainderOrder = [...withRemainders].sort(
    (left, right) => right.remainder - left.remainder,
  );

  for (const item of remainderOrder) {
    if (remaining <= 0) break;
    item.percentage += 1;
    remaining -= 1;
  }

  return withRemainders.map((item) => ({
    name: item.name,
    total: item.total,
    color: item.color,
    percentage: item.percentage,
  }));
}

function buildTechChartBackground(
  items: ReturnType<typeof buildTechDistribution>,
) {
  if (items.length === 0) return "#e5e7eb";

  let cursor = 0;
  const segments = items.map((item) => {
    const start = cursor;
    cursor += item.percentage;
    return `${item.color} ${start}% ${cursor}%`;
  });

  return `conic-gradient(${segments.join(", ")})`;
}

export function DashboardScreen() {
  const router = useRouter();
  const [headerPortal, setHeaderPortal] = useState<HTMLElement | null>(null);
  const { data, loading } = useRemoteData<AdminDashboardSummary>(
    "/api/admin/dashboard",
    initialDashboard,
  );

  useEffect(() => {
    setHeaderPortal(document.getElementById("header-actions"));
  }, []);

  if (!loading && !data.categoryCounts.length && !data.pendingApprovals.length) {
    return (
      <EmptyState
        title="Dashboard is ready"
        description="Once your users, POCs, feedback, and categories are available, this screen will render the same management overview layout you shared."
      />
    );
  }

  const techDistribution = buildTechDistribution(data.techDistribution);
  const techChartBackground = buildTechChartBackground(techDistribution);

  return (
    <div>
      {headerPortal
        ? createPortal(
            <ActionButton variant="secondary">
              <MaterialIcon className="text-[18px]">download</MaterialIcon>
              Export Data
            </ActionButton>,
            headerPortal,
          )
        : null}

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total POCs"
          value={data.summary.totalPocs}
          icon="assignment"
          chip="+12%"
          onClick={() => router.push("/admin/pocs")}
        />
        <StatCard
          label="Pending Approvals"
          value={data.summary.pendingApprovals}
          icon="fact_check"
          chip="Urgent"
          iconTone="danger"
          onClick={() => router.push("/admin/approvals")}
        />
        <StatCard label="Active Demos" value={data.summary.activeDemos} icon="play_circle" chip="Live" />
        <StatCard
          label="Avg Rating"
          value={data.summary.averageRating.toFixed(1)}
          icon="star"
          chip="Top"
          iconTone="warning"
        />
      </div>

      <div className="grid grid-cols-12 gap-8">
        <SurfaceCard className="col-span-12 p-6 lg:col-span-4">
          <h3 className="mb-6 text-[18px] font-semibold text-on-surface">POCs per Category</h3>
          <div className="space-y-4">
            {data.categoryCounts.map((item, index) => {
              const max = Math.max(...data.categoryCounts.map((entry) => entry.total), 1);
              const colors = ["#3525cd", "#5c00ca", "#565e74", "#777587"];
              return (
                <div key={item.id}>
                  <div className="mb-1 flex justify-between text-[14px]">
                    <span className="text-on-surface">{item.name}</span>
                    <span className="text-on-surface-variant">{item.total}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-container">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(12, (item.total / max) * 100)}%`,
                        backgroundColor: item.color ?? colors[index % colors.length],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </SurfaceCard>

        <SurfaceCard className="col-span-12 p-6 lg:col-span-5">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-[18px] font-semibold text-on-surface">Pending Approvals</h3>
            <span className="rounded bg-error/10 px-2 py-1 text-[12px] font-bold text-error">
              {data.summary.pendingApprovals} Waiting
            </span>
          </div>
          <TableWrapper columns={["POC Name", "Developer", "Actions"]} scrollable>
            {data.pendingApprovals.map((poc) => (
              <TableRow key={poc.id}>
                <TableCell>
                  <p className="text-[14px] font-bold text-on-surface">{poc.title}</p>
                  <p className="text-[10px] text-on-surface-variant">
                    {poc.category?.name ?? "Uncategorized"}
                  </p>
                </TableCell>
                <TableCell className="text-[14px] text-on-surface">{poc.developer?.name ?? "Unknown"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <button className="rounded p-1 text-emerald-600 transition-colors hover:bg-emerald-50" title="Approve">
                      <MaterialIcon>check</MaterialIcon>
                    </button>
                    <button className="rounded p-1 text-error transition-colors hover:bg-error/5" title="Reject">
                      <MaterialIcon>close</MaterialIcon>
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableWrapper>
        </SurfaceCard>

        <SurfaceCard className="col-span-12 flex flex-col p-6 lg:col-span-3">
          <h3 className="mb-6 text-[18px] font-semibold text-on-surface">Tech Distribution</h3>
          <div className="flex flex-1 flex-col items-center justify-center">
            <div
              className="relative h-32 w-32 rounded-full"
              style={{ background: techChartBackground }}
            >
              <div className="absolute inset-5 rounded-full bg-surface" />
            </div>
            <div className="mt-8 w-full space-y-2">
              {techDistribution.map((item) => (
                <div key={item.name.toLowerCase()} className="flex items-center gap-2 text-[14px]">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="flex-1 text-on-surface">{item.name}</span>
                  <span className="font-bold">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
