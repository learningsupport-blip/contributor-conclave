import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/empty-state";
import type { OpportunityOrganisation } from "@/lib/student/opportunity-match";

export function SuggestedOrganisations({ organisations }: { organisations: OpportunityOrganisation[] }) {
  if (organisations.length === 0) {
    return (
      <EmptyState
        title="No matching organisations"
        description="Choose a tech stack that an organisation or one of its projects uses."
      />
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {organisations.map((organisation) => (
        <li key={organisation.id} className="flex flex-col gap-3 border border-ink/10 px-4 py-4 dark:border-paper/10">
          <div>
            <p className="font-medium">{organisation.name}</p>
            <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">{organisation.program}</p>
            <p className="mt-2 text-sm">{organisation.technologies.join(", ")}</p>
            <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">
              {organisation.projects.length === 1 ? "1 project" : `${organisation.projects.length} projects`}
            </p>
          </div>
          <ButtonLink href={`/student/organisations/${organisation.id}`} variant="secondary">
            View organisation
          </ButtonLink>
        </li>
      ))}
    </ul>
  );
}
