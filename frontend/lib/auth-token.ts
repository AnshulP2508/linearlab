import { jwtVerify } from "jose";

export type SessionPayload = {
  sub?: string;
  email?: string;
  role?: string;
  exp?: number;
  tokenType?: "access" | "refresh";
};

function jwtKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is missing");
  }
  return new TextEncoder().encode(secret);
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, jwtKey());
  return {
    sub: typeof payload.sub === "string" ? payload.sub : undefined,
    email: typeof payload.email === "string" ? payload.email : undefined,
    role: typeof payload.role === "string" ? payload.role : undefined,
    exp: typeof payload.exp === "number" ? payload.exp : undefined,
    tokenType: payload.tokenType === "refresh" ? "refresh" : "access",
  } satisfies SessionPayload;
}
