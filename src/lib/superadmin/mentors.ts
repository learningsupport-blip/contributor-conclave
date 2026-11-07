import "server-only";

import { db } from "@/lib/db";
import { parseUuid } from "@/lib/mentor/access";
import { adminInvalid } from "@/lib/superadmin/access";
import { requireSuperAdminActor } from "@/lib/superadmin/access";
import { setManagedAccountActive } from "@/lib/superadmin/users";
import type { AdminError, AdminSuccess } from "@/lib/admin/access";
import type { MentorApprovalStatus } from "@/generated/prisma/client";
import type { ManagedMentor } from "@/lib/superadmin/mentor-model";

export type { ManagedMentor };

const mentorSelect = {
  id: true,
  role: true,
  firstName: true,
  lastName: true,
  email: true,
  deactivatedAt: true,
  createdAt: true,
  githubAccount: { select: { username: true } },
  mentorProfile: {
    select: {
      id: true,
      employeeId: true,
      approvalStatus: true,
      organisationAssignments: {
        orderBy: { createdAt: "asc" },
        select: { organisation: { select: { id: true, name: true, approved: true } } },
      },
    },
  },
} as const;

function presentMentor(user: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  deactivatedAt: Date | null;
  createdAt: Date;
  githubAccount: { username: string } | null;
  mentorProfile: {
    employeeId: string;
    approvalStatus: MentorApprovalStatus;
    organisationAssignments: { organisation: { id: string; name: string; approved: boolean } }[];
  } | null;
}): ManagedMentor | null {
  if (!user.mentorProfile) {
    return null;
  }

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    employeeId: user.mentorProfile.employeeId,
    githubUsername: user.githubAccount?.username ?? null,
    approvalStatus: user.mentorProfile.approvalStatus,
    organisations: user.mentorProfile.organisationAssignments.map((assignment) => assignment.organisation),
    active: user.deactivatedAt === null,
    registeredAt: user.createdAt.toISOString(),
  };
}

export async function listMentors(
  actorId: string,
): Promise<AdminSuccess<ManagedMentor[]> | AdminError> {
  const actor = await requireSuperAdminActor(actorId, "mentors");
  if (!actor.ok) {
    return actor;
  }

  const rows = await db.user.findMany({
    where: { role: "MENTOR" },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: mentorSelect,
  });

  return {
    ok: true,
    data: rows.flatMap((row) => {
      const mentor = presentMentor(row);
      return mentor ? [mentor] : [];
    }),
  };
}

async function findMentor(userId: string) {
  if (!parseUuid(userId)) {
    return null;
  }

  return db.user.findUnique({
    where: { id: userId },
    select: mentorSelect,
  });
}

export async function approveMentor(
  actorId: string,
  userId: string,
): Promise<AdminSuccess<{ id: string }> | AdminError> {
  const actor = await requireSuperAdminActor(actorId, "mentors");
  if (!actor.ok) {
    return actor;
  }

  const mentor = await findMentor(userId);
  if (!mentor?.mentorProfile || mentor.role !== "MENTOR") {
    return adminInvalid("Mentor not found.");
  }

  if (mentor.mentorProfile.approvalStatus === "APPROVED") {
    return adminInvalid("This mentor is already approved.");
  }

  await db.$transaction([
    db.mentorProfile.update({
      where: { id: mentor.mentorProfile.id },
      data: { approvalStatus: "APPROVED" },
    }),
    db.auditLog.create({
      data: {
        actorId: actor.data.id,
        action: "MENTOR_APPROVED",
        targetType: "USER",
        targetId: mentor.id,
        detail: "Approved by super admin",
      },
    }),
  ]);

  return { ok: true, data: { id: mentor.id } };
}

export async function setMentorActive(
  actorId: string,
  userId: string,
  active: boolean,
): Promise<AdminSuccess<{ id: string }> | AdminError> {
  const mentor = await findMentor(userId);
  if (!mentor?.mentorProfile || mentor.role !== "MENTOR") {
    const actor = await requireSuperAdminActor(actorId, "mentors");
    if (!actor.ok) {
      return actor;
    }
    return adminInvalid("Mentor not found.");
  }

  return setManagedAccountActive(actorId, userId, active, "mentors");
}

export async function deleteMentor(
  actorId: string,
  userId: string,
): Promise<AdminSuccess<{ id: string }> | AdminError> {
  const actor = await requireSuperAdminActor(actorId, "mentors");
  if (!actor.ok) {
    return actor;
  }

  const mentor = await findMentor(userId);
  if (!mentor?.mentorProfile || mentor.role !== "MENTOR") {
    return adminInvalid("Mentor not found.");
  }

  if (!mentor.deactivatedAt) {
    return adminInvalid("Disable this mentor before deleting the account.");
  }

  const profileId = mentor.mentorProfile.id;

  try {
    await db.$transaction(async (tx) => {
      await tx.pRReview.deleteMany({ where: { mentorId: profileId } });
      await tx.mentorAssignment.deleteMany({
        where: { OR: [{ mentorId: profileId }, { assignedById: mentor.id }] },
      });
      await tx.message.deleteMany({ where: { senderId: mentor.id } });
      await tx.auditLog.deleteMany({ where: { actorId: mentor.id } });
      await tx.user.delete({ where: { id: mentor.id } });
    });
  } catch {
    return adminInvalid("This mentor could not be deleted.");
  }

  return { ok: true, data: { id: mentor.id } };
}

export async function assignMentorOrganisation(
  actorId: string,
  userId: string,
  organisationId: string,
): Promise<AdminSuccess<{ id: string }> | AdminError> {
  const actor = await requireSuperAdminActor(actorId, "mentors");
  if (!actor.ok) {
    return actor;
  }

  const mentor = await findMentor(userId);
  if (!mentor?.mentorProfile || mentor.role !== "MENTOR") {
    return adminInvalid("Mentor not found.");
  }

  if (mentor.mentorProfile.approvalStatus !== "APPROVED") {
    return adminInvalid("Approve this mentor before assigning an organisation.");
  }

  if (!parseUuid(organisationId)) {
    return adminInvalid("Choose an approved organisation.");
  }

  const organisation = await db.organisation.findUnique({
    where: { id: organisationId },
    select: { id: true, approved: true },
  });
  if (!organisation?.approved) {
    return adminInvalid("Choose an approved organisation.");
  }

  const existing = mentor.mentorProfile.organisationAssignments.some(
    (assignment) => assignment.organisation.id === organisation.id,
  );
  if (existing) {
    return adminInvalid("This organisation is already assigned to this mentor.");
  }

  await db.mentorOrganisation.create({
    data: {
      mentorId: mentor.mentorProfile.id,
      organisationId: organisation.id,
      assignedById: actor.data.id,
    },
  });

  return { ok: true, data: { id: mentor.id } };
}

export async function unassignMentorOrganisation(
  actorId: string,
  userId: string,
  organisationId: string,
): Promise<AdminSuccess<{ id: string }> | AdminError> {
  const actor = await requireSuperAdminActor(actorId, "mentors");
  if (!actor.ok) {
    return actor;
  }

  const mentor = await findMentor(userId);
  if (!mentor?.mentorProfile || mentor.role !== "MENTOR" || !parseUuid(organisationId)) {
    return adminInvalid("Mentor not found.");
  }

  const assigned = mentor.mentorProfile.organisationAssignments.some(
    (assignment) => assignment.organisation.id === organisationId,
  );
  if (!assigned) {
    return adminInvalid("That organisation is not assigned to this mentor.");
  }

  await db.mentorOrganisation.delete({
    where: {
      mentorId_organisationId: {
        mentorId: mentor.mentorProfile.id,
        organisationId,
      },
    },
  });

  return { ok: true, data: { id: mentor.id } };
}
