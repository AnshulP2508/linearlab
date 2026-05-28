import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ensureCsrfCookie } from "@/lib/csrf";

const COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";

export async function POST(request: Request) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    return NextResponse.json(
      {
        error:
          "Missing NEXT_PUBLIC_API_URL. Add it to frontend/.env.local (see .env.example).",
      },
      { status: 500 },
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const res = await fetch(`${apiUrl.replace(/\/$/, "")}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: body.email,
      password: body.password,
    }),
  });

  if (!res.ok) {
    const failure = (await res.json().catch(() => null)) as
      | { error?: { message?: string }; message?: string }
      | null;
    return NextResponse.json(
      {
        error:
          failure?.error?.message ??
          failure?.message ??
          (res.status === 429
            ? "Too many login attempts. Please wait and try again."
            : res.status >= 500
            ? "Authentication service unavailable"
            : "Invalid email or password"),
      },
      { status: res.status === 401 || res.status === 403 ? 401 : res.status },
    );
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    role: string;
  };

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
