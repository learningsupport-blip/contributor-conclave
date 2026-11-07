import { db } from "@/lib/db";
import { logError } from "@/lib/log";
import { adminInvalid, type AdminError, type AdminSuccess } from "@/lib/admin/access";
import { requireSuperAdminActor } from "@/lib/superadmin/access";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ManagedStudent = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  universityName: string;
  batch: string;
  deactivatedAt: Date | null;
};

export async function listManagedStudents(actorId: string): Promise<AdminSuccess<ManagedStudent[]> | AdminError> {
  const actor = await requireSuperAdminActor(actorId, "students");
  if (!actor.ok) {
    return actor;
  }

  const students = await db.user.findMany({
    where: { role: "STUDENT" },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: 200,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      deactivatedAt: true,
      studentProfile: { select: { universityName: true, batch: true } },
    },
  });

  return {
    ok: true,
    data: students.map((student) => ({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      universityName: student.studentProfile?.universityName ?? "",
      batch: student.studentProfile?.batch ?? "",
      deactivatedAt: student.deactivatedAt,
    })),
  };
}

export async function deleteManagedStudent(
  actorId: string,
  userId: string,
): Promise<AdminSuccess<{ id: string }> | AdminError> {
  const actor = await requireSuperAdminActor(actorId, "students");
  if (!actor.ok) {
    return actor;
  }

  if (!UUID_PATTERN.test(userId) || userId === actor.data.id) {
    return adminInvalid("That student cannot be deleted.");
  }

  const student = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      deactivatedAt: true,
      studentProfile: { select: { id: true, submissions: { select: { id: true } } } },
    },
  });

  if (!student || student.role !== "STUDENT") {
    return adminInvalid("That student cannot be deleted.");
  }

  if (!student.deactivatedAt) {
    return adminInvalid("Deactivate this student before deleting the account.");
  }

  const profileId = student.studentProfile?.id ?? null;
  const submissionIds = student.studentProfile?.submissions.map((submission) => submission.id) ?? [];

  try {
    await db.$transaction(async (tx) => {
      if (submissionIds.length > 0) {
        await tx.notification.deleteMany({ where: { prSubmissionId: { in: submissionIds } } });
        await tx.message.deleteMany({ where: { conversation: { prSubmissionId: { in: submissionIds } } } });
        await tx.conversation.deleteMany({ where: { prSubmissionId: { in: submissionIds } } });
        await tx.pRReview.deleteMany({ where: { prSubmissionId: { in: submissionIds } } });
        await tx.mentorAssignment.deleteMany({
          where: { OR: [{ prSubmissionId: { in: submissionIds } }, ...(profileId ? [{ studentId: profileId }] : [])] },
        });
        await tx.pRSubmission.deleteMany({ where: { id: { in: submissionIds } } });
      } else if (profileId) {
        await tx.mentorAssignment.deleteMany({ where: { studentId: profileId } });
      }

      await tx.message.deleteMany({ where: { senderId: student.id } });
      await tx.auditLog.deleteMany({
        where: {
          OR: [
            { actorId: student.id },
            { targetId: student.id },
            ...(profileId ? [{ targetId: profileId }] : []),
            ...(submissionIds.length > 0 ? [{ targetId: { in: submissionIds } }] : []),
          ],
        },
      });
      await tx.session.deleteMany({ where: { userId: student.id } });
      await tx.user.delete({ where: { id: student.id } });
    });
  } catch (error) {
    logError("student_delete_failed", { name: error instanceof Error ? error.name : "Error" });
    return adminInvalid("The student could not be deleted.");
  }

  return { ok: true, data: { id: student.id } };
}
