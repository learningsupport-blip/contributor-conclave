import { CreateBatchCard } from "@/components/superadmin/catalog-cards";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireSuperAdmin } from "@/lib/auth/authorization";
import { listBatches } from "@/lib/superadmin/catalog";

export const metadata = { title: "Batch Management" };

export default async function BatchManagementPage() {
  const actor = await requireSuperAdmin();
  const batches = await listBatches(actor.id);

  return (
    <main className="flex flex-col gap-6">
      <PageHeader title="Batch Management" description="Batches students can choose during registration." />
      <CreateBatchCard />
      {!batches.ok ? (
        <ErrorState title="Batches unavailable" message={batches.message} />
      ) : batches.data.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {batches.data.map((batch) => (
            <li key={batch.id} className="border border-ink/10 px-4 py-4 dark:border-paper/10">
              <p className="font-medium">{batch.year}</p>
              <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">Total Students {batch.totalStudents}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
