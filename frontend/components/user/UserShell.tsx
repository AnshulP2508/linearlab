"use client";

import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { MaterialIcon } from "@/components/admin/primitives";
import { ReactNode } from "react";
import { useUserWorkspace } from "./UserWorkspaceContext";
import { initials } from "./userUtils";

export function UserShell({ children }: { children: ReactNode }) {
  const { profile } = useUserWorkspace();

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <header className="sticky top-0 z-40 border-b border-on-secondary-fixed-variant/20 bg-inverse-surface shadow-lg">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4 py-4 sm:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <Link
              href="/user/dashboard"
              className="flex shrink-0 items-center rounded-xl px-2 transition-opacity hover:opacity-90"
            >
              <img
                src="/linearlab-logo.png"
                alt="LinearLab"
                width={220}
                height={32}
                className="block h-8 w-auto object-contain object-left"
              />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/user/profile"
              className="inline-flex items-center gap-3 rounded-xl border border-white/15 bg-white/6 px-3 py-2 text-white transition hover:bg-white/12"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-container text-[13px] font-bold text-white">
                {initials(profile?.name ?? "User")}
              </div>
              <div className="hidden min-w-0 text-left sm:block">
                <p className="truncate text-[13px] font-semibold leading-tight">
                  {profile?.name ?? "Profile"}
                </p>
                <p className="truncate text-[11px] text-white/70">
                  {profile?.email ?? "Loading profile..."}
                </p>
              </div>
              <MaterialIcon className="text-[18px] text-white/80">person</MaterialIcon>
            </Link>
            <LogoutButton compact />
          </div>
        </div>
      </header>

      <main className="hero-gradient">
        <div className="mx-auto max-w-[1280px] px-4 py-4 sm:px-8 sm:py-5">{children}</div>
      </main>
    </div>
  );
}
