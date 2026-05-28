"use client";

import { useState, useEffect, useCallback } from "react";
import { CategoryItem } from "@/types/admin";

type ApiErrorBody =
  | {
      message?: string | string[];
      error?: string | { message?: string | string[] };
    }
  | null
  | undefined;

export function extractApiErrorMessage(body: ApiErrorBody, fallback: string) {
  const nestedError = typeof body?.error === "object" && body.error ? body.error.message : undefined;
  const message = nestedError ?? body?.message ?? (typeof body?.error === "string" ? body.error : undefined);

  if (Array.isArray(message)) {
    return message[0] ?? fallback;
  }

  return typeof message === "string" && message.trim() ? message : fallback;
}

export function useCategories() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/categories", { cache: "no-store" });
      if (response.ok) {
        const data = (await response.json()) as CategoryItem[];
        setCategories(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { categories, loading, refresh };
}

export interface RequestPocFormData {
  title: string;
  assignToEmail: string;
  problemStatement: string;
  features: string;
  techStack: string[];
  categoryId: string;
  category?: string;   // free-text category name
  timeline: string;
  budget: string;
  file?: File | null;
}

export async function submitPocRequest(formData: RequestPocFormData): Promise<{ ok: boolean; error?: string }> {
  const fd = new FormData();
  fd.append("title", formData.title.trim());
  fd.append("assignToEmail", formData.assignToEmail.trim());
  fd.append("summary", formData.problemStatement.trim());
  fd.append("description", `${formData.problemStatement.trim()}\n\nFeatures:\n${formData.features.trim()}`);
  fd.append("documentation", formData.features.trim());
  fd.append("status", "PENDING_REVIEW");

  for (const tech of formData.techStack) {
    fd.append("techStack", tech);
  }
  // Also send as technologies array string for backend compatibility
  fd.append("technologies", JSON.stringify(formData.techStack));

  if (formData.categoryId) {
    fd.append("categoryId", formData.categoryId);
  } else if (formData.category?.trim()) {
    fd.append("categoryName", formData.category.trim());
  }
  if (formData.timeline) {
    fd.append("timeline", formData.timeline.trim());
  }
  if (formData.budget) {
    fd.append("budget", formData.budget.trim());
  }
  if (formData.file) {
    fd.append("file", formData.file);
  }

  try {
    const response = await fetch("/api/pocs", {
      method: "POST",
      body: fd,
    });

    if (!response.ok) {
      const err = (await response.json().catch(() => null)) as ApiErrorBody;
      return { ok: false, error: extractApiErrorMessage(err, "Submission failed") };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}
