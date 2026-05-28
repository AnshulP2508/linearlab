"use client";

import Link from "next/link";
import { EmptyState, MaterialIcon, SearchPill, SurfaceCard } from "@/components/admin/primitives";
import { useRemoteData } from "@/components/admin/useRemoteData";
import { PaginatedResponse } from "@/types/admin";
import { UserPocSummary } from "@/types/user";
import { useMemo, useState } from "react";
import { formatDate, initials } from "./userUtils";

const initialPocs: PaginatedResponse<UserPocSummary> = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 100,
};

function StarRating({ value, count }: { value: number; count?: number }) {
  return (
    <div className="flex items-center gap-1 text-[14px]">
      <div className="flex items-center gap-0.5 text-amber-500">
        {Array.from({ length: 5 }).map((_, index) => (
          <MaterialIcon
            key={index}
            className="text-[15px]"
            filled={index < Math.round(value)}
          >
            star
          </MaterialIcon>
        ))}
      </div>
      <span className="font-semibold text-on-surface">{value.toFixed(1)}</span>
      <span className="text-on-surface-variant">({count ?? 0})</span>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      {Array.from({ length: 6 }).map((_, index) => (
        <SurfaceCard key={index} className="p-6">
          <div className="animate-pulse lg:flex lg:items-start lg:justify-between lg:gap-6">
            <div className="space-y-4 lg:flex-1">
              <div className="h-6 w-2/3 rounded-lg bg-surface-container-high" />
              <div className="h-4 w-40 rounded-lg bg-surface-container-high" />
              <div className="h-16 rounded-2xl bg-surface-container-high" />
              <div className="flex gap-2">
                <div className="h-7 w-20 rounded-full bg-surface-container-high" />
                <div className="h-7 w-24 rounded-full bg-surface-container-high" />
              </div>
            </div>
            <div className="mt-5 space-y-4 lg:mt-0 lg:w-[320px] lg:shrink-0">
              <div className="h-32 rounded-2xl bg-surface-container-high" />
              <div className="h-11 rounded-xl bg-surface-container-high" />
            </div>
          </div>
        </SurfaceCard>
      ))}
    </div>
  );
}

export function UserDashboardScreen() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [sortBy, setSortBy] = useState("latest");
  const { data, loading } = useRemoteData<PaginatedResponse<UserPocSummary>>(
    "/api/user/pocs",
    initialPocs,
  );

  const categoryOptions = useMemo(() => {
    return [
      { id: "ALL", name: "All Categories" },
      ...data.items
        .map((item) => item.category)
        .filter((item): item is NonNullable<UserPocSummary["category"]> => Boolean(item))
        .filter(
          (item, index, array) => array.findIndex((entry) => entry.id === item.id) === index,
        ),
    ];
  }, [data.items]);

  const filtered = useMemo(() => {
    const next = data.items.filter((item) => {
      const text = `${item.title} ${item.description} ${item.summary}`.toLowerCase();
      if (search && !text.includes(search.toLowerCase())) return false;
      if (category !== "ALL" && item.category?.id !== category) return false;
      return true;
    });

    return next.sort((left, right) => {
      if (sortBy === "highest-rated") {
        return right.ratingAverage - left.ratingAverage || right.ratingCount - left.ratingCount;
      }
      return (
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      );
    });
  }, [category, data.items, search, sortBy]);

  const selectCls =
    "rounded-xl border border-outline-variant bg-white px-4 py-2.5 text-[14px] text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h1 className="text-[30px] font-semibold tracking-tight text-primary sm:text-[36px]">
          User Dashboard
        </h1>
      </div>

      <div className="rounded-2xl border border-outline-variant bg-surface-container-low/60 p-4 shadow-[var(--shadow-soft)]">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_200px]">
        <SearchPill
          value={search}
          onChange={setSearch}
          placeholder="Search POCs..."
          className="lg:min-w-0"
        />
        <select
          className={selectCls}
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          {categoryOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
        <select
          className={selectCls}
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
        >
          <option value="latest">Latest</option>
          <option value="highest-rated">Highest Rated</option>
        </select>
      </div>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No POCs found"
          description="Try another search or filter combination to discover available proofs of concept."
        />
      ) : (
        <div className="flex flex-col gap-5">
          {filtered.map((poc) => (
            <SurfaceCard key={poc.id} className="p-6">
              <div className="flex h-full flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="break-words text-[20px] font-semibold text-on-surface">
                        {poc.title}
                      </h2>
                      <p className="mt-1 text-[13px] text-on-surface-variant">
                        Published {formatDate(poc.createdAt)}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-[15px] leading-7 break-words text-on-surface-variant">
                    {poc.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {poc.technologies.slice(0, 3).map((tech) => (
                      <span
                        key={tech}
                        className="rounded-full bg-surface-container-low px-3 py-1 text-[12px] font-semibold text-primary"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  {poc.category ? (
                    <p className="mt-3 text-[13px] font-medium text-on-surface-variant">
                      <span className="font-semibold text-on-surface">Category:</span>{" "}
                      {poc.category.name}
                    </p>
                  ) : null}
                </div>

                <div className="flex w-full flex-col gap-4 lg:w-[320px] lg:shrink-0">
                  <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-container text-[14px] font-bold text-white">
                        {initials(poc.developer?.name ?? "Developer")}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold text-on-surface">
                          {poc.developer?.name ?? "Assigned Developer"}
                        </p>
                        <p className="truncate text-[12px] text-on-surface-variant">
                          {poc.developer?.team ?? "Product Delivery"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <StarRating value={poc.ratingAverage} count={poc.feedbacks.length} />
                      <span className="text-[12px] font-medium text-on-surface-variant">
                        {poc.feedbacks.length} feedback
                        {poc.feedbacks.length === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/user/poc/${poc.id}`}
                    className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-4 py-3 text-[14px] font-semibold text-white transition hover:opacity-95"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </SurfaceCard>
          ))}
        </div>
      )}
    </div>
  );
}
