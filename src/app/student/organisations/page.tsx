import { SuggestedOrganisations } from "@/components/student/suggested-organisations";
import { TechInterestDialog } from "@/components/student/tech-interest-dialog";
import { StudentSection } from "@/components/student/student-section";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { requireStudent } from "@/lib/auth/authorization";
import { getStudentOpportunities } from "@/lib/student/opportunities";

export const metadata = { title: "Organisations" };

export default async function StudentOrganisationsPage() {
  const user = await requireStudent();
  const opportunities = await getStudentOpportunities(user.id);

  return (
    <StudentSection
      crumb="Organisations"
      title="Organisations"
      description="Organisations suggested from the tech stacks you selected."
    >
      {!opportunities.ok ? (
        <ErrorState title="Suggestions unavailable" message={opportunities.message} />
      ) : (
        <>
          <TechInterestDialog
            openOnLoad={false}
            technologies={opportunities.data.technologies}
            selected={opportunities.data.interests}
          />
          {opportunities.data.interests.length === 0 ? (
            <EmptyState
              title="Choose your tech stacks"
              description="Select the technologies you are interested in to see organisations and projects."
            />
          ) : (
            <SuggestedOrganisations organisations={opportunities.data.organisations} />
          )}
        </>
      )}
    </StudentSection>
  );
}
