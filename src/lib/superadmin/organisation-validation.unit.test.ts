import { describe, expect, it } from "vitest";

import { organisationSchema } from "@/lib/superadmin/organisation-validation";

const valid = {
  name: "Kubernetes",
  program: "GSOC",
  websiteUrl: "https://kubernetes.io",
  repositoryUrl: "https://github.com/kubernetes",
  technologies: ["React", "Typescript"],
};

describe("organisation form", () => {
  it("accepts a named organisation on a listed program with GitHub or GitLab and several technologies", () => {
    expect(organisationSchema.parse(valid)).toMatchObject(valid);
    expect(
      organisationSchema.parse({ ...valid, repositoryUrl: "https://www.gitlab.com/kubernetes" }).repositoryUrl,
    ).toBe("https://www.gitlab.com/kubernetes");
  });

  it("rejects a missing name, an unknown program, a non-repository host, and no technologies", () => {
    const result = organisationSchema.safeParse({
      ...valid,
      name: "  ",
      program: "Hacktoberfest",
      repositoryUrl: "https://example.com/org",
      technologies: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((issue) => issue.path[0]);
      expect(fields).toEqual(expect.arrayContaining(["name", "program", "repositoryUrl", "technologies"]));
    }
  });
});
