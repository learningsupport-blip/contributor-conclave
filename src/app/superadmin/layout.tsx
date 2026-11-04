import { WorkspaceShell } from "@/components/shell/workspace-shell";
import { enforcePageRole } from "@/lib/auth/authorization";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await enforcePageRole("SUPERADMIN");

  return <WorkspaceShell>{children}</WorkspaceShell>;
}
