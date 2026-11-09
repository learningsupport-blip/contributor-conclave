import Link from "next/link";

import { RaisedPullRequestTable } from "@/components/superadmin/raised-pull-request-table";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { focusRing } from "@/components/ui/styles";
import { requireScreen } from "@/lib/auth/authorization";
import { listRaisedPullRequests } from "@/lib/superadmin/raised-pull-requests";

export const metadata = { title: "Mentor PR Management" };

// Gemini reviews often outlast a normal request, including a cold Cloud Run start.
export const maxDuration = 180;

export default async function MentorPullRequestManagementPage() {
  const actor = await requireScreen("prs");
  const submissions = await listRaisedPullRequests(actor.id);

  return (
    <main className="flex flex-col gap-6">
      <p className="text-sm">
        <Link className={`underline underline-offset-4 ${focusRing}`} href="/superadmin/pull-requests">
          PR Management
        </Link>
      </p>
      <PageHeader
        title="Mentor PR Management"
        description="Every pull request a mentor has raised. Refresh the GitHub details, then score clarity, scope, evidence, and outcome. Each metric is out of 10, and the shown score is their average."
      />
      {!submissions.ok ? (
        <ErrorState title="Pull requests unavailable" message={submissions.message} />
      ) : (
        <RaisedPullRequestTable submissions={submissions.data} />
      )}
    </main>
  );
}
