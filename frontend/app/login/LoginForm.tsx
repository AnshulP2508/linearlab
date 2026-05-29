"use client";

import { CSRF_COOKIE } from "@/lib/csrf-constants";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

type Step = "email" | "signin" | "otp" | "register";

type JsonResponse = {
  exists?: boolean;
  verified?: boolean;
  role?: string;
  error?: string;
};

const roleDashboard: Record<string, string> = {
  ADMIN: "/admin/dashboard",
  DEVELOPER: "/developer/dashboard",
  USER: "/user/dashboard",
};

function readCookie(name: string) {
  return document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.split("=")[1];
}

function csrfHeaders() {
  return {
    "Content-Type": "application/json",
    "X-CSRF-Token": readCookie(CSRF_COOKIE) ?? "",
  };
}

async function postJson(path: string, body: unknown) {
  const response = await fetch(path, {
    method: "POST",
    headers: csrfHeaders(),
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as JsonResponse;
  if (!response.ok) {
    throw new Error(data.error ?? "Request failed");
  }
  return data;
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  function redirectAfterAuth(role?: string) {
    const from = searchParams.get("from");
    if (from && from.startsWith("/")) {
      router.replace(from);
      return;
    }
    const destination = role ? roleDashboard[role] : undefined;
    if (destination) {
      router.replace(destination);
      return;
    }
    setError("This account type is not supported in this app");
  }

  async function onContinue(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const check = await postJson("/api/auth/check-email", {
        email: normalizedEmail,
      });
      if (check.exists) {
        setStep("signin");
        setNotice("Welcome back. Enter your password to continue.");
        return;
      }

      await postJson("/api/auth/send-otp", { email: normalizedEmail });
      setStep("otp");
      setNotice("OTP sent to your email. It expires in 10 minutes.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to continue",
      );
    } finally {
      setLoading(false);
    }
  }

  async function onSignIn(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await postJson("/api/auth/login", {
        email: normalizedEmail,
        password,
      });
      redirectAfterAuth(data.role);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Sign in failed",
      );
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyOtp(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await postJson("/api/auth/verify-otp", {
        email: normalizedEmail,
        otp,
      });
      setStep("register");
      setNotice("Email verified. Create a password to finish signup.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "OTP verification failed",
      );
    } finally {
      setLoading(false);
    }
  }

  async function onCreateAccount(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const data = await postJson("/api/auth/register", {
        email: normalizedEmail,
        password,
      });
      redirectAfterAuth(data.role);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Account creation failed",
      );
    } finally {
      setLoading(false);
    }
  }

  function resetEmail() {
    setStep("email");
    setPassword("");
    setConfirmPassword("");
    setOtp("");
    setError(null);
    setNotice(null);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-surface-container-low px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-on-surface">
            POC Management
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Sign in or create your account
          </p>
        </div>

        {step !== "email" ? (
          <div className="mb-5 rounded-lg bg-surface-container-low px-3 py-2 text-sm text-on-surface-variant">
            <span className="font-medium text-on-surface">{normalizedEmail}</span>
            <button
              type="button"
              onClick={resetEmail}
              className="ml-2 font-semibold text-primary underline-offset-4 hover:underline"
            >
              Change
            </button>
          </div>
        ) : null}

        {step === "email" ? (
          <form onSubmit={onContinue} className="flex flex-col gap-5">
            <AuthInput
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={setEmail}
            />
            <StatusMessages error={error} notice={notice} />
            <SubmitButton loading={loading} label="Continue" loadingLabel="Checking..." />
          </form>
        ) : null}

        {step === "signin" ? (
          <form onSubmit={onSignIn} className="flex flex-col gap-5">
            <AuthInput
              id="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={setPassword}
            />
            <StatusMessages error={error} notice={notice} />
            <SubmitButton loading={loading} label="Sign In" loadingLabel="Signing in..." />
          </form>
        ) : null}

        {step === "otp" ? (
          <form onSubmit={onVerifyOtp} className="flex flex-col gap-5">
            <AuthInput
              id="otp"
              label="Verification code"
              type="text"
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(value) => setOtp(value.replace(/\D/g, "").slice(0, 6))}
            />
            <StatusMessages error={error} notice={notice} />
            <SubmitButton loading={loading} label="Verify OTP" loadingLabel="Verifying..." />
          </form>
        ) : null}

        {step === "register" ? (
          <form onSubmit={onCreateAccount} className="flex flex-col gap-5">
            <AuthInput
              id="new-password"
              label="Password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={setPassword}
            />
            <AuthInput
              id="confirm-password"
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={setConfirmPassword}
            />
            <p className="text-xs text-on-surface-variant">
              Passwords must be at least 8 characters and include an uppercase
              letter, a number, and a special character.
            </p>
            <StatusMessages error={error} notice={notice} />
            <SubmitButton
              loading={loading}
              label="Create Account"
              loadingLabel="Creating account..."
            />
          </form>
        ) : null}
      </div>
    </div>
  );
}

function AuthInput({
  id,
  label,
  type,
  value,
  onChange,
  autoComplete,
  inputMode,
  maxLength,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  inputMode?: "numeric";
  maxLength?: number;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-on-surface">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-on-surface outline-none ring-on-surface-variant/30 transition focus:ring-2"
      />
    </div>
  );
}

function StatusMessages({
  error,
  notice,
}: {
  error: string | null;
  notice: string | null;
}) {
  if (error) {
    return (
      <p className="text-center text-sm text-red-600" role="alert">
        {error}
      </p>
    );
  }
  if (notice) {
    return <p className="text-center text-sm text-on-surface-variant">{notice}</p>;
  }
  return null;
}

function SubmitButton({
  loading,
  label,
  loadingLabel,
}: {
  loading: boolean;
  label: string;
  loadingLabel: string;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="mt-2 w-full rounded-lg bg-primary py-3 text-sm font-semibold text-on-primary transition hover:opacity-90 disabled:opacity-60"
    >
      {loading ? loadingLabel : label}
    </button>
  );
}
