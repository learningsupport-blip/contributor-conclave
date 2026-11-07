import Link from "next/link";

import { DataTable } from "@/components/ui/data-table";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { focusRing } from "@/components/ui/styles";
import { requireScreen } from "@/lib/auth/authorization";
import { submissionLabel } from "@/lib/student/labels";
import { listStudentPullRequests } from "@/lib/superadmin/student-pull-requests";

export const metadata = { title: "Student PR Management" };

const submittedFormat = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeZone: "Asia/Kolkata",
});

export default async function StudentPullRequestManagementPage() {
  const actor = await requireScreen("prs");
  const submissions = await listStudentPullRequests(actor.id);

  return (
    <main className="flex flex-col gap-6">
      <p className="text-sm">
        <Link className={`underline underline-offset-4 ${focusRing}`} href="/superadmin/pull-requests">
          PR Management
        </Link>
      </p>
      <PageHeader
        title="Student PR Management"
        description="Pull requests students submitted for review."
      />
      {!submissions.ok ? (
        <ErrorState title="Pull requests unavailable" message={submissions.message} />
      ) : (
        <DataTable
          caption="Student pull requests"
          emptyTitle="No pull requests"
          emptyDescription="Student submissions appear here after they submit a pull request."
          columns={[
            { key: "student", header: "Student" },
            { key: "repository", header: "Repository" },
            { key: "stack", header: "Tech stack" },
            { key: "status", header: "Status" },
            { key: "submitted", header: "Submitted" },
          ]}
          rows={submissions.data.map((submission) => {
            const status = submissionLabel(submission.status);
            return {
              id: submission.id,
              student: submission.studentName,
              repository: (
                <a
                  href={submission.githubPrUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`underline underline-offset-4 ${focusRing}`}
                >
                  {submission.repository}
                </a>
              ),
              stack: submission.techStack,
              status: <StatusBadge tone={status.tone}>{status.label}</StatusBadge>,
              submitted: submittedFormat.format(submission.submittedAt),
            };
          })}
        />
      )}
    </main>
  );
}
