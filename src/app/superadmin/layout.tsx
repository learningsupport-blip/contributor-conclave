import { redirect } from "next/navigation";

import { WorkspaceShell } from "@/components/shell/workspace-shell";
import { getCurrentUser } from "@/lib/auth/session";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "SUPERADMIN" && !(user.screens && user.screens.length > 0)) {
    redirect("/forbidden");
  }

  return <WorkspaceShell>{children}</WorkspaceShell>;
}
