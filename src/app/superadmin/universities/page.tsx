import { CreateUniversityCard } from "@/components/superadmin/catalog-cards";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireSuperAdmin } from "@/lib/auth/authorization";
import { listUniversities } from "@/lib/superadmin/catalog";

export const metadata = { title: "University Management" };

export default async function UniversityManagementPage() {
  const actor = await requireSuperAdmin();
  const universities = await listUniversities(actor.id);

  return (
    <main className="flex flex-col gap-6">
      <PageHeader title="University Management" description="Universities students can choose during registration." />
      <CreateUniversityCard />
      {!universities.ok ? (
        <ErrorState title="Universities unavailable" message={universities.message} />
      ) : universities.data.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {universities.data.map((university) => (
            <li key={university.id} className="border border-ink/10 px-4 py-4 dark:border-paper/10">
              <p className="font-medium">{university.name}</p>
              <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">{university.location}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
