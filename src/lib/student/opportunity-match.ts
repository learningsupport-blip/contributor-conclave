import { ORGANISATION_TECHNOLOGIES, type OrganisationTechnology } from "@/lib/superadmin/organisation-options";

export type OpportunityOrganisation = {
  id: string;
  name: string;
  program: string;
  websiteUrl: string;
  repositoryUrl: string;
  technologies: string[];
  projects: {
    id: string;
    name: string;
    program: string;
    websiteUrl: string;
    repositoryUrl: string;
    technologies: string[];
  }[];
};

export function technologiesInUse(organisations: { technologies: string[]; projects: { technologies: string[] }[] }[]): OrganisationTechnology[] {
  const present = new Set(organisations.flatMap((organisation) => [
    ...organisation.technologies,
    ...organisation.projects.flatMap((project) => project.technologies),
  ]));
  return ORGANISATION_TECHNOLOGIES.map((technology) => technology.value).filter((technology) => present.has(technology));
}

function overlapCount(organisation: OpportunityOrganisation, selected: ReadonlySet<string>): number {
  const used = new Set([
    ...organisation.technologies,
    ...organisation.projects.flatMap((project) => project.technologies),
  ]);
  let count = 0;
  for (const technology of selected) {
    if (used.has(technology)) {
      count += 1;
    }
  }
  return count;
}

export function matchingOrganisations(organisations: OpportunityOrganisation[], selected: string[]): OpportunityOrganisation[] {
  const chosen = new Set(selected);
  return organisations
    .map((organisation) => ({ organisation, score: overlapCount(organisation, chosen) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.organisation.name.localeCompare(right.organisation.name))
    .map((item) => item.organisation);
}
