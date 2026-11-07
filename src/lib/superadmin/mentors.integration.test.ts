import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import { listMentorOrganisations } from "@/lib/mentor/directory";
import {
  approveMentor,
  assignMentorOrganisation,
  deleteMentor,
  listMentors,
  setMentorActive,
  unassignMentorOrganisation,
} from "@/lib/superadmin/mentors";
import { insertUser, removeFixtures } from "@/test/fixtures";

const domain = "@mentor-management-test.example";

let superadminId = "";
let adminId = "";
let mentorId = "";
let organisationId = "";
let hiddenOrganisationId = "";

beforeAll(async () => {
  await removeFixtures(domain, "Mentor Management ");
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
  const mentor = await insertUser({
    role: "MENTOR",
    email: `mentor${domain}`,
    firstName: "Grace",
    lastName: "Hopper",
    employeeId: `EMP-${randomUUID()}`,
    githubUsername: `grace-${randomUUID().slice(0, 8)}`,
  });
  superadminId = superadmin.id;
  adminId = admin.id;
  mentorId = mentor.id;
  const organisation = await db.organisation.create({
    data: {
      name: `Assigned ${randomUUID()}`,
      program: "GSOC",
      websiteUrl: "https://assigned.example",
      repositoryUrl: "https://github.com/example/assigned",
      technologies: ["React"],
      approved: true,
      createdById: superadmin.id,
    },
  });
  const hidden = await db.organisation.create({
    data: {
      name: `Hidden ${randomUUID()}`,
      program: "GSOC",
      websiteUrl: "https://hidden.example",
      repositoryUrl: "https://github.com/example/hidden",
      technologies: ["Typescript"],
      approved: false,
      createdById: superadmin.id,
    },
  });
  organisationId = organisation.id;
  hiddenOrganisationId = hidden.id;
});

afterAll(async () => {
  await removeFixtures(domain, "Mentor Management ");
});

describe("mentor management", () => {
  it("lists a registered mentor for the super admin and hides the list from an admin", async () => {
    const listed = await listMentors(superadminId);
    expect(listed.ok).toBe(true);
    if (!listed.ok) {
      return;
    }
    expect(listed.data.some((mentor) => mentor.id === mentorId && mentor.approvalStatus === "PENDING")).toBe(true);
    expect(listed.data.find((mentor) => mentor.id === mentorId)?.githubUsername).toBeTruthy();

    const denied = await listMentors(adminId);
    expect(denied.ok).toBe(false);

    const tooEarly = await assignMentorOrganisation(superadminId, mentorId, organisationId);
    expect(tooEarly.ok).toBe(false);
  });

  it("approves, disables, and deletes a mentor only after access is turned off", async () => {
    const denied = await approveMentor(adminId, mentorId);
    expect(denied.ok).toBe(false);

    const approved = await approveMentor(superadminId, mentorId);
    expect(approved.ok).toBe(true);
    await expect(
      db.mentorProfile.findUniqueOrThrow({ where: { userId: mentorId } }),
    ).resolves.toMatchObject({ approvalStatus: "APPROVED" });

    const refused = await assignMentorOrganisation(adminId, mentorId, organisationId);
    expect(refused.ok).toBe(false);
    const hidden = await assignMentorOrganisation(superadminId, mentorId, hiddenOrganisationId);
    expect(hidden.ok).toBe(false);

    const assigned = await assignMentorOrganisation(superadminId, mentorId, organisationId);
    expect(assigned.ok).toBe(true);
    const visible = await listMentorOrganisations(mentorId);
    expect(visible.ok).toBe(true);
    if (visible.ok) {
      expect(visible.data.map((organisation) => organisation.id)).toEqual([organisationId]);
    }

    const removed = await unassignMentorOrganisation(superadminId, mentorId, organisationId);
    expect(removed.ok).toBe(true);
    const afterRemoval = await listMentorOrganisations(mentorId);
    expect(afterRemoval.ok && afterRemoval.data).toEqual([]);

    const stillActive = await deleteMentor(superadminId, mentorId);
    expect(stillActive.ok).toBe(false);
    if (!stillActive.ok) {
      expect(stillActive.message).toBe("Disable this mentor before deleting the account.");
    }
    await expect(db.user.findUnique({ where: { id: mentorId } })).resolves.toBeTruthy();

    const disabled = await setMentorActive(superadminId, mentorId, false);
    expect(disabled.ok).toBe(true);
    await expect(db.user.findUniqueOrThrow({ where: { id: mentorId } })).resolves.toMatchObject({
      deactivatedAt: expect.any(Date),
    });
    await expect(db.session.count({ where: { userId: mentorId } })).resolves.toBe(0);

    const deleted = await deleteMentor(superadminId, mentorId);
    expect(deleted.ok).toBe(true);
    await expect(db.user.findUnique({ where: { id: mentorId } })).resolves.toBeNull();
    await expect(db.mentorProfile.findUnique({ where: { userId: mentorId } })).resolves.toBeNull();
  });
});
