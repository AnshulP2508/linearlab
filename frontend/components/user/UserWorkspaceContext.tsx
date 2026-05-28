"use client";

import { Toast } from "@/components/admin/primitives";
import { UserProfile } from "@/types/user";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

type ToastState = {
  message: string;
  tone?: "success" | "danger";
} | null;

type UserWorkspaceContextValue = {
  profile: UserProfile | null;
  loading: boolean;
  toast: ToastState;
  setToast: (toast: ToastState) => void;
};

const UserWorkspaceContext = createContext<UserWorkspaceContextValue | null>(null);

export function UserWorkspaceProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/user/me", { cache: "no-store" });
        const body = (await response.json()) as UserProfile & { error?: string };
        if (!response.ok) {
          throw new Error(body.error ?? "Failed to load profile");
        }
        if (!cancelled) {
          setProfile(body);
        }
      } catch {
        if (!cancelled) {
          setProfile(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <UserWorkspaceContext.Provider value={{ profile, loading, toast, setToast }}>
      {children}
      {toast ? <Toast message={toast.message} tone={toast.tone} /> : null}
    </UserWorkspaceContext.Provider>
  );
}

export function useUserWorkspace() {
  const value = useContext(UserWorkspaceContext);
  if (!value) {
    throw new Error("useUserWorkspace must be used inside UserWorkspaceProvider");
  }
  return value;
}
