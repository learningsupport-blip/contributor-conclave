import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import { insertUser, removeFixtures } from "@/test/fixtures";
import { deleteManagedStudent, listManagedStudents } from "@/lib/superadmin/students";
import { setManagedAccountActive } from "@/lib/superadmin/users";

const domain = "@student-delete-test.example";

let superadminId = "";
let adminId = "";

beforeAll(async () => {
  await removeFixtures(domain, "Student delete ");
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
  await removeFixtures(domain, "Student delete ");
});

describe("student deletion", () => {
  it("reactivates a student and deletes the account only after it is deactivated", async () => {
    const student = await insertUser({
      role: "STUDENT",
      email: `student${domain}`,
      firstName: "Sita",
      lastName: "Student",
      niatId: "student-delete-niat",
      universityName: "Delete University",
      batch: "2090",
    });
    const profileId = student.studentProfile?.id;
    expect(profileId).toBeTruthy();
    if (!profileId) {
      return;
    }
    await db.studentTechInterest.create({ data: { studentId: profileId, technology: "React" } });

    const blocked = await deleteManagedStudent(superadminId, student.id);
    expect(blocked.ok).toBe(false);

    const deactivated = await setManagedAccountActive(superadminId, student.id, false, "students");
    expect(deactivated.ok).toBe(true);
    const restored = await setManagedAccountActive(superadminId, student.id, true, "students");
    expect(restored.ok).toBe(true);
    await expect(db.user.findUnique({ where: { id: student.id } })).resolves.toMatchObject({ deactivatedAt: null });

    await setManagedAccountActive(superadminId, student.id, false, "students");
    const forbidden = await deleteManagedStudent(adminId, student.id);
    expect(forbidden.ok).toBe(false);

    const removed = await deleteManagedStudent(superadminId, student.id);
    expect(removed.ok).toBe(true);
    await expect(db.user.findUnique({ where: { id: student.id } })).resolves.toBeNull();
    await expect(db.studentProfile.findUnique({ where: { id: profileId } })).resolves.toBeNull();
    await expect(db.studentTechInterest.count({ where: { studentId: profileId } })).resolves.toBe(0);

    const remaining = await listManagedStudents(superadminId);
    expect(remaining.ok && remaining.data.some((item) => item.id === student.id)).toBe(false);
  });
});
