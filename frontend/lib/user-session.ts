import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAccessToken } from "./auth-token";

export async function requireUserSession() {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) {
    redirect("/login");
  }

  try {
    const session = await verifyAccessToken(token);

    if (session.role === "DEVELOPER") {
      redirect("/developer/dashboard");
    }

    if (session.role !== "USER") {
      redirect("/login");
    }

    return session;
  } catch {
    redirect("/login");
  }
}

export async function requireAdminSession() {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) {
    redirect("/login");
  }

  try {
    const session = await verifyAccessToken(token);

    if (session.role === "DEVELOPER") {
      redirect("/developer/dashboard");
    }

    if (session.role === "USER") {
      redirect("/user/dashboard");
    }

    if (session.role !== "ADMIN") {
      redirect("/login");
    }

    return session;
  } catch {
    redirect("/login");
  }
}
