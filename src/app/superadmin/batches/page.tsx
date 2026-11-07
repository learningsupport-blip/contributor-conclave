import { BatchList } from "@/components/superadmin/batch-list";
import { CreateBatchCard } from "@/components/superadmin/catalog-cards";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireScreen } from "@/lib/auth/authorization";
import { listBatches, listUniversities } from "@/lib/superadmin/catalog";

export const metadata = { title: "Batch Management" };

export default async function BatchManagementPage() {
  const actor = await requireScreen("batches");
  const [batches, universities] = await Promise.all([listBatches(actor.id), listUniversities(actor.id)]);

  return (
    <main className="flex flex-col gap-6">
      <PageHeader title="Batch Management" description="Batches belong to a university and appear on student registration." />
      <CreateBatchCard universities={universities.ok ? universities.data : []} />
      {!batches.ok ? (
        <ErrorState title="Batches unavailable" message={batches.message} />
      ) : (
        <BatchList batches={batches.data} universities={universities.ok ? universities.data : []} />
      )}
    </main>
  );
}
