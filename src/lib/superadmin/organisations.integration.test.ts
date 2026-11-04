import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { insertUser, removeFixtures } from "@/test/fixtures";
import { createOrganisation, listOrganisations } from "@/lib/superadmin/organisations";

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
});
