import { redirect } from "next/navigation";

import type { Role } from "@/generated/prisma/client";

import { ForbiddenError, UnauthorizedError } from "@/lib/auth/errors";
import { getCurrentUser } from "@/lib/auth/session";
import type { PublicUser } from "@/lib/auth/types";
import { db } from "@/lib/db";
import { firstScreenHref, type ApplicationScreenId } from "@/lib/superadmin/screens";

export function homeForRole(role: Role): "/student/overview" | "/mentor" | "/admin" | "/superadmin" {
  switch (role) {
    case "STUDENT":
      return "/student/overview";
    case "MENTOR":
      return "/mentor";
    case "ADMIN":
      return "/admin";
    case "SUPERADMIN":
      return "/superadmin";
  }
}

export async function requireAuth(): Promise<PublicUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new UnauthorizedError();
  }

  return user;
}

export async function requireRole(roles: Role | readonly Role[]): Promise<PublicUser> {
  const user = await requireAuth();
  const allowed = Array.isArray(roles) ? roles : [roles];

  if (!allowed.includes(user.role)) {
    throw new ForbiddenError();
  }

  return user;
}

export function requireStudent(): Promise<PublicUser> {
  return requireRole("STUDENT");
}

export function requireMentor(): Promise<PublicUser> {
  return requireRole("MENTOR");
}

export function requireAdmin(): Promise<PublicUser> {
  return requireRole("ADMIN");
}

export function requireSuperAdmin(): Promise<PublicUser> {
  return requireRole("SUPERADMIN");
}

export async function landingPath(user: { id: string; role: Role }): Promise<string> {
  if (user.role !== "SUPERADMIN") {
    const account = await db.user.findUnique({
      where: { id: user.id },
      select: { applicationRole: { select: { screens: true } } },
    });
    const href = firstScreenHref(account?.applicationRole?.screens ?? []);
    if (href) {
      return href;
    }
  }

  return homeForRole(user.role);
}

export async function requireScreen(screen: ApplicationScreenId): Promise<PublicUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "SUPERADMIN" || user.screens?.includes(screen)) {
    return user;
  }

  redirect("/forbidden");
}

export async function enforcePageRole(role: Role): Promise<PublicUser> {
  try {
    return await requireRole(role);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect("/login");
    }

    if (error instanceof ForbiddenError) {
      redirect("/forbidden");
    }

    throw error;
  }
}
