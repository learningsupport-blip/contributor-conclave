import { describe, expect, it } from "vitest";

import { githubAccountFromRepositoryUrl, selectActiveProjects } from "@/lib/github/active-projects";

function repository(name: string, overrides: Record<string, unknown> = {}) {
  return {
    name,
    description: `${name} description`,
    html_url: `https://github.com/kubernetes/${name}`,
    language: "Go",
    stargazers_count: 1,
    forks_count: 1,
    updated_at: "2026-01-01T00:00:00Z",
    pushed_at: "2026-01-01T00:00:00Z",
    private: false,
    fork: false,
    archived: false,
    open_issues_count: 4,
    ...overrides,
  };
}

describe("active GitHub projects", () => {
  it("reads the GitHub account from an organisation or repository URL", () => {
    expect(githubAccountFromRepositoryUrl("https://github.com/Kubernetes/")).toBe("kubernetes");
    expect(githubAccountFromRepositoryUrl("https://www.github.com/kubernetes/kubernetes")).toBe("kubernetes");
    expect(githubAccountFromRepositoryUrl("https://gitlab.com/kubernetes")).toBeNull();
  });

  it("keeps the five public projects with the latest push", () => {
    const repos = [
      repository("archived", { archived: true, pushed_at: "2026-06-01T00:00:00Z" }),
      repository("forked", { fork: true, pushed_at: "2026-06-01T00:00:00Z" }),
      repository("hidden", { private: true, pushed_at: "2026-06-01T00:00:00Z" }),
      ...Array.from({ length: 6 }, (_, index) =>
        repository(`project-${index}`, { pushed_at: `2026-0${index + 1}-01T00:00:00Z` }),
      ),
    ];

    const selected = selectActiveProjects(repos);
    expect(selected.ok).toBe(true);
    if (selected.ok) {
      expect(selected.data.map((project) => project.name)).toEqual([
        "project-5",
        "project-4",
        "project-3",
        "project-2",
        "project-1",
      ]);
      expect(selected.data[0]).toMatchObject({ language: "Go", openCount: 4, stars: 1 });
    }
  });
});
