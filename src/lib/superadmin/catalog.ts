import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";

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
  const actor = await requireSuperAdminActor(actorId, "universities");
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
  const actor = await requireSuperAdminActor(actorId, "universities");
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

export async function updateUniversity(
  actorId: string,
  universityId: string,
  input: UniversityInput,
): Promise<AdminSuccess<UniversityRecord> | AdminError> {
  const actor = await requireSuperAdminActor(actorId, "universities");
  if (!actor.ok) {
    return actor;
  }

  if (!z.uuid().safeParse(universityId).success) {
    return adminInvalid("University not found.");
  }

  const existing = await db.university.findUnique({
    where: { id: universityId },
    select: { id: true, name: true, location: true },
  });
  if (!existing) {
    return adminInvalid("University not found.");
  }

  try {
    const university = await db.$transaction(async (tx) => {
      const updated = await tx.university.update({
        where: { id: existing.id },
        data: { name: input.name, location: input.location },
        select: { id: true, name: true, location: true },
      });
      if (updated.name !== existing.name) {
        await tx.studentProfile.updateMany({
          where: { universityId: existing.id },
          data: { universityName: updated.name },
        });
      }
      return updated;
    });
    return { ok: true, data: university };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const mapped = duplicate(error, "university");
      if (mapped) {
        return mapped;
      }
    }
    logError("university_update_failed", { name: error instanceof Error ? error.name : "Error" });
    return adminInvalid("The university could not be saved.");
  }
}

export async function deleteUniversity(
  actorId: string,
  universityId: string,
): Promise<AdminSuccess<{ id: string }> | AdminError> {
  const actor = await requireSuperAdminActor(actorId, "universities");
  if (!actor.ok) {
    return actor;
  }

  if (!z.uuid().safeParse(universityId).success) {
    return adminInvalid("University not found.");
  }

  const existing = await db.university.findUnique({
    where: { id: universityId },
    select: {
      id: true,
      _count: { select: { batches: true, students: true } },
    },
  });
  if (!existing) {
    return adminInvalid("University not found.");
  }

  if (existing._count.batches > 0 || existing._count.students > 0) {
    return adminInvalid("Remove this university's batches and student registrations before deleting it.");
  }

  try {
    await db.university.delete({ where: { id: existing.id } });
  } catch (error) {
    logError("university_delete_failed", { name: error instanceof Error ? error.name : "Error" });
    return adminInvalid("The university could not be deleted.");
  }

  return { ok: true, data: { id: existing.id } };
}

export async function listBatches(actorId: string): Promise<AdminSuccess<BatchRecord[]> | AdminError> {
  const actor = await requireSuperAdminActor(actorId, "batches");
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
  const actor = await requireSuperAdminActor(actorId, "batches");
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

export async function updateBatch(
  actorId: string,
  batchId: string,
  input: BatchInput,
): Promise<AdminSuccess<BatchRecord> | AdminError> {
  const actor = await requireSuperAdminActor(actorId, "batches");
  if (!actor.ok) {
    return actor;
  }

  if (!z.uuid().safeParse(batchId).success) {
    return adminInvalid("Batch not found.");
  }

  const existing = await db.batch.findUnique({
    where: { id: batchId },
    select: { id: true, year: true, universityId: true },
  });
  if (!existing) {
    return adminInvalid("Batch not found.");
  }

  const university = await db.university.findUnique({
    where: { id: input.universityId },
    select: { id: true, name: true },
  });
  if (!university) {
    return adminInvalid("Choose a university.", { universityId: ["Choose a university."] });
  }

  try {
    const batch = await db.$transaction(async (tx) => {
      const updated = await tx.batch.update({
        where: { id: existing.id },
        data: {
          year: input.year,
          totalStudents: input.totalStudents,
          universityId: university.id,
        },
        select: { id: true, year: true, totalStudents: true, universityId: true },
      });
      if (updated.year !== existing.year) {
        await tx.studentProfile.updateMany({
          where: { batchId: existing.id },
          data: { batch: updated.year },
        });
      }
      if (updated.universityId !== existing.universityId) {
        await tx.studentProfile.updateMany({
          where: { batchId: existing.id },
          data: { universityId: university.id, universityName: university.name },
        });
      }
      return updated;
    });
    return { ok: true, data: { ...batch, universityName: university.name } };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const mapped = duplicate(error, "batch");
      if (mapped) {
        return mapped;
      }
    }
    logError("batch_update_failed", { name: error instanceof Error ? error.name : "Error" });
    return adminInvalid("The batch could not be saved.");
  }
}

export async function deleteBatch(
  actorId: string,
  batchId: string,
): Promise<AdminSuccess<{ id: string }> | AdminError> {
  const actor = await requireSuperAdminActor(actorId, "batches");
  if (!actor.ok) {
    return actor;
  }

  if (!z.uuid().safeParse(batchId).success) {
    return adminInvalid("Batch not found.");
  }

  const existing = await db.batch.findUnique({
    where: { id: batchId },
    select: { id: true, _count: { select: { students: true } } },
  });
  if (!existing) {
    return adminInvalid("Batch not found.");
  }

  if (existing._count.students > 0) {
    return adminInvalid("Remove the students registered in this batch before deleting it.");
  }

  try {
    await db.batch.delete({ where: { id: existing.id } });
  } catch (error) {
    logError("batch_delete_failed", { name: error instanceof Error ? error.name : "Error" });
    return adminInvalid("The batch could not be deleted.");
  }

  return { ok: true, data: { id: existing.id } };
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
