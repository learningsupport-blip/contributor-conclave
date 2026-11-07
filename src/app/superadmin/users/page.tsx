import { CreateApplicationUserCard } from "@/components/superadmin/access-cards";
import { ApplicationUserTable } from "@/components/superadmin/application-user-table";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireScreen } from "@/lib/auth/authorization";
import { listApplicationRoles } from "@/lib/superadmin/application-roles";
import { roleName } from "@/lib/superadmin/roles";
import { listManagedUsers } from "@/lib/superadmin/users";

export const metadata = { title: "Users" };

export default async function SuperAdminUsersPage() {
  const actor = await requireScreen("users");
  const [result, roles] = await Promise.all([listManagedUsers(actor.id), listApplicationRoles(actor.id, "users")]);

  return (
    <main className="flex flex-col gap-6">
      <PageHeader
        title="Application Managed Users"
        description="Accounts that receive a role and the screens that role can open. Edit a user from the Action column. Deactivate the account before deleting it, and use Reactivate to turn a deactivated account back on."
      />
      <CreateApplicationUserCard roles={roles.ok ? roles.data : []} />
      {!roles.ok ? <ErrorState title="Roles unavailable" message={roles.message} /> : null}
      {!result.ok ? (
        <ErrorState title="Users unavailable" message={result.message} />
      ) : (
        <ApplicationUserTable
          roles={roles.ok ? roles.data : []}
          users={result.data.map((user) => ({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            roleLabel: user.applicationRoleName ?? roleName(user.role),
            applicationRoleId: user.applicationRoleId,
            active: user.deactivatedAt === null,
            locked: user.role === "SUPERADMIN",
          }))}
        />
      )}
    </main>
  );
}
