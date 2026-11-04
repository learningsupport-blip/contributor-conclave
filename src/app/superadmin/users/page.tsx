import { UserAccessForm, UserRoleForm } from "@/components/superadmin/user-controls";
import { DataTable } from "@/components/ui/data-table";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { accountLabel } from "@/lib/admin/labels";
import { requireSuperAdmin } from "@/lib/auth/authorization";
import { roleName } from "@/lib/superadmin/roles";
import { isAssignableRole, listManagedUsers, type AssignableRole } from "@/lib/superadmin/users";

export const metadata = { title: "Users" };

export default async function SuperAdminUsersPage() {
  const actor = await requireSuperAdmin();
  const result = await listManagedUsers(actor.id);

  return (
    <main className="flex flex-col gap-6">
      <PageHeader
        title="Users"
        description="Every person who can sign in. Each row is one account. Assign a role here."
      />
      {!result.ok ? (
        <ErrorState title="Users unavailable" message={result.message} />
      ) : (
        <DataTable
          caption="Users"
          emptyTitle="No users"
          emptyDescription="Accounts appear here after someone registers or a super admin is seeded."
          columns={[
            { key: "name", header: "Name" },
            { key: "email", header: "Email" },
            { key: "role", header: "Role" },
            { key: "status", header: "Status" },
            { key: "access", header: "Access" },
          ]}
          rows={result.data.map((user) => {
            const person = `${user.firstName} ${user.lastName}`;
            const status = accountLabel(user.deactivatedAt);
            const assignable = isAssignableRole(user.role);
            const options = (
              [
                user.hasStudentProfile ? { value: "STUDENT", label: "Student" } : null,
                user.hasMentorProfile ? { value: "MENTOR", label: "Mentor" } : null,
                { value: "ADMIN", label: "Admin" },
              ] as const
            ).filter((option): option is { value: AssignableRole; label: string } => option !== null);

            return {
              id: user.id,
              name: person,
              email: user.email,
              role: isAssignableRole(user.role) ? (
                <UserRoleForm userId={user.id} personName={person} role={user.role} roleOptions={options} />
              ) : (
                roleName(user.role)
              ),
              status: <StatusBadge tone={status.tone}>{status.label}</StatusBadge>,
              access: assignable ? (
                <UserAccessForm userId={user.id} personName={person} active={user.deactivatedAt === null} />
              ) : (
                "This account"
              ),
            };
          })}
        />
      )}
    </main>
  );
}
