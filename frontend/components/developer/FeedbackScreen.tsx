"use client";

import { SearchPill, SurfaceCard } from "@/components/admin/primitives";
import { useMemo, useState } from "react";
import { useDeveloperWorkspace } from "./DeveloperWorkspaceContext";
import { formatDate } from "./developerUtils";

const feedbackTypeLabel: Record<string, string> = {
  USER_FEEDBACK: "User Feedback",
  ADMIN_COMMENT: "Admin Comment",
  BUG_REPORT: "Bug Report",
  IMPROVEMENT_SUGGESTION: "Improvement Suggestion",
};

function isWorkflowFeedback(item: {
  id: string;
  comment: string;
  user: { id: string; name: string };
}) {
  if (item.id.endsWith("-admin-comment") || item.id.endsWith("-bug-report")) {
    return true;
  }

  if (item.user.id === "admin" && item.user.name === "Admin Review Team") {
    return true;
  }

  const comment = item.comment.trim().toLowerCase();
  return (
    comment === "kept in pending review." ||
    comment === "needs review updates and documentation fixes."
  );
}

export function FeedbackScreen() {
  const { feedback, pocs } = useDeveloperWorkspace();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("ALL");

  const pocLookup = useMemo(
    () => new Map(pocs.map((poc) => [poc.id, poc.title])),
    [pocs],
  );

  const groupedFeedback = useMemo(() => {
    const filtered = feedback.filter((item) => {
      if (isWorkflowFeedback(item)) return false;
      if (type !== "ALL" && item.type !== type) return false;
      const pocTitle = pocLookup.get(item.pocId) ?? "Assigned POC";
      const text = `${pocTitle} ${item.comment} ${item.user.name}`.toLowerCase();
      return !search || text.includes(search.toLowerCase());
    });

    const groups = new Map<
      string,
      {
        pocId: string;
        pocTitle: string;
        items: typeof filtered;
        latestCreatedAt: string;
      }
    >();

    filtered.forEach((item) => {
      const existing = groups.get(item.pocId);
      if (existing) {
        existing.items.push(item);
        if (
          new Date(item.createdAt).getTime() >
          new Date(existing.latestCreatedAt).getTime()
        ) {
          existing.latestCreatedAt = item.createdAt;
        }
        return;
      }

      groups.set(item.pocId, {
        pocId: item.pocId,
        pocTitle: pocLookup.get(item.pocId) ?? "Assigned POC",
        items: [item],
        latestCreatedAt: item.createdAt,
      });
    });

    return Array.from(groups.values()).sort(
      (a, b) =>
        new Date(b.latestCreatedAt).getTime() -
        new Date(a.latestCreatedAt).getTime(),
    );
  }, [feedback, pocLookup, search, type]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_200px]">
        <SearchPill
          value={search}
          onChange={setSearch}
          placeholder="Search feedback..."
        />
        <select
          className="rounded-lg border border-outline-variant bg-white px-3 py-1.5 text-[13px] outline-none focus:border-primary"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="ALL">All Feedback Types</option>
          <option value="USER_FEEDBACK">User Feedback</option>
          <option value="ADMIN_COMMENT">Admin Comments</option>
          <option value="BUG_REPORT">Bug Reports</option>
          <option value="IMPROVEMENT_SUGGESTION">Improvement Suggestions</option>
        </select>
      </div>

      <div className="grid gap-4">
        {groupedFeedback.length === 0 ? (
          <SurfaceCard className="p-8 text-center text-[13px] text-on-surface-variant">
            No feedback to review yet.
          </SurfaceCard>
        ) : null}
        {groupedFeedback.map((group) => (
          <SurfaceCard key={group.pocId} className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
                    Feedback Summary
                  </p>
                  <h2 className="mt-0.5 text-[16px] font-semibold leading-tight">{group.pocTitle}</h2>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                  {group.items.length} {group.items.length === 1 ? "entry" : "entries"}
                </span>
              </div>
              <p className="text-[12px] text-on-surface-variant">
                Updated {formatDate(group.latestCreatedAt)}
              </p>
            </div>

            <div className="mt-3 space-y-2">
              {group.items
                .slice()
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                )
                .map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-outline-variant/60 bg-surface-container-low px-3.5 py-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-primary">
                          {feedbackTypeLabel[item.type]}
                        </span>
                        <span className="text-[11px] text-outline-variant">•</span>
                        <span className="text-[13px] font-medium text-on-surface-variant">
                          {item.user.name}
                        </span>
                      </div>
                      <p className="text-[12px] text-on-surface-variant">
                        {formatDate(item.createdAt)}
                      </p>
                    </div>

                    {item.rating > 0 ? (
                      <p className="mt-1.5 text-[13px] font-semibold text-amber-700">
                        Rating{" "}
                        <span className="font-normal text-on-surface-variant">({item.rating}/5)</span>
                      </p>
                    ) : null}

                    <p className="mt-1.5 text-[13px] leading-5 text-on-surface-variant">
                      {item.comment}
                    </p>
                  </div>
                ))}
            </div>
          </SurfaceCard>
        ))}
      </div>
    </div>
  );
}
