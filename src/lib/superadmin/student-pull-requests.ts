import type { PRSubmissionStatus } from "@/generated/prisma/client";

import type { AdminError, AdminSuccess } from "@/lib/admin/access";
import { db } from "@/lib/db";
import { requireSuperAdminActor } from "@/lib/superadmin/access";

export type StudentPullRequestItem = {
  id: string;
  studentName: string;
  repository: string;
  githubPrUrl: string;
  techStack: string;
  status: PRSubmissionStatus;
  submittedAt: Date;
};

export async function listStudentPullRequests(
  actorId: string,
): Promise<AdminSuccess<StudentPullRequestItem[]> | AdminError> {
  const actor = await requireSuperAdminActor(actorId, "prs");
  if (!actor.ok) {
    return actor;
  }

  const submissions = await db.pRSubmission.findMany({
    orderBy: [{ submittedAt: "desc" }, { id: "asc" }],
    take: 100,
    select: {
      id: true,
      repository: true,
      githubPrUrl: true,
      status: true,
      submittedAt: true,
      techStack: { select: { name: true } },
      student: { select: { user: { select: { firstName: true, lastName: true } } } },
    },
  });

  return {
    ok: true,
    data: submissions.map((submission) => ({
      id: submission.id,
      studentName: `${submission.student.user.firstName} ${submission.student.user.lastName}`,
      repository: submission.repository,
      githubPrUrl: submission.githubPrUrl,
      techStack: submission.techStack.name,
      status: submission.status,
      submittedAt: submission.submittedAt,
    })),
  };
}
