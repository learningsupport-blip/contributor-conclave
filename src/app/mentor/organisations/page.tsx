import { MentorSection } from "@/components/mentor/section";
import { ErrorState } from "@/components/ui/error-state";
import { focusRing } from "@/components/ui/styles";
import { requireMentor } from "@/lib/auth/authorization";
import type { ActiveGitHubProject } from "@/lib/github/active-projects";
import { github } from "@/lib/github/service";
import type { GitHubResult } from "@/lib/github/types";
import { listMentorOrganisations, type AssignedOrganisation } from "@/lib/mentor/directory";

export const metadata = { title: "Organisations" };

const activityFormat = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeZone: "Asia/Kolkata",
});

function activityLabel(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return activityFormat.format(date);
}

function ProjectList({ projects }: { projects: GitHubResult<ActiveGitHubProject[]> }) {
  if (!projects.ok) {
    return <p className="text-sm text-ink/75 dark:text-paper/75">{projects.message}</p>;
  }

  if (projects.data.length === 0) {
    return <p className="text-sm text-ink/75 dark:text-paper/75">No active public projects were found on GitHub.</p>;
  }

  return (
    <ol className="flex flex-col gap-3">
      {projects.data.map((project, index) => {
        const pushed = activityLabel(project.pushedAt);
        const facts = [
          project.language,
          `${project.stars.toLocaleString("en-IN")} stars`,
          `${project.forks.toLocaleString("en-IN")} forks`,
          `${project.openCount.toLocaleString("en-IN")} open`,
          pushed ? `Last push ${pushed}` : null,
        ].filter((fact): fact is string => Boolean(fact));

        return (
          <li key={project.url} className="border border-ink/10 px-3 py-3 dark:border-paper/15">
            <a
              href={project.url}
              target="_blank"
              rel="noreferrer"
              className={`font-medium underline underline-offset-4 ${focusRing}`}
            >
              {index + 1}. {project.name}
            </a>
            {project.description ? <p className="mt-1 text-sm text-ink/75 dark:text-paper/75">{project.description}</p> : null}
            <p className="mt-2 text-sm text-ink/70 dark:text-paper/70">{facts.join(" · ")}</p>
          </li>
        );
      })}
    </ol>
  );
}

function OrganisationCard({
  organisation,
  projects,
}: {
  organisation: AssignedOrganisation;
  projects: GitHubResult<ActiveGitHubProject[]>;
}) {
  return (
    <article className="flex flex-col gap-4 border border-ink/10 px-4 py-4 dark:border-paper/10">
      <div>
        <h2 className="text-lg font-semibold">{organisation.name}</h2>
        <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">{organisation.program}</p>
        {organisation.technologies.length > 0 ? (
          <p className="mt-2 text-sm">{organisation.technologies.join(", ")}</p>
        ) : null}
        <p className="mt-3 flex flex-wrap gap-4 text-sm">
          <a
            href={organisation.websiteUrl}
            target="_blank"
            rel="noreferrer"
            className={`underline underline-offset-4 ${focusRing}`}
          >
            Organisation website
          </a>
          <a
            href={organisation.repositoryUrl}
            target="_blank"
            rel="noreferrer"
            className={`underline underline-offset-4 ${focusRing}`}
          >
            Repository
          </a>
        </p>
      </div>
      <section className="flex flex-col gap-3" aria-labelledby={`projects-${organisation.id}`}>
        <h3 id={`projects-${organisation.id}`} className="text-sm font-semibold">
          Active projects
        </h3>
        <ProjectList projects={projects} />
      </section>
    </article>
  );
}

export default async function MentorOrganisationsPage() {
  const mentor = await requireMentor();
  const result = await listMentorOrganisations(mentor.id);
  const projects = result.ok
    ? await Promise.all(result.data.map((organisation) => github.listActiveOrganisationProjects(organisation.repositoryUrl)))
    : [];

  return (
    <MentorSection
      crumb="Organisations"
      title="Organisations"
      description="Organisations a super admin assigned to you. Each one shows the five public GitHub projects with the most recent activity."
    >
      {!result.ok ? (
        <ErrorState title="Organisations unavailable" message={result.message} />
      ) : result.data.length === 0 ? (
        <p className="text-ink/75 dark:text-paper/75">No organisation has been assigned to you yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {result.data.map((organisation, index) => (
            <OrganisationCard
              key={organisation.id}
              organisation={organisation}
              projects={projects[index] ?? { ok: false, code: "unavailable", message: "GitHub projects could not be loaded." }}
            />
          ))}
        </div>
      )}
    </MentorSection>
  );
}
