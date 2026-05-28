"use client";

import { useEffect, useState } from "react";
import { extractApiErrorMessage } from "./usePocs";

export function useRemoteData<T>(url: string, initialValue: T) {
  const [data, setData] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(url, { cache: "no-store" });
        const body = await response.json();
        if (!response.ok) {
          throw new Error(
            extractApiErrorMessage(
              body as { message?: string | string[]; error?: string | { message?: string | string[] } } | null,
              "Request failed",
            ),
          );
        }
        if (!cancelled) {
          setData(body);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Request failed");
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
  }, [url]);

  return { data, loading, error, setData };
}
