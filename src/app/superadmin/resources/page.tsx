import { GsocOrganisationList } from "@/components/superadmin/gsoc-organisation-list";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireScreen } from "@/lib/auth/authorization";
import { readPage, readText } from "@/lib/admin/query";
import { pageOrganisations } from "@/lib/superadmin/gsoc-catalog";
import { listGsocOrganisations } from "@/lib/superadmin/gsoc-source";
import { listOrganisations } from "@/lib/superadmin/organisations";

export const metadata = { title: "Resource Management" };

export default async function ResourceManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const actor = await requireScreen("resources");
  const params = await searchParams;
  const query = readText(params.q);
  const [organisations, catalog] = await Promise.all([
    listOrganisations(actor.id),
    listGsocOrganisations(),
  ]);
  const approvedNames = new Set(
    organisations.ok ? organisations.data.map((organisation) => organisation.name.toLowerCase()) : [],
  );
  const gsocPage = catalog.ok
    ? pageOrganisations(catalog.data.organisations, readPage(params.page), query)
    : null;

  return (
    <main className="flex flex-col gap-6">
      <PageHeader
        title="Resource Management"
        description="Approve any GSoC organisation. Students see it when it shares a tech stack they choose."
      />
      {!organisations.ok ? (
        <ErrorState title="Approved organisations unavailable" message={organisations.message} />
      ) : null}
      {catalog.ok && gsocPage ? (
        <GsocOrganisationList
          year={catalog.data.year}
          page={gsocPage.page}
          total={gsocPage.total}
          pageSize={gsocPage.pageSize}
          query={query}
          organisations={gsocPage.items.map((organisation) => ({
            name: organisation.name,
            description: organisation.description,
            category: organisation.category,
            imageUrl: organisation.imageUrl,
            imageBackground: organisation.imageBackground,
            technologies: organisation.technologies,
            sourceTechnologies: organisation.sourceTechnologies,
            topics: organisation.topics,
            years: organisation.years,
            websiteUrl: organisation.websiteUrl,
            codeRepositoryUrl: organisation.codeRepositoryUrl,
            projectsUrl: organisation.projectsUrl,
            ideasUrl: organisation.ideasUrl,
            guideUrl: organisation.guideUrl,
            projectCount: organisation.projectCount,
            approved: approvedNames.has(organisation.name.toLowerCase()),
          }))}
        />
      ) : (
        <ErrorState
          title="GSoC organisations unavailable"
          message={catalog.ok ? "The GSoC organisation list could not be read." : catalog.message}
        />
      )}
    </main>
  );
}
