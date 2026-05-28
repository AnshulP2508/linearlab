"use client";

import { LogoutButton } from "@/components/LogoutButton";
import {
  MaterialIcon,
  SidebarLink,
} from "@/components/admin/primitives";
import { useDeveloperWorkspace } from "./DeveloperWorkspaceContext";
import { initials } from "./developerUtils";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";

const navItems = [
  { href: "/developer/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/developer/assigned-pocs", label: "Assigned POCs", icon: "assignment" },
  { href: "/developer/feedback", label: "Feedback", icon: "chat" },
  { href: "/developer/profile", label: "Profile", icon: "person" },
];

const routeMeta: Record<string, string> = {
  "/developer/dashboard": "Developer Dashboard",
  "/developer/assigned-pocs": "Assigned POCs",
  "/developer/feedback": "Feedback Review",
  "/developer/profile": "Developer Profile",
};

export function DeveloperShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { profile } = useDeveloperWorkspace();
  const [mobileOpen, setMobileOpen] = useState(false);
  const topTitle =
    routeMeta[pathname] ??
    (pathname.startsWith("/developer/pocs/") ? "POC Details" : "Developer Workspace");

  const sidebar = (
    <aside className="flex h-full w-[280px] flex-col overflow-y-auto border-r border-on-secondary-fixed-variant bg-inverse-surface py-8 shadow-lg">
      <div className="mb-8 px-6">
        <img
          src="/linearlab-logo.png"
          alt="LinearLab"
          className="h-auto w-full"
        />
      </div>

      <nav className="flex-1">
        {navItems.map((item) => (
          <div key={item.href} onClick={() => setMobileOpen(false)}>
            <SidebarLink
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={pathname === item.href}
            />
          </div>
        ))}
      </nav>

      <div className="mx-4 mt-6 rounded-2xl border border-on-secondary-fixed-variant/30 bg-white/5 p-4 text-primary-fixed">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-container text-[14px] font-bold text-white">
            {initials(profile?.name ?? "Developer")}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold text-white">
              {profile?.name ?? "Developer"}
            </p>
            <p className="truncate text-[12px] text-secondary-fixed-dim">
              {profile?.email ?? "Loading profile..."}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-auto border-t border-on-secondary-fixed-variant/20 px-2 pt-6">
        <div className="mx-2 mt-1">
          <LogoutButton />
        </div>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:block">{sidebar}</div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-on-background/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0">{sidebar}</div>
        </div>
      ) : null}

      <main className="min-h-screen lg:ml-[280px]">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-outline-variant bg-surface/80 px-4 shadow-sm backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant bg-white lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <MaterialIcon>menu</MaterialIcon>
            </button>
            <span className="text-[22px] font-semibold text-primary">{topTitle}</span>
          </div>
          <div className="flex items-center gap-4" id="header-actions" />
        </header>

        <div className="mx-auto max-w-[1440px] p-4 sm:p-8">{children}</div>
      </main>
    </div>
  );
}
