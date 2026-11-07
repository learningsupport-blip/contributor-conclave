import { StudentTable } from "@/components/superadmin/student-table";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireScreen } from "@/lib/auth/authorization";
import { listManagedStudents } from "@/lib/superadmin/students";

export const metadata = { title: "Student Management" };

export default async function StudentManagementPage() {
  const actor = await requireScreen("students");
  const students = await listManagedStudents(actor.id);

  return (
    <main className="flex flex-col gap-6">
      <PageHeader
        title="Student Management"
        description="Students who registered. Deactivate an account before deleting it. Reactivate a deactivated account to let that student sign in again."
      />
      {!students.ok ? (
        <ErrorState title="Students unavailable" message={students.message} />
      ) : (
        <StudentTable
          students={students.data.map((student) => ({
            id: student.id,
            name: `${student.firstName} ${student.lastName}`,
            email: student.email,
            university: student.universityName,
            batch: student.batch,
            active: student.deactivatedAt === null,
          }))}
        />
      )}
    </main>
  );
}
