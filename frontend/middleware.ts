import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifyAccessToken } from "./lib/auth-token";

const COOKIE = "access_token";

const roleDashboard: Record<string, string> = {
  ADMIN: "/admin/dashboard",
  DEVELOPER: "/developer/dashboard",
  USER: "/user/dashboard",
};

function pathRequiredRole(pathname: string): string | null {
  if (pathname.startsWith("/admin")) return "ADMIN";
  if (pathname.startsWith("/developer")) return "DEVELOPER";
  if (pathname.startsWith("/user")) return "USER";
  return null;
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE)?.value;

  let role: string | undefined;
  if (token) {
    try {
      const payload = await verifyAccessToken(token);
      role = payload.tokenType === "access" ? payload.role : undefined;
    } catch (error) {
      console.warn("JWT verification failed", error);
      role = undefined;
    }
  }

  const { pathname } = request.nextUrl;

  if (pathname === "/login") {
    if (role && roleDashboard[role]) {
      return NextResponse.redirect(
        new URL(roleDashboard[role], request.url),
      );
    }
    return NextResponse.next();
  }

  const required = pathRequiredRole(pathname);
  if (!required) {
    return NextResponse.next();
  }

  if (!process.env.JWT_SECRET) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!role) {
    const login = new URL("/login", request.url);
    login.searchParams.set("from", pathname);
    return NextResponse.redirect(login);
  }

  if (role !== required) {
    const dest = roleDashboard[role] ?? "/login";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/admin/:path*", "/developer/:path*", "/user/:path*"],
};
