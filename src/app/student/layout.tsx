import { WorkspaceShell } from "@/components/shell/workspace-shell";
import { enforcePageRole } from "@/lib/auth/authorization";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await enforcePageRole("STUDENT");

  return <WorkspaceShell>{children}</WorkspaceShell>;
}
