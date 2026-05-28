import { HeaderActionsProvider } from "@/components/admin/HeaderActionsContext";
import { UserShell } from "@/components/user/UserShell";
import { UserWorkspaceProvider } from "@/components/user/UserWorkspaceContext";
import { requireUserSession } from "@/lib/user-session";

export default async function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireUserSession();

  return (
    <UserWorkspaceProvider>
      <HeaderActionsProvider>
        <UserShell>{children}</UserShell>
      </HeaderActionsProvider>
    </UserWorkspaceProvider>
  );
}
