import { WorkspaceShell } from "@/components/shell/workspace-shell";
import { enforcePageRole } from "@/lib/auth/authorization";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await enforcePageRole("ADMIN");

  return <WorkspaceShell>{children}</WorkspaceShell>;
}
