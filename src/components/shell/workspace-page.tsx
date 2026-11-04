import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export function WorkspacePage({
  title,
  description,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <main className="flex flex-col gap-6">
      <PageHeader title={title} description={description} />
      <EmptyState title={emptyTitle} description={emptyDescription} />
    </main>
  );
}
