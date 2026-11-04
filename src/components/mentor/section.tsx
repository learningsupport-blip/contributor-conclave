import type { ReactNode } from "react";

import { PageHeader } from "@/components/ui/page-header";
import { StatusNote } from "@/components/ui/status-note";

export function MentorSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  crumb?: string;
  children?: ReactNode;
}) {
  return (
    <main className="flex flex-col gap-6">
      <PageHeader title={title} description={description} />
      {children}
    </main>
  );
}

export function MentorNote({ children }: { children: string }) {
  return <StatusNote>{children}</StatusNote>;
}
