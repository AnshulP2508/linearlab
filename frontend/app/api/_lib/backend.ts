import { cookies } from "next/headers";

const COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";

function apiBaseUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error("Missing NEXT_PUBLIC_API_URL");
  }
  return `${apiUrl.replace(/\/$/, "")}/api/v1`;
}

export async function backendRequest(
  path: string,
  init?: RequestInit,
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  const headers = new Headers(init?.headers);
  if (init?.body != null) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response = await fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (response.status === 401) {
    const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;
    if (refreshToken) {
      const refreshResponse = await fetch(`${apiBaseUrl()}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
      });

      if (refreshResponse.ok) {
        const refreshed = (await refreshResponse.json()) as {
          access_token: string;
          refresh_token: string;
          expires_in: number;
        };
        cookieStore.set(COOKIE, refreshed.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/",
          maxAge: refreshed.expires_in,
        });
        cookieStore.set(REFRESH_COOKIE, refreshed.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/",
          maxAge: 60 * 60 * 24 * 14,
        });
        headers.set("Authorization", `Bearer ${refreshed.access_token}`);
        response = await fetch(`${apiBaseUrl()}${path}`, {
          ...init,
          headers,
          cache: "no-store",
        });
      }
    }
  }

  const text = await response.text();
  let body: unknown = null;
  const responseType = response.headers.get("content-type") ?? "";

  if (text) {
    if (responseType.includes("application/json")) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    } else {
      body = text;
    }
  }

  return { response, body };
}
