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
};

export async function listOrganisations(
  actorId: string,
): Promise<AdminSuccess<OrganisationRecord[]> | AdminError> {
  const actor = await requireSuperAdminActor(actorId);
  if (!actor.ok) {
    return actor;
  }

  const organisations = await db.organisation.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      program: true,
      websiteUrl: true,
      repositoryUrl: true,
      technologies: true,
    },
  });

  return { ok: true, data: organisations };
}

export async function createOrganisation(
  actorId: string,
  input: OrganisationInput,
): Promise<AdminSuccess<OrganisationRecord> | AdminError> {
  const actor = await requireSuperAdminActor(actorId);
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
        createdById: actor.data.id,
      },
      select: {
        id: true,
        name: true,
        program: true,
        websiteUrl: true,
        repositoryUrl: true,
        technologies: true,
      },
    });
    return { ok: true, data: organisation };
  } catch (error) {
    logError("organisation_create_failed", { name: error instanceof Error ? error.name : "Error" });
    return { ok: false, code: "invalid", message: "The organisation could not be saved." };
  }
}
