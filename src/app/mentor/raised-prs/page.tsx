import { RaisedPullRequestForm } from "@/components/mentor/raised-pull-request-form";
import { MentorSection } from "@/components/mentor/section";
import { ErrorState } from "@/components/ui/error-state";
import { requireMentor } from "@/lib/auth/authorization";
import { listMentorOrganisations } from "@/lib/mentor/directory";
import { listMentorRaisedPullRequests } from "@/lib/mentor/raised-pull-requests";

export const metadata = { title: "My Raised PRs" };

export default async function MentorRaisedPullRequestsPage() {
  const mentor = await requireMentor();
  const [organisations, submissions] = await Promise.all([
    listMentorOrganisations(mentor.id),
    listMentorRaisedPullRequests(mentor.id),
  ]);

  return (
    <MentorSection
      crumb="My Raised PRs"
      title="My Raised PRs"
      description="Choose an approved organisation, then submit a pull request you raised there. GitHub supplies the current status. A super admin scores it manually for now."
    >
      {!organisations.ok ? (
        <ErrorState title="Organisations unavailable" message={organisations.message} />
      ) : !submissions.ok ? (
        <ErrorState title="Pull requests unavailable" message={submissions.message} />
      ) : (
        <RaisedPullRequestForm
          organisations={organisations.data.map((organisation) => ({ id: organisation.id, name: organisation.name }))}
          submissions={submissions.data}
        />
      )}
    </MentorSection>
  );
}
