import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { CSRF_COOKIE } from "./csrf-constants";

export async function ensureCsrfCookie() {
  const cookieStore = await cookies();
  const existing = cookieStore.get(CSRF_COOKIE)?.value;
  if (existing) {
    return existing;
  }

  const token = randomUUID();
  cookieStore.set(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
  return token;
}
