import type { ReactNode } from "react";

import { PageHeader } from "@/components/ui/page-header";

export function StudentSection({
  title,
  description,
  children,
}: {
  crumb: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <main className="flex flex-col gap-8">
      <PageHeader title={title} description={description} />
      {children}
    </main>
  );
}
