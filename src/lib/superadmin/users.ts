import type { Role } from "@/generated/prisma/client";

import { db } from "@/lib/db";
import { logError } from "@/lib/log";
import { adminInvalid, type AdminError, type AdminSuccess } from "@/lib/admin/access";
import { requireSuperAdminActor } from "@/lib/superadmin/access";
import type { ApplicationScreenId } from "@/lib/superadmin/screens";

const ASSIGNABLE_ROLES = ["STUDENT", "MENTOR", "ADMIN"] as const;
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ManagedUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  deactivatedAt: Date | null;
  hasStudentProfile: boolean;
  hasMentorProfile: boolean;
  applicationRoleId: string | null;
  applicationRoleName: string | null;
};

function parseUuid(value: string): string | null {
  return UUID_PATTERN.test(value) ? value : null;
}

export function isAssignableRole(value: string): value is AssignableRole {
  return ASSIGNABLE_ROLES.some((role) => role === value);
}

export async function listManagedUsers(actorId: string): Promise<AdminSuccess<ManagedUser[]> | AdminError> {
  const actor = await requireSuperAdminActor(actorId, "users");
  if (!actor.ok) {
    return actor;
  }

  const users = await db.user.findMany({
    where: { role: { in: ["ADMIN", "SUPERADMIN"] } },
    orderBy: [{ role: "asc" }, { email: "asc" }],
    take: 200,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      deactivatedAt: true,
      applicationRoleId: true,
      applicationRole: { select: { name: true } },
      studentProfile: { select: { id: true } },
      mentorProfile: { select: { id: true } },
    },
  });

  return {
    ok: true,
    data: users.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      deactivatedAt: user.deactivatedAt,
      hasStudentProfile: user.studentProfile !== null,
      hasMentorProfile: user.mentorProfile !== null,
      applicationRoleId: user.applicationRoleId,
      applicationRoleName: user.applicationRole?.name ?? null,
    })),
  };
}

export async function changeUserRole(
  actorId: string,
  userId: string,
  role: AssignableRole,
): Promise<AdminSuccess<{ id: string }> | AdminError> {
  const actor = await requireSuperAdminActor(actorId, "users");
  if (!actor.ok) {
    return actor;
  }

  if (!isAssignableRole(role) || !parseUuid(userId) || userId === actor.data.id) {
    return adminInvalid("That account cannot be changed.");
  }

  const target = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      studentProfile: { select: { id: true } },
      mentorProfile: { select: { id: true } },
    },
  });

  if (!target || target.role === "SUPERADMIN") {
    return adminInvalid("That account cannot be changed.");
  }

  if (target.role === role) {
    return adminInvalid("This account already has that role.");
  }

  if (role === "STUDENT" && !target.studentProfile) {
    return adminInvalid("A student account needs a student profile before that role can be assigned.");
  }

  if (role === "MENTOR" && !target.mentorProfile) {
    return adminInvalid("A mentor account needs a mentor profile before that role can be assigned.");
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.user.update({ where: { id: target.id }, data: { role } });
      await tx.session.deleteMany({ where: { userId: target.id } });
      await tx.auditLog.create({
        data: {
          actorId: actor.data.id,
          action: "USER_ROLE_CHANGED",
          targetType: "USER",
          targetId: target.id,
          detail: `${target.role} to ${role}`,
        },
      });
    });
  } catch (error) {
    logError("superadmin.role_change_failed", {
      actorId: actor.data.id,
      name: error instanceof Error ? error.name : "Error",
    });
    return adminInvalid("The role could not be changed. Try again.");
  }

  return { ok: true, data: { id: target.id } };
}

export async function setManagedAccountActive(
  actorId: string,
  userId: string,
  active: boolean,
  screen: ApplicationScreenId = "users",
): Promise<AdminSuccess<{ id: string }> | AdminError> {
  const actor = await requireSuperAdminActor(actorId, screen);
  if (!actor.ok) {
    return actor;
  }

  if (!parseUuid(userId) || userId === actor.data.id) {
    return adminInvalid("That account cannot be changed.");
  }

  const target = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, deactivatedAt: true },
  });

  if (!target || target.role === "SUPERADMIN") {
    return adminInvalid("That account cannot be changed.");
  }

  if (screen === "students" && target.role !== "STUDENT") {
    return adminInvalid("That account cannot be changed.");
  }

  if (screen === "mentors" && target.role !== "MENTOR") {
    return adminInvalid("That account cannot be changed.");
  }

  if (screen === "users" && target.role !== "ADMIN") {
    return adminInvalid("That account cannot be changed.");
  }

  if (active && !target.deactivatedAt) {
    return adminInvalid("This account is already active.");
  }

  if (!active && target.deactivatedAt) {
    return adminInvalid("This account is already deactivated.");
  }

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: target.id },
      data: { deactivatedAt: active ? null : new Date() },
    });
    if (!active) {
      await tx.session.deleteMany({ where: { userId: target.id } });
    }
    await tx.auditLog.create({
      data: {
        actorId: actor.data.id,
        action: active ? "USER_REACTIVATED" : "USER_DEACTIVATED",
        targetType: "USER",
        targetId: target.id,
        detail: `${target.role} account`,
      },
    });
  });

  return { ok: true, data: { id: target.id } };
}
