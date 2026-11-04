import { z } from "zod";

import { db } from "@/lib/db";
import { logError } from "@/lib/log";
import type { AdminError, AdminSuccess } from "@/lib/admin/access";
import { isOrganisationTechnology } from "@/lib/superadmin/organisation-options";
import {
  matchingOrganisations,
  technologiesInUse,
  type OpportunityOrganisation,
} from "@/lib/student/opportunity-match";

const interestSchema = z.object({
  technologies: z
    .array(z.string().refine((value) => isOrganisationTechnology(value), { error: "Choose a listed technology." }))
    .min(1, { error: "Choose at least one technology." }),
});

export type StudentOpportunities = {
  technologies: string[];
  interests: string[];
  organisations: OpportunityOrganisation[];
};

export type StudentOrganisationDetail = OpportunityOrganisation & {
  startedProjectIds: string[];
};

async function studentActor(userId: string): Promise<AdminSuccess<{ id: string }> | AdminError> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, studentProfile: { select: { id: true } } },
  });
  if (!user || user.role !== "STUDENT" || !user.studentProfile) {
    return { ok: false, code: "forbidden", message: "Only a student can choose organisations." };
  }
  return { ok: true, data: user.studentProfile };
}

async function catalog(): Promise<OpportunityOrganisation[]> {
  return db.organisation.findMany({
    orderBy: { name: "asc" },
    take: 100,
    select: {
      id: true,
      name: true,
      program: true,
      websiteUrl: true,
      repositoryUrl: true,
      technologies: true,
      projects: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          program: true,
          websiteUrl: true,
          repositoryUrl: true,
          technologies: true,
        },
      },
    },
  });
}

export async function getStudentOpportunities(userId: string): Promise<AdminSuccess<StudentOpportunities> | AdminError> {
  const actor = await studentActor(userId);
  if (!actor.ok) {
    return actor;
  }

  const organisations = await catalog();
  const interests = await db.studentTechInterest.findMany({
    where: { studentId: actor.data.id },
    select: { technology: true },
    orderBy: { technology: "asc" },
  });
  const selected = interests.map((interest) => interest.technology);

  return {
    ok: true,
    data: {
      technologies: technologiesInUse(organisations),
      interests: selected,
      organisations: matchingOrganisations(organisations, selected),
    },
  };
}

export async function saveStudentInterests(
  userId: string,
  technologies: string[],
): Promise<AdminSuccess<{ technologies: string[] }> | AdminError> {
  const actor = await studentActor(userId);
  if (!actor.ok) {
    return actor;
  }

  const parsed = interestSchema.safeParse({ technologies });
  if (!parsed.success) {
    return { ok: false, code: "invalid", message: "Choose at least one technology." };
  }

  const available = new Set(technologiesInUse(await catalog()));
  const unique = [...new Set(parsed.data.technologies)];
  if (unique.some((technology) => !available.has(technology))) {
    return { ok: false, code: "invalid", message: "Choose a technology used by an organisation or project." };
  }

  try {
    await db.$transaction([
      db.studentTechInterest.deleteMany({ where: { studentId: actor.data.id } }),
      db.studentTechInterest.createMany({
        data: unique.map((technology) => ({ studentId: actor.data.id, technology })),
      }),
    ]);
  } catch (error) {
    logError("student_interest_save_failed", { name: error instanceof Error ? error.name : "Error" });
    return { ok: false, code: "invalid", message: "The tech stacks could not be saved." };
  }

  return { ok: true, data: { technologies: unique } };
}

export async function getStudentOrganisation(
  userId: string,
  organisationId: string,
): Promise<AdminSuccess<StudentOrganisationDetail> | AdminError> {
  const actor = await studentActor(userId);
  if (!actor.ok) {
    return actor;
  }
  if (!z.uuid().safeParse(organisationId).success) {
    return { ok: false, code: "invalid", message: "That organisation could not be found." };
  }

  const organisation = await db.organisation.findUnique({
    where: { id: organisationId },
    select: {
      id: true,
      name: true,
      program: true,
      websiteUrl: true,
      repositoryUrl: true,
      technologies: true,
      projects: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          program: true,
          websiteUrl: true,
          repositoryUrl: true,
          technologies: true,
        },
      },
    },
  });
  if (!organisation) {
    return { ok: false, code: "invalid", message: "That organisation could not be found." };
  }

  const started = await db.studentProjectWork.findMany({
    where: { studentId: actor.data.id, projectId: { in: organisation.projects.map((project) => project.id) } },
    select: { projectId: true },
  });

  return { ok: true, data: { ...organisation, startedProjectIds: started.map((work) => work.projectId) } };
}

export async function startStudentProject(
  userId: string,
  projectId: string,
): Promise<AdminSuccess<{ organisationId: string }> | AdminError> {
  const actor = await studentActor(userId);
  if (!actor.ok) {
    return actor;
  }
  if (!z.uuid().safeParse(projectId).success) {
    return { ok: false, code: "invalid", message: "That project could not be found." };
  }

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, organisationId: true },
  });
  if (!project) {
    return { ok: false, code: "invalid", message: "That project could not be found." };
  }

  try {
    await db.studentProjectWork.upsert({
      where: { studentId_projectId: { studentId: actor.data.id, projectId: project.id } },
      create: { studentId: actor.data.id, projectId: project.id },
      update: {},
    });
  } catch (error) {
    logError("student_project_start_failed", { name: error instanceof Error ? error.name : "Error" });
    return { ok: false, code: "invalid", message: "The project could not be started." };
  }

  return { ok: true, data: { organisationId: project.organisationId } };
}
