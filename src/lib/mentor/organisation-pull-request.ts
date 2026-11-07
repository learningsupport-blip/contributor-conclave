import { githubAccountFromRepositoryUrl } from "@/lib/github/active-projects";

const genericLabels = new Set([
  "a",
  "an",
  "bitbucket",
  "com",
  "community",
  "foundation",
  "github",
  "gitlab",
  "io",
  "open",
  "org",
  "organisation",
  "organization",
  "project",
  "software",
  "the",
  "www",
]);

function hostLabel(value: string): string | null {
  try {
    const host = new URL(value).hostname.replace(/^www\./i, "").toLowerCase();
    const label = host.split(".")[0] ?? "";
    if (!/^[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/.test(label) || genericLabels.has(label)) {
      return null;
    }
    return label;
  } catch {
    return null;
  }
}

function nameLabel(name: string): string | null {
  const label = name
    .trim()
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .find((part) => part.length > 0);
  if (!label || genericLabels.has(label) || !/^[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/.test(label)) {
    return null;
  }
  return label;
}

export function pullRequestMatchesOrganisation(input: {
  organisationName: string;
  websiteUrl: string;
  repositoryUrl: string;
  repository: string;
}): boolean {
  const owner = input.repository.split("/")[0]?.toLowerCase() ?? "";
  if (!owner) {
    return false;
  }

  const account = githubAccountFromRepositoryUrl(input.repositoryUrl) ?? githubAccountFromRepositoryUrl(input.websiteUrl);
  if (account) {
    return owner === account;
  }

  return hostLabel(input.websiteUrl) === owner || hostLabel(input.repositoryUrl) === owner || nameLabel(input.organisationName) === owner;
}
