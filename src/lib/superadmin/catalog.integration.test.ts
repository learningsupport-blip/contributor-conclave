import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { insertUser, removeFixtures } from "@/test/fixtures";
import { createBatch, createUniversity, listBatches, listUniversities } from "@/lib/superadmin/catalog";

const domain = "@catalog-test.example";

let superadminId = "";
let adminId = "";

beforeAll(async () => {
  await removeFixtures(domain, "Catalog ");
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
  await removeFixtures(domain, "Catalog ");
});

describe("universities and batches", () => {
  it("lets a super admin create and list a university and a batch", async () => {
    const suffix = superadminId.slice(0, 8);
    const university = await createUniversity(superadminId, {
      name: `NIAT ${suffix}`,
      location: "Hyderabad",
    });
    expect(university.ok).toBe(true);
    if (!university.ok) {
      return;
    }
    const batch = await createBatch(superadminId, {
      universityId: university.data.id,
      year: suffix,
      totalStudents: 80,
    });

    expect(batch.ok).toBe(true);
    if (!batch.ok) {
      return;
    }

    const universities = await listUniversities(superadminId);
    const batches = await listBatches(superadminId);
    expect(universities.ok && universities.data.some((item) => item.id === university.data.id)).toBe(true);
    expect(
      batches.ok &&
        batches.data.some(
          (item) => item.id === batch.data.id && item.totalStudents === 80 && item.universityId === university.data.id,
        ),
    ).toBe(true);

    const duplicate = await createUniversity(superadminId, { name: `niat ${suffix}`, location: "Guntur" });
    expect(duplicate.ok).toBe(false);
  });

  it("rejects a catalog change from an admin", async () => {
    const result = await createBatch(adminId, {
      universityId: "00000000-0000-4000-8000-000000000199",
      year: "2097",
      totalStudents: 10,
    });
    expect(result.ok).toBe(false);
  });
});
