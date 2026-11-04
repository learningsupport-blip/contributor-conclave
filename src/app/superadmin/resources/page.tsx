import { CreateOrganisationCard } from "@/components/superadmin/create-organisation-card";
import { CreateProjectCard } from "@/components/superadmin/create-project-card";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireSuperAdmin } from "@/lib/auth/authorization";
import { listOrganisations } from "@/lib/superadmin/organisations";
import { listProjects } from "@/lib/superadmin/projects";

export const metadata = { title: "Resource Management" };

export default async function ResourceManagementPage() {
  const actor = await requireSuperAdmin();
  const [organisations, projects] = await Promise.all([
    listOrganisations(actor.id),
    listProjects(actor.id),
  ]);

  return (
    <main className="flex flex-col gap-6">
      <PageHeader title="Resource Management" description="Resources for open source programs." />
      <div className="flex flex-wrap gap-4">
        <CreateOrganisationCard />
        <CreateProjectCard
          organisations={organisations.ok ? organisations.data.map((organisation) => ({ id: organisation.id, name: organisation.name })) : []}
        />
      </div>
      {!organisations.ok ? (
        <ErrorState title="Organisations unavailable" message={organisations.message} />
      ) : organisations.data.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {organisations.data.map((organisation) => (
            <li key={organisation.id} className="border border-ink/10 px-4 py-4 dark:border-paper/10">
              <p className="font-medium">{organisation.name}</p>
              <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">{organisation.program}</p>
              <p className="mt-2 text-sm">{organisation.technologies.join(", ")}</p>
            </li>
          ))}
        </ul>
      ) : null}
      {!projects.ok ? (
        <ErrorState title="Projects unavailable" message={projects.message} />
      ) : projects.data.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {projects.data.map((project) => (
            <li key={project.id} className="border border-ink/10 px-4 py-4 dark:border-paper/10">
              <p className="font-medium">{project.name}</p>
              <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">
                {project.organisationName} · {project.program}
              </p>
              <p className="mt-2 text-sm">{project.technologies.join(", ")}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
