import { db } from "@/lib/db";
import { logError } from "@/lib/log";
import type { AdminError, AdminSuccess } from "@/lib/admin/access";
import { requireSuperAdminActor } from "@/lib/superadmin/access";
import type { ProjectInput } from "@/lib/superadmin/project-validation";

export type ProjectRecord = {
  id: string;
  name: string;
  organisationName: string;
  program: string;
  websiteUrl: string;
  repositoryUrl: string;
  technologies: string[];
};

export async function listProjects(actorId: string): Promise<AdminSuccess<ProjectRecord[]> | AdminError> {
  const actor = await requireSuperAdminActor(actorId);
  if (!actor.ok) {
    return actor;
  }

  const projects = await db.project.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      program: true,
      websiteUrl: true,
      repositoryUrl: true,
      technologies: true,
      organisation: { select: { name: true } },
    },
  });

  return {
    ok: true,
    data: projects.map((project) => ({
      id: project.id,
      name: project.name,
      organisationName: project.organisation.name,
      program: project.program,
      websiteUrl: project.websiteUrl,
      repositoryUrl: project.repositoryUrl,
      technologies: project.technologies,
    })),
  };
}

export async function createProject(
  actorId: string,
  input: ProjectInput,
): Promise<AdminSuccess<ProjectRecord> | AdminError> {
  const actor = await requireSuperAdminActor(actorId);
  if (!actor.ok) {
    return actor;
  }

  const organisation = await db.organisation.findUnique({
    where: { id: input.organisationId },
    select: { id: true, name: true },
  });
  if (!organisation) {
    return { ok: false, code: "invalid", message: "Choose an organisation." };
  }

  try {
    const project = await db.project.create({
      data: {
        name: input.name,
        organisationId: organisation.id,
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
    return { ok: true, data: { ...project, organisationName: organisation.name } };
  } catch (error) {
    logError("project_create_failed", { name: error instanceof Error ? error.name : "Error" });
    return { ok: false, code: "invalid", message: "The project could not be saved." };
  }
}
