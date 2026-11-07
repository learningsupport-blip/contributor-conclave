import { MentorDirectory } from "@/components/superadmin/mentor-directory";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireScreen } from "@/lib/auth/authorization";
import { listMentors } from "@/lib/superadmin/mentors";
import { listOrganisations } from "@/lib/superadmin/organisations";

export const metadata = { title: "Mentor Management" };

export default async function MentorManagementPage() {
  const actor = await requireScreen("mentors");
  const [mentors, organisations] = await Promise.all([listMentors(actor.id), listOrganisations(actor.id)]);

  return (
    <main className="flex flex-col gap-6">
      <PageHeader
        title="Mentor Management"
        description="Approve a registered mentor, then assign organisations that are already approved in Resource Management. Remove an assignment to undo it."
      />
      {!mentors.ok ? (
        <ErrorState title="Mentors unavailable" message={mentors.message} />
      ) : (
        <>
          {!organisations.ok ? (
            <ErrorState title="Approved organisations unavailable" message={organisations.message} />
          ) : null}
          <MentorDirectory
            mentors={mentors.data}
            organisations={organisations.ok ? organisations.data.map((organisation) => ({ id: organisation.id, name: organisation.name })) : []}
          />
        </>
      )}
    </main>
  );
}
