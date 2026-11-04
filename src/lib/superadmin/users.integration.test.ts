import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { insertUser, removeFixtures } from "@/test/fixtures";
import { changeUserRole, setManagedAccountActive } from "@/lib/superadmin/users";

const domain = "@superadmin-test.example";

let superadminId = "";
let adminId = "";
let studentId = "";

beforeAll(async () => {
  await removeFixtures(domain, "Superadmin ");
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
  const student = await insertUser({
    role: "STUDENT",
    email: `student${domain}`,
    firstName: "Sita",
    lastName: "Student",
    niatId: `NIAT-${randomUUID()}`,
  });
  superadminId = superadmin.id;
  adminId = admin.id;
  studentId = student.id;
});

afterAll(async () => {
  await removeFixtures(domain, "Superadmin ");
});

describe("super admin role management", () => {
  it("refuses an admin who tries to change a role", async () => {
    const result = await changeUserRole(adminId, studentId, "ADMIN");
    expect(result).toMatchObject({ ok: false, code: "forbidden" });
  });

  it("lets the super admin move a student to admin and then refuses a super admin role", async () => {
    const changed = await changeUserRole(superadminId, studentId, "ADMIN");
    expect(changed.ok).toBe(true);

    const escalation = await changeUserRole(superadminId, studentId, "SUPERADMIN" as never);
    expect(escalation.ok).toBe(false);
  });

  it("does not let the super admin deactivate their own account", async () => {
    const result = await setManagedAccountActive(superadminId, superadminId, false);
    expect(result).toMatchObject({ ok: false, code: "invalid" });
  });
});