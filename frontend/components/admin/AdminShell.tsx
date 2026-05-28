"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { LogoutButton } from "../LogoutButton";
import { SidebarLink } from "./primitives";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/pocs", label: "POCs", icon: "assignment" },
  { href: "/admin/approvals", label: "Approvals", icon: "fact_check" },
];

const routeMeta: Record<
  string,
  { searchPlaceholder: string; topTitle?: string; accountTitle?: string }
> = {
  "/admin/dashboard": {
    searchPlaceholder: "Search POCs, users, or developers...",
    topTitle: "Dashboard Overview",
    accountTitle: "Manager",
  },
  "/admin/users": {
    searchPlaceholder: "Search users...",
    topTitle: "User Management",
    accountTitle: "Manager",
  },
  "/admin/developers": {
    searchPlaceholder: "Search developers...",
    topTitle: "Developers",
    accountTitle: "Manager",
  },
  "/admin/pocs": {
    searchPlaceholder: "Search POCs, developers, or tags...",
    topTitle: "POC Management",
    accountTitle: "Manager",
  },
  "/admin/approvals": {
    searchPlaceholder: "Search approval queue...",
    topTitle: "Approval Queue",
    accountTitle: "Manager",
  },
  "/admin/settings": {
    searchPlaceholder: "Search settings...",
    accountTitle: "Manager",
  },
};

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const meta = routeMeta[pathname] ?? routeMeta["/admin/dashboard"];

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <aside className="fixed left-0 top-0 z-50 flex h-full w-[280px] flex-col overflow-y-auto border-r border-on-secondary-fixed-variant bg-inverse-surface py-8 shadow-lg">
        <div className="mb-8 px-6">
          <Image
            src="/linearlab-logo.png"
            alt="LinearLab Enterprise Suite"
            width={2172}
            height={314}
            priority
            className="h-auto w-full"
          />
        </div>

        <nav className="flex-1">
          {navItems.map((item) => (
            <SidebarLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={pathname === item.href}
            />
          ))}
        </nav>

        <div className="mt-auto border-t border-on-secondary-fixed-variant/20 px-2 pt-6">
          <SidebarLink
            href="/admin/settings"
            icon="settings"
            label="Settings"
            active={pathname === "/admin/settings"}
          />
          <div className="mx-2 mt-1">
            <LogoutButton />
          </div>
        </div>
      </aside>

      <main className="ml-[280px] min-h-screen">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-outline-variant bg-surface/80 px-8 shadow-sm backdrop-blur-md">
          <div className="flex flex-1 items-center gap-4">
            {meta.topTitle ? (
              <span className="text-[24px] font-semibold text-primary">{meta.topTitle}</span>
            ) : null}
          </div>

          <div className="flex items-center gap-4" id="header-actions">
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] p-8">{children}</div>
      </main>
    </div>
  );
}
