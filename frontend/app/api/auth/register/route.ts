import { NextResponse } from "next/server";
import { authApiUrl, parseAuthFailure, setAuthCookies } from "../_lib/session";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let url: string;
  try {
    url = authApiUrl("register");
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Missing API URL" },
      { status: 500 },
    );
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: body.email,
      password: body.password,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: await parseAuthFailure(res) },
      { status: res.status },
    );
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    role: string;
  };

  return setAuthCookies(data);
}
