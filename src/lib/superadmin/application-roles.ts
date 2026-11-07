import { Prisma } from "@/generated/prisma/client";

import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { logError } from "@/lib/log";
import { adminInvalid, type AdminError, type AdminSuccess } from "@/lib/admin/access";
import { requireSuperAdminActor } from "@/lib/superadmin/access";
import type { ApplicationRoleInput, ApplicationUserInput, ApplicationUserUpdate } from "@/lib/superadmin/access-validation";
import { isApplicationScreen } from "@/lib/superadmin/screens";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ApplicationRoleRecord = {
  id: string;
  name: string;
  screens: string[];
};

function parseUuid(value: string): string | null {
  return UUID_PATTERN.test(value) ? value : null;
}

export async function listApplicationRoles(
  actorId: string,
  screen: "roles" | "users" = "roles",
): Promise<AdminSuccess<ApplicationRoleRecord[]> | AdminError> {
  const actor = await requireSuperAdminActor(actorId, screen);
  if (!actor.ok) {
    return actor;
  }

  const roles = await db.applicationRole.findMany({
    orderBy: { name: "asc" },
    take: 200,
    select: { id: true, name: true, screens: true },
  });
  return { ok: true, data: roles };
}

export async function createApplicationRole(
  actorId: string,
  input: ApplicationRoleInput,
): Promise<AdminSuccess<ApplicationRoleRecord> | AdminError> {
  const actor = await requireSuperAdminActor(actorId, "roles");
  if (!actor.ok) {
    return actor;
  }

  const screens = [...new Set(input.screens.filter(isApplicationScreen))];
  if (screens.length === 0) {
    return adminInvalid("Choose at least one screen.", { screens: ["Choose at least one screen."] });
  }

  try {
    const role = await db.applicationRole.create({
      data: { name: input.name, screens, createdById: actor.data.id },
      select: { id: true, name: true, screens: true },
    });
    return { ok: true, data: role };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return adminInvalid("A role with this name already exists.", {
        name: ["A role with this name already exists."],
      });
    }
    logError("application_role_create_failed", { name: error instanceof Error ? error.name : "Error" });
    return adminInvalid("The role could not be saved.");
  }
}

export async function createApplicationUser(
  actorId: string,
  input: ApplicationUserInput,
): Promise<AdminSuccess<{ id: string }> | AdminError> {
  const actor = await requireSuperAdminActor(actorId, "users");
  if (!actor.ok) {
    return actor;
  }

  const role = await db.applicationRole.findUnique({
    where: { id: input.roleId },
    select: { id: true },
  });
  if (!role) {
    return adminInvalid("Choose a role.", { roleId: ["Choose a role."] });
  }

  try {
    const passwordHash = await hashPassword(input.password);
    const user = await db.user.create({
      data: {
        role: "ADMIN",
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        passwordHash,
        applicationRoleId: role.id,
      },
      select: { id: true },
    });
    return { ok: true, data: user };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return adminInvalid("An account with this email already exists.", {
        email: ["An account with this email already exists."],
      });
    }
    logError("application_user_create_failed", { name: error instanceof Error ? error.name : "Error" });
    return adminInvalid("The account could not be saved.");
  }
}

export async function assignApplicationRole(
  actorId: string,
  userId: string,
  roleId: string,
): Promise<AdminSuccess<{ id: string }> | AdminError> {
  const actor = await requireSuperAdminActor(actorId, "users");
  if (!actor.ok) {
    return actor;
  }

  if (!parseUuid(userId) || !parseUuid(roleId) || userId === actor.data.id) {
    return adminInvalid("That account cannot be changed.");
  }

  const [target, role] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, applicationRoleId: true },
    }),
    db.applicationRole.findUnique({ where: { id: roleId }, select: { id: true } }),
  ]);

  if (!target || target.role !== "ADMIN" || !role) {
    return adminInvalid("That account cannot be changed.");
  }

  if (target.applicationRoleId === role.id) {
    return adminInvalid("This account already has that role.");
  }

  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: target.id }, data: { applicationRoleId: role.id } });
    await tx.session.deleteMany({ where: { userId: target.id } });
    await tx.auditLog.create({
      data: {
        actorId: actor.data.id,
        action: "USER_ROLE_CHANGED",
        targetType: "USER",
        targetId: target.id,
        detail: `application role ${role.id}`,
      },
    });
  });

  return { ok: true, data: { id: target.id } };
}

async function editableAdmin(actorId: string, userId: string) {
  const actor = await requireSuperAdminActor(actorId, "users");
  if (!actor.ok) {
    return actor;
  }

  if (!parseUuid(userId) || userId === actor.data.id) {
    return adminInvalid("That account cannot be changed.");
  }

  const target = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, email: true, applicationRoleId: true, deactivatedAt: true },
  });

  if (!target || target.role !== "ADMIN") {
    return adminInvalid("That account cannot be changed.");
  }

  return { ok: true as const, actor, target };
}

export async function updateApplicationUser(
  actorId: string,
  userId: string,
  input: ApplicationUserUpdate,
): Promise<AdminSuccess<{ id: string }> | AdminError> {
  const editable = await editableAdmin(actorId, userId);
  if (!editable.ok) {
    return editable;
  }

  const role =
    input.roleId === ""
      ? null
      : await db.applicationRole.findUnique({ where: { id: input.roleId }, select: { id: true } });
  if (input.roleId !== "" && !role) {
    return adminInvalid("Choose a role.", { roleId: ["Choose a role."] });
  }

  const nextRoleId = role?.id ?? editable.target.applicationRoleId;
  const passwordChanged = input.password !== "";
  const passwordHash = passwordChanged ? await hashPassword(input.password) : null;
  const credentialsChanged = passwordChanged || input.email !== editable.target.email || nextRoleId !== editable.target.applicationRoleId;

  try {
    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: editable.target.id },
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          applicationRoleId: nextRoleId,
          ...(passwordHash ? { passwordHash } : {}),
        },
      });
      if (credentialsChanged) {
        await tx.session.deleteMany({ where: { userId: editable.target.id } });
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return adminInvalid("An account with this email already exists.", {
        email: ["An account with this email already exists."],
      });
    }
    logError("application_user_update_failed", { name: error instanceof Error ? error.name : "Error" });
    return adminInvalid("The account could not be saved.");
  }

  return { ok: true, data: { id: editable.target.id } };
}

export async function deleteApplicationUser(
  actorId: string,
  userId: string,
): Promise<AdminSuccess<{ id: string }> | AdminError> {
  const editable = await editableAdmin(actorId, userId);
  if (!editable.ok) {
    return editable;
  }

  if (!editable.target.deactivatedAt) {
    return adminInvalid("Deactivate this user before deleting the account.");
  }

  const attached = await db.user.findUnique({
    where: { id: editable.target.id },
    select: {
      _count: {
        select: {
          organisations: true,
          projects: true,
          universities: true,
          batches: true,
          applicationRolesCreated: true,
          assignmentsMade: true,
          mentorOrganisationGrants: true,
          sentMessages: true,
        },
      },
    },
  });
  const counts = attached?._count;
  const blocked = counts
    ? Object.values(counts).some((count) => count > 0)
    : false;
  if (blocked) {
    return adminInvalid("This user still has records attached. Remove those before deleting the account.");
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.auditLog.deleteMany({ where: { actorId: editable.target.id } });
      await tx.user.delete({ where: { id: editable.target.id } });
    });
  } catch (error) {
    logError("application_user_delete_failed", { name: error instanceof Error ? error.name : "Error" });
    return adminInvalid("The account could not be deleted.");
  }

  return { ok: true, data: { id: editable.target.id } };
}
