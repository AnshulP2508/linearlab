import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminSession } from "@/lib/user-session";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdminSession();

  return <AdminShell>{children}</AdminShell>;
}
