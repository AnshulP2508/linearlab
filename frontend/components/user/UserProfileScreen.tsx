"use client";

import { EmptyState, MaterialIcon, SurfaceCard } from "@/components/admin/primitives";
import { useUserWorkspace } from "./UserWorkspaceContext";
import { formatDate, initials } from "./userUtils";

export function UserProfileScreen() {
  const { loading, profile } = useUserWorkspace();

  if (loading) {
    return (
      <SurfaceCard className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-56 rounded-xl bg-surface-container-high" />
          <div className="h-24 rounded-2xl bg-surface-container-high" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-24 rounded-2xl bg-surface-container-high" />
            <div className="h-24 rounded-2xl bg-surface-container-high" />
          </div>
        </div>
      </SurfaceCard>
    );
  }

  if (!profile) {
    return (
      <EmptyState
        title="Profile unavailable"
        description="We could not load your account details right now. Please refresh and try again."
      />
    );
  }

  const items = [
    { label: "Name", value: profile.name },
    { label: "Email", value: profile.email },
    { label: "Team", value: profile.team ?? "Product Delivery" },
    { label: "Member Since", value: formatDate(profile.createdAt) },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-[30px] font-semibold tracking-tight text-primary sm:text-[36px]">
          My Profile
        </h1>
        <p className="max-w-3xl text-[15px] leading-7 text-on-surface-variant">
          Review your account details and the workspace identity shown across the user dashboard.
        </p>
      </div>

      <SurfaceCard className="overflow-hidden">
        <div className="bg-surface-container-low/70 px-6 py-8 sm:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-primary-container text-[26px] font-bold text-white">
                {initials(profile.name)}
              </div>
              <div>
                <h2 className="text-[24px] font-semibold text-on-surface">{profile.name}</h2>
                <p className="text-[14px] text-on-surface-variant">{profile.email}</p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 self-start rounded-full bg-primary/10 px-4 py-2 text-[13px] font-semibold text-primary">
              <MaterialIcon className="text-[16px]">person</MaterialIcon>
              User account
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
          {items.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-outline-variant bg-surface-container-low p-5"
            >
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                {item.label}
              </p>
              <p className="mt-3 break-words text-[18px] font-semibold text-on-surface">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </SurfaceCard>
    </div>
  );
}
