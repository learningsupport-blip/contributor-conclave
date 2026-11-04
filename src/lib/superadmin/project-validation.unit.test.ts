import { describe, expect, it } from "vitest";

import { projectSchema } from "@/lib/superadmin/project-validation";

const valid = {
  name: "Contributor portal",
  organisationId: "11111111-1111-4111-8111-111111111111",
  program: "LFX",
  websiteUrl: "https://example.org/portal",
  repositoryUrl: "https://gitlab.com/example/portal",
  technologies: ["Javascript", "React"],
};

describe("project form", () => {
  it("accepts a project tied to an organisation, a listed program, and several technologies", () => {
    expect(projectSchema.parse(valid)).toMatchObject(valid);
  });

  it("rejects a missing organisation, an unknown program, and no technologies", () => {
    const result = projectSchema.safeParse({
      ...valid,
      name: " ",
      organisationId: "not-an-id",
      program: "Hacktoberfest",
      technologies: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((issue) => issue.path[0]);
      expect(fields).toEqual(expect.arrayContaining(["name", "organisationId", "program", "technologies"]));
    }
  });
});
