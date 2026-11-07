import { db } from "@/lib/db";
import { logError } from "@/lib/log";
import type { AdminError, AdminSuccess } from "@/lib/admin/access";
import { requireSuperAdminActor } from "@/lib/superadmin/access";
import type { OrganisationInput } from "@/lib/superadmin/organisation-validation";

export type OrganisationRecord = {
  id: string;
  name: string;
  program: string;
  websiteUrl: string;
  repositoryUrl: string;
  technologies: string[];
  approved: boolean;
};

const organisationSelect = {
  id: true,
  name: true,
  program: true,
  websiteUrl: true,
  repositoryUrl: true,
  technologies: true,
  approved: true,
} as const;

export async function listOrganisations(
  actorId: string,
): Promise<AdminSuccess<OrganisationRecord[]> | AdminError> {
  const actor = await requireSuperAdminActor(actorId, "resources");
  if (!actor.ok) {
    return actor;
  }

  const organisations = await db.organisation.findMany({
    where: { approved: true },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: organisationSelect,
  });

  return { ok: true, data: organisations };
}

export async function approveOrganisation(
  actorId: string,
  input: Omit<OrganisationInput, "technologies"> & { technologies: string[] },
): Promise<AdminSuccess<OrganisationRecord> | AdminError> {
  const actor = await requireSuperAdminActor(actorId, "resources");
  if (!actor.ok) {
    return actor;
  }

  const existing = await db.organisation.findFirst({
    where: { name: { equals: input.name, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) {
    try {
      const organisation = await db.organisation.update({
        where: { id: existing.id },
        data: {
          approved: true,
          program: input.program,
          websiteUrl: input.websiteUrl,
          repositoryUrl: input.repositoryUrl,
          technologies: input.technologies,
        },
        select: organisationSelect,
      });
      return { ok: true, data: organisation };
    } catch (error) {
      logError("organisation_approve_failed", { name: error instanceof Error ? error.name : "Error" });
      return { ok: false, code: "invalid", message: "The organisation could not be approved." };
    }
  }

  return createOrganisation(actorId, input);
}

export async function disapproveOrganisation(
  actorId: string,
  name: string,
): Promise<AdminSuccess<OrganisationRecord> | AdminError> {
  const actor = await requireSuperAdminActor(actorId, "resources");
  if (!actor.ok) {
    return actor;
  }

  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 120) {
    return { ok: false, code: "invalid", message: "That organisation cannot be disapproved." };
  }

  const existing = await db.organisation.findFirst({
    where: { name: { equals: trimmed, mode: "insensitive" }, approved: true },
    select: { id: true },
  });
  if (!existing) {
    return { ok: false, code: "invalid", message: "That organisation is not approved." };
  }

  try {
    const organisation = await db.organisation.update({
      where: { id: existing.id },
      data: { approved: false },
      select: organisationSelect,
    });
    return { ok: true, data: organisation };
  } catch (error) {
    logError("organisation_disapprove_failed", { name: error instanceof Error ? error.name : "Error" });
    return { ok: false, code: "invalid", message: "The organisation could not be disapproved." };
  }
}

export async function createOrganisation(
  actorId: string,
  input: Omit<OrganisationInput, "technologies"> & { technologies: string[] },
): Promise<AdminSuccess<OrganisationRecord> | AdminError> {
  const actor = await requireSuperAdminActor(actorId, "resources");
  if (!actor.ok) {
    return actor;
  }

  try {
    const organisation = await db.organisation.create({
      data: {
        name: input.name,
        program: input.program,
        websiteUrl: input.websiteUrl,
        repositoryUrl: input.repositoryUrl,
        technologies: input.technologies,
        approved: true,
        createdById: actor.data.id,
      },
      select: organisationSelect,
    });
    return { ok: true, data: organisation };
  } catch (error) {
    logError("organisation_create_failed", { name: error instanceof Error ? error.name : "Error" });
    return { ok: false, code: "invalid", message: "The organisation could not be saved." };
  }
}
