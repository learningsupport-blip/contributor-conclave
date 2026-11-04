import { Prisma } from "@/generated/prisma/client";

import { db } from "@/lib/db";
import { logError } from "@/lib/log";
import { adminInvalid, type AdminError, type AdminSuccess } from "@/lib/admin/access";
import { requireSuperAdminActor } from "@/lib/superadmin/access";
import type { BatchInput, UniversityInput } from "@/lib/superadmin/catalog-validation";

export type UniversityRecord = {
  id: string;
  name: string;
  location: string;
};

export type BatchRecord = {
  id: string;
  year: string;
  totalStudents: number;
  universityId: string | null;
  universityName: string | null;
};

function duplicate(error: Prisma.PrismaClientKnownRequestError, kind: "university" | "batch"): AdminError | null {
  const target = `${JSON.stringify(error.meta?.target ?? "")} ${error.message}`;
  if (kind === "university" && target.toLowerCase().includes("name")) {
    return adminInvalid("A university with this name already exists.", {
      name: ["A university with this name already exists."],
    });
  }
  if (kind === "batch" && (target.toLowerCase().includes("year") || target.toLowerCase().includes("university"))) {
    return adminInvalid("A batch for this year already exists at this university.", {
      year: ["A batch for this year already exists at this university."],
    });
  }
  return null;
}

export async function listUniversities(
  actorId: string,
): Promise<AdminSuccess<UniversityRecord[]> | AdminError> {
  const actor = await requireSuperAdminActor(actorId);
  if (!actor.ok) {
    return actor;
  }

  const universities = await db.university.findMany({
    orderBy: { name: "asc" },
    take: 200,
    select: { id: true, name: true, location: true },
  });
  return { ok: true, data: universities };
}

export async function createUniversity(
  actorId: string,
  input: UniversityInput,
): Promise<AdminSuccess<UniversityRecord> | AdminError> {
  const actor = await requireSuperAdminActor(actorId);
  if (!actor.ok) {
    return actor;
  }

  try {
    const university = await db.university.create({
      data: { name: input.name, location: input.location, createdById: actor.data.id },
      select: { id: true, name: true, location: true },
    });
    return { ok: true, data: university };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const mapped = duplicate(error, "university");
      if (mapped) {
        return mapped;
      }
    }
    logError("university_create_failed", { name: error instanceof Error ? error.name : "Error" });
    return adminInvalid("The university could not be saved.");
  }
}

export async function listBatches(actorId: string): Promise<AdminSuccess<BatchRecord[]> | AdminError> {
  const actor = await requireSuperAdminActor(actorId);
  if (!actor.ok) {
    return actor;
  }

  const batches = await db.batch.findMany({
    orderBy: [{ year: "desc" }, { university: { name: "asc" } }],
    take: 200,
    select: {
      id: true,
      year: true,
      totalStudents: true,
      universityId: true,
      university: { select: { name: true } },
    },
  });
  return {
    ok: true,
    data: batches.map((batch) => ({
      id: batch.id,
      year: batch.year,
      totalStudents: batch.totalStudents,
      universityId: batch.universityId,
      universityName: batch.university?.name ?? null,
    })),
  };
}

export async function createBatch(
  actorId: string,
  input: BatchInput,
): Promise<AdminSuccess<BatchRecord> | AdminError> {
  const actor = await requireSuperAdminActor(actorId);
  if (!actor.ok) {
    return actor;
  }

  const university = await db.university.findUnique({
    where: { id: input.universityId },
    select: { id: true, name: true },
  });
  if (!university) {
    return adminInvalid("Choose a university.", { universityId: ["Choose a university."] });
  }

  try {
    const batch = await db.batch.create({
      data: {
        year: input.year,
        totalStudents: input.totalStudents,
        universityId: university.id,
        createdById: actor.data.id,
      },
      select: { id: true, year: true, totalStudents: true, universityId: true },
    });
    return {
      ok: true,
      data: { ...batch, universityName: university.name },
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const mapped = duplicate(error, "batch");
      if (mapped) {
        return mapped;
      }
    }
    logError("batch_create_failed", { name: error instanceof Error ? error.name : "Error" });
    return adminInvalid("The batch could not be saved.");
  }
}

export async function registrationOptions(): Promise<{
  universities: UniversityRecord[];
  batches: BatchRecord[];
}> {
  const [universities, batches] = await Promise.all([
    db.university.findMany({
      orderBy: { name: "asc" },
      take: 200,
      select: { id: true, name: true, location: true },
    }),
    db.batch.findMany({
      orderBy: { year: "desc" },
      take: 200,
      select: { id: true, year: true, totalStudents: true, universityId: true, university: { select: { name: true } } },
    }),
  ]);
  return {
    universities,
    batches: batches.map((batch) => ({
      id: batch.id,
      year: batch.year,
      totalStudents: batch.totalStudents,
      universityId: batch.universityId,
      universityName: batch.university?.name ?? null,
    })),
  };
}
