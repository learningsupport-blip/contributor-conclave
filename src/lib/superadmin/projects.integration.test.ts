import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { insertUser, removeFixtures } from "@/test/fixtures";
import { createOrganisation } from "@/lib/superadmin/organisations";
import { createProject, listProjects } from "@/lib/superadmin/projects";

const domain = "@project-test.example";

let superadminId = "";
let adminId = "";
let organisationId = "";

beforeAll(async () => {
  await removeFixtures(domain, "Project ");
  const superadmin = await insertUser({
    role: "SUPERADMIN",
    email: `root${domain}`,
    firstName: "Root",
    lastName: "Admin",
  });
  const admin = await insertUser({
    role: "ADMIN",
    email: `admin${domain}`,
    firstName: "Ada",
    lastName: "Admin",
  });
  superadminId = superadmin.id;
  adminId = admin.id;
  const organisation = await createOrganisation(superadminId, {
    name: "Kubernetes",
    program: "GSOC",
    websiteUrl: "https://kubernetes.io",
    repositoryUrl: "https://github.com/kubernetes",
    technologies: ["React"],
  });
  if (!organisation.ok) {
    throw new Error(organisation.message);
  }
  organisationId = organisation.data.id;
});

afterAll(async () => {
  await removeFixtures(domain, "Project ");
});

describe("projects", () => {
  it("refuses an admin and lets a super admin save a project under an organisation", async () => {
    const input = {
      name: "Contributor portal",
      organisationId,
      program: "LFX" as const,
      websiteUrl: "https://example.org/portal",
      repositoryUrl: "https://gitlab.com/example/portal",
      technologies: ["Javascript"] as "Javascript"[],
    };
    const refused = await createProject(adminId, input);
    expect(refused).toMatchObject({ ok: false, code: "forbidden" });

    const created = await createProject(superadminId, input);
    expect(created.ok).toBe(true);

    const listed = await listProjects(superadminId);
    expect(listed.ok).toBe(true);
    if (listed.ok && created.ok) {
      expect(listed.data.some((project) => project.id === created.data.id && project.organisationName === "Kubernetes")).toBe(true);
    }
  });
});