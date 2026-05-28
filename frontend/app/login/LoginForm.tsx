"use client";

import { CSRF_COOKIE } from "@/lib/csrf-constants";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

function readCookie(name: string) {
  return document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.split("=")[1];
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": readCookie(CSRF_COOKIE) ?? "",
        },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { role?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Sign in failed");
        return;
      }
      const role = data.role;
      const from = searchParams.get("from");
      if (from && from.startsWith("/")) {
        router.replace(from);
        return;
      }
      if (role === "ADMIN") router.replace("/admin/dashboard");
      else if (role === "DEVELOPER") router.replace("/developer/dashboard");
      else if (role === "USER") router.replace("/user/dashboard");
      else setError("This account type is not supported in this app");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-muted px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-navy">
            POC Management
          </h1>
          <p className="mt-2 text-sm text-navy-accent">
            Sign in with your assigned account
          </p>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-navy"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-navy outline-none ring-navy-accent/30 transition focus:ring-2"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-navy"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-navy outline-none ring-navy-accent/30 transition focus:ring-2"
            />
          </div>
          {error ? (
            <p className="text-center text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-navy py-3 text-sm font-semibold text-white transition hover:bg-navy-mid disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
