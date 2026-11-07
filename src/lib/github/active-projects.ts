import { z } from "zod";

import { githubWebUrl, normalizeGitHubUsername } from "@/lib/github/parse";
import { githubFailure, type GitHubResult } from "@/lib/github/types";

export const ACTIVE_PROJECT_LIMIT = 5;

export type ActiveGitHubProject = {
  name: string;
  description: string | null;
  url: string;
  language: string | null;
  stars: number;
  forks: number;
  openCount: number;
  pushedAt: string;
};

const repositorySchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  html_url: z.string(),
  language: z.string().nullable(),
  stargazers_count: z.number(),
  forks_count: z.number(),
  updated_at: z.string().nullable(),
  pushed_at: z.string().nullable().optional(),
  private: z.boolean(),
  fork: z.boolean(),
  archived: z.boolean().optional(),
  open_issues_count: z.number().optional(),
});

export function githubAccountFromRepositoryUrl(repositoryUrl: string): string | null {
  try {
    const url = new URL(repositoryUrl);
    const host = url.hostname.replace(/^www\./, "");
    if (host !== "github.com") {
      return null;
    }
    const [owner] = url.pathname.split("/").filter(Boolean);
    return owner ? normalizeGitHubUsername(owner) : null;
  } catch {
    return null;
  }
}

export function selectActiveProjects(body: unknown, limit = ACTIVE_PROJECT_LIMIT): GitHubResult<ActiveGitHubProject[]> {
  const parsed = z.array(repositorySchema).safeParse(body);
  if (!parsed.success) {
    return githubFailure("unavailable", "GitHub returned a project list that could not be read.");
  }

  const projects = parsed.data
    .flatMap((repository) => {
      if (repository.private || repository.fork || repository.archived) {
        return [];
      }
      const url = githubWebUrl(repository.html_url);
      const pushedAt = repository.pushed_at || repository.updated_at;
      if (!url || !pushedAt) {
        return [];
      }
      return [
        {
          name: repository.name,
          description: repository.description,
          url,
          language: repository.language,
          stars: repository.stargazers_count,
          forks: repository.forks_count,
          openCount: repository.open_issues_count ?? 0,
          pushedAt,
        },
      ];
    })
    .sort((left, right) => Date.parse(right.pushedAt) - Date.parse(left.pushedAt))
    .slice(0, limit);

  return { ok: true, data: projects };
}
