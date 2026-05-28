import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { CSRF_COOKIE } from "@/lib/csrf-constants";

const COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (refreshToken && apiUrl) {
    await fetch(`${apiUrl.replace(/\/$/, "")}/api/v1/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    }).catch(() => undefined);
  }
  cookieStore.delete(COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
  cookieStore.delete(CSRF_COOKIE);
  return NextResponse.json({ ok: true });
}
