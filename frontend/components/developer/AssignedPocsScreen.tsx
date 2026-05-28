"use client";

import Link from "next/link";
import { SearchPill, SurfaceCard } from "@/components/admin/primitives";
import { useMemo, useState } from "react";
import { useRemoteData } from "@/components/admin/useRemoteData";
import { DeveloperPriorityBadge } from "./DeveloperPriorityBadge";
import { DeveloperStatusBadge } from "./DeveloperStatusBadge";
import { formatDate, relativeDeadlineTone } from "./developerUtils";
import { DeveloperPocSummary } from "@/types/developer";

export function AssignedPocsScreen() {
  const [now] = useState(() => Date.now());
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [priority, setPriority] = useState("ALL");
  const [deadline, setDeadline] = useState("ALL");

  const { data: items } = useRemoteData<DeveloperPocSummary[]>(
    "/api/developer/pocs",
    [],
  );

  const filtered = useMemo(() => {
    return items.filter((poc) => {
      const text = `${poc.title} ${poc.summary}`.toLowerCase();
      if (search && !text.includes(search.toLowerCase())) return false;
      if (status !== "ALL" && poc.stage !== status) return false;
      if (priority !== "ALL" && poc.priority !== priority) return false;
      if (deadline !== "ALL") {
        const days = Math.ceil(
          (new Date(poc.deadline).getTime() - now) / (1000 * 60 * 60 * 24),
        );
        if (deadline === "THIS_WEEK" && days > 7) return false;
        if (deadline === "THIS_MONTH" && days > 30) return false;
        if (deadline === "OVERDUE" && days >= 0) return false;
      }
      return true;
    });
  }, [deadline, items, now, priority, search, status]);

  const selectCls =
    "rounded-xl border border-outline-variant bg-white px-3 py-2 text-[14px] outline-none focus:border-primary";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_160px_160px_160px]">
        <SearchPill
          value={search}
          onChange={setSearch}
          placeholder="Search assigned POCs..."
        />
        <select className={selectCls} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="ALL">All Statuses</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DEVELOPMENT_COMPLETED">Development Completed</option>
          <option value="UNDER_ADMIN_REVIEW">Under Review</option>
          <option value="PUBLISHED">Published</option>
        </select>
        <select className={selectCls} value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="ALL">All Priorities</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <select className={selectCls} value={deadline} onChange={(e) => setDeadline(e.target.value)}>
          <option value="ALL">All Deadlines</option>
          <option value="THIS_WEEK">Due This Week</option>
          <option value="THIS_MONTH">Due This Month</option>
          <option value="OVERDUE">Overdue</option>
        </select>
      </div>

      <div className="grid gap-5">
        {filtered.map((poc) => (
          <SurfaceCard key={poc.id} className="p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-[20px] font-semibold">{poc.title}</h2>
                  <DeveloperPriorityBadge priority={poc.priority} />
                  <DeveloperStatusBadge stage={poc.stage} />
                </div>
                <p className="max-w-3xl text-[14px] leading-6 text-on-surface-variant">
                  {poc.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {poc.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-full bg-primary/10 px-3 py-1 text-[12px] font-semibold text-primary"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 rounded-2xl border border-outline-variant bg-surface-container-low p-4 lg:min-w-[250px]">
                <div className="flex items-center justify-between text-[14px]">
                  <span className="text-on-surface-variant">Assigned Date</span>
                  <span>{formatDate(poc.assignedDate)}</span>
                </div>
                <div className="flex items-center justify-between text-[14px]">
                  <span className="text-on-surface-variant">Deadline</span>
                  <span className={relativeDeadlineTone(poc.deadline)}>
                    {formatDate(poc.deadline)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[14px]">
                  <span className="text-on-surface-variant">Assigned By</span>
                  <span>{poc.assignedBy}</span>
                </div>
                <Link
                  href={`/developer/pocs/${poc.id}`}
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-[14px] font-semibold text-white"
                >
                  Open POC
                </Link>
              </div>
            </div>
          </SurfaceCard>
        ))}
      </div>
    </div>
  );
}
