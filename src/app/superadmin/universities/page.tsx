import { CreateUniversityCard } from "@/components/superadmin/catalog-cards";
import { UniversityList } from "@/components/superadmin/university-list";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireScreen } from "@/lib/auth/authorization";
import { listUniversities } from "@/lib/superadmin/catalog";

export const metadata = { title: "University Management" };

export default async function UniversityManagementPage() {
  const actor = await requireScreen("universities");
  const universities = await listUniversities(actor.id);

  return (
    <main className="flex flex-col gap-6">
      <PageHeader title="University Management" description="Universities students can choose during registration." />
      <CreateUniversityCard />
      {!universities.ok ? (
        <ErrorState title="Universities unavailable" message={universities.message} />
      ) : (
        <UniversityList universities={universities.data} />
      )}
    </main>
  );
}
