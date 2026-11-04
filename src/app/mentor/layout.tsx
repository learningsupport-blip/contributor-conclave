import { WorkspaceShell } from "@/components/shell/workspace-shell";
import { enforcePageRole } from "@/lib/auth/authorization";

export default async function MentorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await enforcePageRole("MENTOR");

  return <WorkspaceShell>{children}</WorkspaceShell>;
}
