"use client";

import { cn, MaterialIcon } from "./admin/primitives";

export function LogoutButton({
  compact = false,
}: {
  compact?: boolean;
}) {
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <button
      type="button"
      onClick={() => void logout()}
      className={cn(
        compact
          ? "inline-flex items-center gap-2 rounded-xl border border-rose-200/40 bg-rose-500/10 px-4 py-2 text-[14px] font-semibold text-white transition-all hover:bg-rose-500/20"
          : "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[14px] text-error transition-all hover:bg-error/10",
      )}
    >
      <MaterialIcon>logout</MaterialIcon>
      <span className="font-medium">Logout</span>
    </button>
  );
}
