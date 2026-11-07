import { RaisedPullRequestTable } from "@/components/superadmin/raised-pull-request-table";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireScreen } from "@/lib/auth/authorization";
import { listRaisedPullRequests } from "@/lib/superadmin/raised-pull-requests";

export const metadata = { title: "Mentor Raised PRs" };

export default async function RaisedPullRequestsPage() {
  const actor = await requireScreen("raised-prs");
  const submissions = await listRaisedPullRequests(actor.id);

  return (
    <main className="flex flex-col gap-6">
      <PageHeader
        title="Mentor Raised PRs"
        description="Review a mentor's pull request from the GitHub details, then score clarity, scope, evidence, and outcome. Each metric is out of 10, and the shown score is their average."
      />
      {!submissions.ok ? (
        <ErrorState title="Pull requests unavailable" message={submissions.message} />
      ) : (
        <RaisedPullRequestTable submissions={submissions.data} />
      )}
    </main>
  );
}
