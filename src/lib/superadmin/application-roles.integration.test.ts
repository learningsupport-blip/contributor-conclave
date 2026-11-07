import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { verifyPassword } from "@/lib/auth/password";
import { insertUser, removeFixtures } from "@/test/fixtures";
import {
  assignApplicationRole,
  createApplicationRole,
  createApplicationUser,
  deleteApplicationUser,
  listApplicationRoles,
  updateApplicationUser,
} from "@/lib/superadmin/application-roles";
import { listManagedStudents } from "@/lib/superadmin/students";
import { listManagedUsers, setManagedAccountActive } from "@/lib/superadmin/users";
import { db } from "@/lib/db";

const domain = "@application-role-test.example";

let superadminId = "";
let adminId = "";

beforeAll(async () => {
  await removeFixtures(domain, "Application role ");
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
  await insertUser({
    role: "STUDENT",
    email: `student${domain}`,
    firstName: "Sita",
    lastName: "Student",
    niatId: "application-role-niat",
    universityName: "Role University",
    batch: "2091",
  });
  superadminId = superadmin.id;
  adminId = admin.id;
});

afterAll(async () => {
  await removeFixtures(domain, "Application role ");
});

describe("application roles and users", () => {
  it("creates a role with screens, assigns it, and keeps students out of the user list", async () => {
    const refused = await createApplicationRole(adminId, { name: "Registrar", screens: ["students"] });
    expect(refused.ok).toBe(false);

    const missingScreens = await createApplicationRole(superadminId, { name: "Empty", screens: [] });
    expect(missingScreens.ok).toBe(false);

    const role = await createApplicationRole(superadminId, {
      name: "Registrar",
      screens: ["students", "students"],
    });
    expect(role.ok).toBe(true);
    if (!role.ok) {
      return;
    }
    expect(role.data.screens).toEqual(["students"]);

    const duplicate = await createApplicationRole(superadminId, { name: "registrar", screens: ["users"] });
    expect(duplicate.ok).toBe(false);

    const created = await createApplicationUser(superadminId, {
      firstName: "Nia",
      lastName: "Registrar",
      email: `nia${domain}`,
      password: "Screen-access1",
      roleId: role.data.id,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    const users = await listManagedUsers(superadminId);
    expect(users.ok).toBe(true);
    if (!users.ok) {
      return;
    }
    expect(users.data.some((user) => user.email === `student${domain}`)).toBe(false);
    expect(users.data.some((user) => user.id === created.data.id && user.applicationRoleId === role.data.id)).toBe(true);

    const blocked = await listManagedStudents(adminId);
    expect(blocked.ok).toBe(false);

    const assigned = await assignApplicationRole(superadminId, adminId, role.data.id);
    expect(assigned.ok).toBe(true);
    await expect(db.user.findUnique({ where: { id: adminId } })).resolves.toMatchObject({
      applicationRoleId: role.data.id,
    });

    const students = await listManagedStudents(superadminId);
    expect(students.ok && students.data.some((student) => student.email === `student${domain}`)).toBe(true);

    const listed = await listApplicationRoles(superadminId);
    expect(listed.ok && listed.data.some((item) => item.id === role.data.id)).toBe(true);
    const allowed = await listManagedStudents(adminId);
    expect(allowed.ok).toBe(true);

    const updated = await updateApplicationUser(superadminId, created.data.id, {
      firstName: "Nina",
      lastName: "Registrar",
      email: `nina${domain}`,
      password: "Screen-access2",
      roleId: role.data.id,
    });
    expect(updated.ok).toBe(true);
    const stored = await db.user.findUnique({
      where: { id: created.data.id },
      select: { firstName: true, email: true, passwordHash: true },
    });
    expect(stored).toMatchObject({ firstName: "Nina", email: `nina${domain}` });
    expect(stored ? await verifyPassword(stored.passwordHash, "Screen-access2") : false).toBe(true);

    const refusedEdit = await updateApplicationUser(adminId, created.data.id, {
      firstName: "Nope",
      lastName: "Registrar",
      email: `nina${domain}`,
      password: "",
      roleId: "",
    });
    expect(refusedEdit.ok).toBe(false);

    const tooSoon = await deleteApplicationUser(superadminId, created.data.id);
    expect(tooSoon.ok).toBe(false);
    await setManagedAccountActive(superadminId, created.data.id, false, "users");
    const restored = await setManagedAccountActive(superadminId, created.data.id, true, "users");
    expect(restored.ok).toBe(true);
    await expect(db.user.findUnique({ where: { id: created.data.id } })).resolves.toMatchObject({
      deactivatedAt: null,
    });
    await setManagedAccountActive(superadminId, created.data.id, false, "users");
    const removed = await deleteApplicationUser(superadminId, created.data.id);
    expect(removed.ok).toBe(true);
    await expect(db.user.findUnique({ where: { id: created.data.id } })).resolves.toBeNull();
  });
});
