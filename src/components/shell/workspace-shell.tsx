import type { ReactNode } from "react";

export function WorkspaceShell({ children }: { children: ReactNode }) {
  return <div className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-8 sm:px-6">{children}</div>;
}
