import { DeveloperShell } from "@/components/developer/DeveloperShell";
import { DeveloperWorkspaceProvider } from "@/components/developer/DeveloperWorkspaceContext";

export default function DeveloperLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <DeveloperWorkspaceProvider>
      <DeveloperShell>{children}</DeveloperShell>
    </DeveloperWorkspaceProvider>
  );
}
