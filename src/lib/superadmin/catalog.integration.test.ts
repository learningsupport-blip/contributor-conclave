import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import {
  createBatch,
  createUniversity,
  deleteBatch,
  deleteUniversity,
  listBatches,
  listUniversities,
  updateBatch,
  updateUniversity,
} from "@/lib/superadmin/catalog";
import { insertUser, removeFixtures } from "@/test/fixtures";

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

  it("updates a university in place and refuses to delete one that still has a batch", async () => {
    const created = await createUniversity(superadminId, { name: "Edit University", location: "Hyderabad" });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    const refused = await updateUniversity(adminId, created.data.id, { name: "Changed", location: "Guntur" });
    expect(refused.ok).toBe(false);

    const student = await insertUser({
      role: "STUDENT",
      email: `student${domain}`,
      firstName: "Sita",
      lastName: "Student",
      niatId: "catalog-niat",
      universityName: "Edit University",
    });
    await db.studentProfile.update({
      where: { userId: student.id },
      data: { universityId: created.data.id },
    });

    const updated = await updateUniversity(superadminId, created.data.id, {
      name: "Edited University",
      location: "Guntur",
    });
    expect(updated.ok).toBe(true);
    if (updated.ok) {
      expect(updated.data.id).toBe(created.data.id);
    }
    await expect(db.studentProfile.findUnique({ where: { userId: student.id } })).resolves.toMatchObject({
      universityName: "Edited University",
      universityId: created.data.id,
    });

    const other = await createUniversity(superadminId, { name: "Other University", location: "Vizag" });
    expect(other.ok).toBe(true);
    const duplicate = await updateUniversity(superadminId, created.data.id, {
      name: "other university",
      location: "Guntur",
    });
    expect(duplicate.ok).toBe(false);

    await createBatch(superadminId, { universityId: created.data.id, year: "2098", totalStudents: 12 });
    const blocked = await deleteUniversity(superadminId, created.data.id);
    expect(blocked.ok).toBe(false);

    await db.studentProfile.update({ where: { userId: student.id }, data: { universityId: null } });
    await db.batch.deleteMany({ where: { universityId: created.data.id } });
    const deleted = await deleteUniversity(superadminId, created.data.id);
    expect(deleted.ok).toBe(true);
    await expect(db.university.findUnique({ where: { id: created.data.id } })).resolves.toBeNull();
  });

  it("updates a batch in place and refuses to delete one that still has a student", async () => {
    const university = await createUniversity(superadminId, { name: "Batch Edit University", location: "Hyderabad" });
    const other = await createUniversity(superadminId, { name: "Batch Other University", location: "Guntur" });
    expect(university.ok && other.ok).toBe(true);
    if (!university.ok || !other.ok) {
      return;
    }

    const created = await createBatch(superadminId, {
      universityId: university.data.id,
      year: "2094",
      totalStudents: 40,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    const refused = await updateBatch(adminId, created.data.id, {
      universityId: university.data.id,
      year: "2093",
      totalStudents: 41,
    });
    expect(refused.ok).toBe(false);

    await createBatch(superadminId, { universityId: university.data.id, year: "2093", totalStudents: 10 });
    const duplicate = await updateBatch(superadminId, created.data.id, {
      universityId: university.data.id,
      year: "2093",
      totalStudents: 40,
    });
    expect(duplicate.ok).toBe(false);

    const student = await insertUser({
      role: "STUDENT",
      email: `batch-student${domain}`,
      firstName: "Ravi",
      lastName: "Student",
      niatId: "catalog-batch-niat",
      batch: "2094",
      universityName: "Batch Edit University",
    });
    await db.studentProfile.update({
      where: { userId: student.id },
      data: { batchId: created.data.id, universityId: university.data.id },
    });

    const updated = await updateBatch(superadminId, created.data.id, {
      universityId: other.data.id,
      year: "2092",
      totalStudents: 55,
    });
    expect(updated.ok).toBe(true);
    if (updated.ok) {
      expect(updated.data.id).toBe(created.data.id);
      expect(updated.data.totalStudents).toBe(55);
      expect(updated.data.universityId).toBe(other.data.id);
    }
    await expect(db.studentProfile.findUnique({ where: { userId: student.id } })).resolves.toMatchObject({
      batch: "2092",
      batchId: created.data.id,
      universityId: other.data.id,
      universityName: "Batch Other University",
    });

    const blocked = await deleteBatch(superadminId, created.data.id);
    expect(blocked.ok).toBe(false);
    const adminDelete = await deleteBatch(adminId, created.data.id);
    expect(adminDelete.ok).toBe(false);

    await db.studentProfile.update({ where: { userId: student.id }, data: { batchId: null } });
    const deleted = await deleteBatch(superadminId, created.data.id);
    expect(deleted.ok).toBe(true);
    await expect(db.batch.findUnique({ where: { id: created.data.id } })).resolves.toBeNull();
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
