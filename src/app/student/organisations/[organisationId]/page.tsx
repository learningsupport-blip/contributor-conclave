import { StartProjectForm } from "@/components/student/start-project-form";
import { StudentSection } from "@/components/student/student-section";
import { TextLink } from "@/components/student/text-link";
import { ButtonLink } from "@/components/ui/button-link";
import { ErrorState } from "@/components/ui/error-state";
import { requireStudent } from "@/lib/auth/authorization";
import { getStudentOrganisation } from "@/lib/student/opportunities";

export const metadata = { title: "Organisation" };

export default async function StudentOrganisationPage({ params }: { params: Promise<{ organisationId: string }> }) {
  const user = await requireStudent();
  const { organisationId } = await params;
  const organisation = await getStudentOrganisation(user.id, organisationId);

  if (!organisation.ok) {
    return (
      <StudentSection crumb="Organisations" title="Organisation" description="This organisation could not be opened.">
        <ErrorState title="Organisation unavailable" message={organisation.message} />
      </StudentSection>
    );
  }

  const detail = organisation.data;
  const started = new Set(detail.startedProjectIds);

  return (
    <StudentSection crumb="Organisations" title={detail.name} description={`${detail.program} organisation and its projects.`}>
      <ButtonLink href="/student/organisations" variant="secondary">
        All organisations
      </ButtonLink>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-medium">Organisation URL</dt>
          <dd className="mt-1">
            <TextLink href={detail.websiteUrl}>{detail.websiteUrl}</TextLink>
          </dd>
        </div>
        <div>
          <dt className="font-medium">Github/Gitlab URL</dt>
          <dd className="mt-1">
            <TextLink href={detail.repositoryUrl}>{detail.repositoryUrl}</TextLink>
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-medium">Technological Stack</dt>
          <dd className="mt-1">{detail.technologies.join(", ")}</dd>
        </div>
      </dl>
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Projects</h2>
        {detail.projects.length === 0 ? (
          <p className="text-sm text-ink/70 dark:text-paper/70">This organisation has no projects yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {detail.projects.map((project) => (
              <li key={project.id} className="border border-ink/10 px-4 py-4 dark:border-paper/10">
                <p className="font-medium">{project.name}</p>
                <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">{project.program}</p>
                <p className="mt-2 text-sm">{project.technologies.join(", ")}</p>
                <p className="mt-2 text-sm">
                  <TextLink href={project.websiteUrl}>{project.websiteUrl}</TextLink>
                </p>
                <p className="mt-1 text-sm">
                  <TextLink href={project.repositoryUrl}>{project.repositoryUrl}</TextLink>
                </p>
                {started.has(project.id) ? (
                  <p className="mt-3 text-sm font-medium">You started working on this project.</p>
                ) : (
                  <StartProjectForm projectId={project.id} />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </StudentSection>
  );
}
