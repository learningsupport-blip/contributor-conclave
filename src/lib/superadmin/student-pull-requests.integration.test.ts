import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import { listStudentPullRequests } from "@/lib/superadmin/student-pull-requests";
import { insertTechStack, insertUser, removeFixtures } from "@/test/fixtures";

const domain = "@student-pr-list.example";

let superadminId = "";
let adminId = "";

beforeAll(async () => {
  await removeFixtures(domain, "Student PR ");
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
  await removeFixtures(domain, "Student PR ");
});

describe("student pull request list", () => {
  it("shows a student's submission to a super admin and refuses an admin", async () => {
    const student = await insertUser({
      role: "STUDENT",
      email: `student${domain}`,
      firstName: "Meera",
      lastName: "Student",
    });
    const stack = await insertTechStack("Student PR React");
    const profileId = student.studentProfile?.id;
    expect(profileId).toBeTruthy();
    if (!profileId) {
      return;
    }

    await db.pRSubmission.create({
      data: {
        studentId: profileId,
        githubPrUrl: "https://github.com/example/student-pr-list/pull/1",
        repository: "example/student-pr-list",
        techStackId: stack.id,
      },
    });

    const forbidden = await listStudentPullRequests(adminId);
    expect(forbidden.ok).toBe(false);

    const listed = await listStudentPullRequests(superadminId);
    expect(listed.ok).toBe(true);
    if (!listed.ok) {
      return;
    }
    expect(listed.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          studentName: "Meera Student",
          repository: "example/student-pr-list",
          techStack: "Student PR React",
          status: "PENDING",
        }),
      ]),
    );
  });
});
