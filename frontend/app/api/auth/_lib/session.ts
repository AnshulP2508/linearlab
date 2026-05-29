import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ensureCsrfCookie } from "@/lib/csrf";

const COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";

type AuthTokens = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  role: string;
};

export function authApiUrl(path: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_API_URL. Add it to frontend/.env.local (see .env.example).",
    );
  }
  return `${apiUrl.replace(/\/$/, "")}/api/v1/auth/${path.replace(/^\//, "")}`;
}

export async function parseAuthFailure(response: Response) {
  const failure = (await response.json().catch(() => null)) as
    | { error?: { message?: string | string[] }; message?: string | string[] }
    | null;
  const rawMessage = failure?.error?.message ?? failure?.message;
  if (Array.isArray(rawMessage)) {
    return rawMessage.join(", ");
  }
  if (rawMessage) {
    return rawMessage;
  }
  if (response.status === 429) {
    return "Too many attempts. Please wait and try again.";
  }
  if (response.status >= 500) {
    return "Authentication service unavailable";
  }
  return "Request failed";
}

export async function setAuthCookies(data: AuthTokens) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE, data.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: data.expires_in,
  });
  cookieStore.set(REFRESH_COOKIE, data.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  await ensureCsrfCookie();
  return NextResponse.json({ role: data.role });
}

export async function forwardAuthJson(path: string, body: unknown) {
  const response = await fetch(authApiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: await parseAuthFailure(response) },
      { status: response.status },
    );
  }

  const data = (await response.json()) as unknown;
  return NextResponse.json(data, { status: response.status });
}
