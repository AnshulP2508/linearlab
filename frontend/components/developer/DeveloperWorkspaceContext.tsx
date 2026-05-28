"use client";

import { Toast } from "@/components/admin/primitives";
import {
  DeveloperFeedbackItem,
  DeveloperPocDetail,
  DeveloperPocSummary,
  DeveloperPocUpdatePayload,
  DeveloperProfile,
} from "@/types/developer";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type ToastState = {
  message: string;
  tone?: "success" | "danger";
} | null;

type DeveloperWorkspaceContextValue = {
  profile: DeveloperProfile | null;
  pocs: DeveloperPocSummary[];
  feedback: DeveloperFeedbackItem[];
  loading: boolean;
  toast: ToastState;
  setToast: (toast: ToastState) => void;
  refreshAll: () => Promise<void>;
  refreshPocs: () => Promise<void>;
  refreshFeedback: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  getPocDetail: (id: string) => Promise<DeveloperPocDetail>;
  updatePoc: (
    id: string,
    payload: DeveloperPocUpdatePayload,
  ) => Promise<DeveloperPocDetail>;
  updateProfile: (payload: {
    name?: string;
    avatarUrl?: string;
    skills?: string[];
  }) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
};

const DeveloperWorkspaceContext =
  createContext<DeveloperWorkspaceContextValue | null>(null);

async function apiJson<T>(input: string, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(body.error ?? "Request failed");
  }
  return body;
}

export function DeveloperWorkspaceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [profile, setProfile] = useState<DeveloperProfile | null>(null);
  const [pocs, setPocs] = useState<DeveloperPocSummary[]>([]);
  const [feedback, setFeedback] = useState<DeveloperFeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>(null);

  const refreshProfile = useCallback(async () => {
    const body = await apiJson<DeveloperProfile>("/api/developer/me");
    setProfile(body);
  }, []);

  const refreshPocs = useCallback(async () => {
    const body = await apiJson<DeveloperPocSummary[]>("/api/developer/pocs");
    setPocs(body);
  }, []);

  const refreshFeedback = useCallback(async () => {
    const body = await apiJson<DeveloperFeedbackItem[]>("/api/developer/feedback");
    setFeedback(body);
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([refreshProfile(), refreshPocs(), refreshFeedback()]);
    } finally {
      setLoading(false);
    }
  }, [refreshFeedback, refreshPocs, refreshProfile]);

  const getPocDetail = useCallback(async (id: string) => {
    return apiJson<DeveloperPocDetail>(`/api/developer/pocs/${id}`);
  }, []);

  const updatePoc = useCallback(async (id: string, payload: DeveloperPocUpdatePayload) => {
    const body = await apiJson<DeveloperPocDetail>(`/api/developer/pocs/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    await Promise.all([refreshPocs(), refreshProfile(), refreshFeedback()]);
    setToast({ message: "POC updated successfully", tone: "success" });
    return body;
  }, [refreshFeedback, refreshPocs, refreshProfile]);

  const updateProfile = useCallback(async (payload: {
    name?: string;
    avatarUrl?: string;
    skills?: string[];
  }) => {
    await apiJson("/api/developer/profile", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    await refreshProfile();
    setToast({ message: "Profile updated successfully", tone: "success" });
  }, [refreshProfile]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await apiJson("/api/developer/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setToast({ message: "Password changed successfully", tone: "success" });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshAll();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshAll]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <DeveloperWorkspaceContext.Provider
      value={{
        profile,
        pocs,
        feedback,
        loading,
        toast,
        setToast,
        refreshAll,
        refreshPocs,
        refreshFeedback,
        refreshProfile,
        getPocDetail,
        updatePoc,
        updateProfile,
        changePassword,
      }}
    >
      {children}
      {toast ? <Toast message={toast.message} tone={toast.tone} /> : null}
    </DeveloperWorkspaceContext.Provider>
  );
}

export function useDeveloperWorkspace() {
  const value = useContext(DeveloperWorkspaceContext);
  if (!value) {
    throw new Error("useDeveloperWorkspace must be used inside DeveloperWorkspaceProvider");
  }
  return value;
}
