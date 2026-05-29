import { NextResponse } from "next/server";
import { forwardAuthJson } from "../_lib/session";

export async function POST(request: Request) {
  let body: { email?: string; otp?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  return forwardAuthJson("verify-otp", {
    email: body.email,
    otp: body.otp,
  });
}
