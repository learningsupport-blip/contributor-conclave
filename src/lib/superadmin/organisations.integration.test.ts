import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { insertUser, removeFixtures } from "@/test/fixtures";
import { approveOrganisation, createOrganisation, disapproveOrganisation, listOrganisations } from "@/lib/superadmin/organisations";
import { getStudentOpportunities, saveStudentInterests } from "@/lib/student/opportunities";

const domain = "@organisation-test.example";

let superadminId = "";
let adminId = "";

beforeAll(async () => {
  await removeFixtures(domain, "Organisation ");
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
});

afterAll(async () => {
  await removeFixtures(domain, "Organisation ");
});

const input = {
  name: "Kubernetes",
  program: "GSOC" as const,
  websiteUrl: "https://kubernetes.io",
  repositoryUrl: "https://github.com/kubernetes",
  technologies: ["React", "Typescript"] as ("React" | "Typescript")[],
};

describe("organisations", () => {
  it("refuses an admin and lets a super admin save an organisation", async () => {
    const refused = await createOrganisation(adminId, input);
    expect(refused).toMatchObject({ ok: false, code: "forbidden" });

    const created = await createOrganisation(superadminId, input);
    expect(created.ok).toBe(true);

    const listed = await listOrganisations(superadminId);
    expect(listed.ok).toBe(true);
    if (listed.ok && created.ok) {
      expect(listed.data.some((organisation) => organisation.id === created.data.id)).toBe(true);
    }
  });

  it("approves a GSoC organisation once and shows it to a student with that stack", async () => {
    const student = await insertUser({
      role: "STUDENT",
      email: `student${domain}`,
      firstName: "Sam",
      lastName: "Student",
    });
    const catalogOrganisation = {
      name: "Organisation Catalog",
      program: "GSOC" as const,
      websiteUrl: "https://catalog.example",
      repositoryUrl: "https://catalog.example",
      technologies: ["Javascript"] as ("Javascript")[],
    };

    const refused = await approveOrganisation(adminId, catalogOrganisation);
    expect(refused).toMatchObject({ ok: false, code: "forbidden" });

    const first = await approveOrganisation(superadminId, catalogOrganisation);
    const second = await approveOrganisation(superadminId, catalogOrganisation);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(second.data.id).toBe(first.data.id);
    }

    const saved = await saveStudentInterests(student.id, ["Javascript"]);
    expect(saved.ok).toBe(true);
    const opportunities = await getStudentOpportunities(student.id);
    expect(opportunities.ok).toBe(true);
    if (opportunities.ok) {
      expect(opportunities.data.organisations.map((organisation) => organisation.name)).toContain("Organisation Catalog");
    }

    const refusedDisapproval = await disapproveOrganisation(adminId, catalogOrganisation.name);
    expect(refusedDisapproval).toMatchObject({ ok: false, code: "forbidden" });

    const hidden = await disapproveOrganisation(superadminId, catalogOrganisation.name);
    expect(hidden.ok).toBe(true);
    const listed = await listOrganisations(superadminId);
    expect(listed.ok).toBe(true);
    if (listed.ok) {
      expect(listed.data.some((organisation) => organisation.name === catalogOrganisation.name)).toBe(false);
    }
    const after = await getStudentOpportunities(student.id);
    expect(after.ok).toBe(true);
    if (after.ok) {
      expect(after.data.organisations.map((organisation) => organisation.name)).not.toContain("Organisation Catalog");
    }

    const restored = await approveOrganisation(superadminId, catalogOrganisation);
    expect(restored.ok).toBe(true);
    if (restored.ok && first.ok) {
      expect(restored.data.id).toBe(first.data.id);
      expect(restored.data.approved).toBe(true);
    }
  });
});
