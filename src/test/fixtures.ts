import type { MentorApprovalStatus, Role } from "@/generated/prisma/client";

import { db } from "@/lib/db";

const PLACEHOLDER_HASH = "fixture-hash-not-a-password";

export type FixtureUserInput = {
  id?: string;
  role: Role;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash?: string;
  profileId?: string;
  niatId?: string;
  employeeId?: string;
  githubUsername?: string;
  approvalStatus?: MentorApprovalStatus;
  batch?: string;
  universityName?: string;
};

/** Removes users in an email domain and tech stacks with a name prefix. Safe for the test database only. */
export async function removeFixtures(domain: string, stackPrefix: string) {
  const users = await db.user.findMany({
    where: { email: { endsWith: domain } },
    select: {
      id: true,
      studentProfile: { select: { id: true } },
      mentorProfile: { select: { id: true } },
    },
  });
  const userIds = users.map((user) => user.id);
  const studentIds = users.flatMap((user) => (user.studentProfile ? [user.studentProfile.id] : []));
  const mentorIds = users.flatMap((user) => (user.mentorProfile ? [user.mentorProfile.id] : []));

  const submissionFilters = [
    ...(studentIds.length > 0 ? [{ studentId: { in: studentIds } }] : []),
    ...(mentorIds.length > 0 ? [{ assignments: { some: { mentorId: { in: mentorIds } } } }] : []),
  ];
  const submissions =
    submissionFilters.length === 0
      ? []
      : await db.pRSubmission.findMany({
          where: { OR: submissionFilters },
          select: { id: true },
        });
  const submissionIds = submissions.map((submission) => submission.id);

  if (submissionIds.length > 0) {
    await db.notification.deleteMany({ where: { prSubmissionId: { in: submissionIds } } });
    await db.conversation.deleteMany({ where: { prSubmissionId: { in: submissionIds } } });
    await db.pRReview.deleteMany({ where: { prSubmissionId: { in: submissionIds } } });
    await db.mentorAssignment.deleteMany({ where: { prSubmissionId: { in: submissionIds } } });
    await db.auditLog.deleteMany({
      where: {
        OR: [
          ...(userIds.length > 0 ? [{ actorId: { in: userIds } }] : []),
          { targetId: { in: submissionIds } },
        ],
      },
    });
    await db.pRSubmission.deleteMany({ where: { id: { in: submissionIds } } });
  }

  if (userIds.length > 0) {
    await db.studentProjectWork.deleteMany({
      where: {
        OR: [
          { student: { userId: { in: userIds } } },
          { project: { createdById: { in: userIds } } },
          { project: { organisation: { createdById: { in: userIds } } } },
        ],
      },
    });
    await db.studentTechInterest.deleteMany({ where: { student: { userId: { in: userIds } } } });
    await db.project.deleteMany({
      where: {
        OR: [{ createdById: { in: userIds } }, { organisation: { createdById: { in: userIds } } }],
      },
    });
    await db.organisation.deleteMany({ where: { createdById: { in: userIds } } });
    await db.applicationRequestLog.deleteMany({
      where: {
        OR: [{ userId: { in: userIds } }, { actorEmail: { endsWith: domain } }],
      },
    });
    await db.message.deleteMany({ where: { senderId: { in: userIds } } });
    await db.auditLog.deleteMany({ where: { actorId: { in: userIds } } });
    await db.notification.deleteMany({ where: { recipientId: { in: userIds } } });
    await db.session.deleteMany({ where: { userId: { in: userIds } } });
    await db.user.deleteMany({ where: { id: { in: userIds } } });
  }

  await db.applicationRequestLog.deleteMany({ where: { actorEmail: { endsWith: domain } } });
  await db.techStack.deleteMany({ where: { name: { startsWith: stackPrefix } } });
}

export async function insertUser(input: FixtureUserInput) {
  return db.user.create({
    data: {
      id: input.id,
      role: input.role,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      passwordHash: input.passwordHash ?? PLACEHOLDER_HASH,
      githubAccount: input.githubUsername
        ? { create: { username: input.githubUsername } }
        : undefined,
      studentProfile:
        input.role === "STUDENT"
          ? {
              create: {
                id: input.profileId,
                niatId: input.niatId ?? input.email,
                batch: input.batch ?? "Fixture",
                universityName: input.universityName ?? "Fixture University",
              },
            }
          : undefined,
      mentorProfile:
        input.role === "MENTOR"
          ? {
              create: {
                id: input.profileId,
                employeeId: input.employeeId ?? input.email,
                batch: input.batch ?? "Fixture",
                universityName: input.universityName ?? "Fixture University",
                approvalStatus: input.approvalStatus ?? "PENDING",
              },
            }
          : undefined,
    },
    include: { studentProfile: true, mentorProfile: true, githubAccount: true },
  });
}

export async function insertTechStack(name: string, id?: string) {
  return db.techStack.create({ data: { id, name } });
}
