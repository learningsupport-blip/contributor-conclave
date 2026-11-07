import { CreateRoleCard } from "@/components/superadmin/access-cards";
import { DataTable } from "@/components/ui/data-table";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireScreen } from "@/lib/auth/authorization";
import { listApplicationRoles } from "@/lib/superadmin/application-roles";
import { applicationRoles } from "@/lib/superadmin/roles";
import { screenLabel } from "@/lib/superadmin/screens";

export const metadata = { title: "Roles" };

export default async function SuperAdminRolesPage() {
  const actor = await requireScreen("roles");
  const created = await listApplicationRoles(actor.id, "roles");

  return (
    <main className="flex flex-col gap-6">
      <PageHeader
        title="Roles"
        description="Built-in roles stay as they are. Create a role and choose the screens it can open, then assign it under Application Managed Users."
      />
      <CreateRoleCard />
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Built-in roles</h2>
        <DataTable
          caption="Built-in roles"
          emptyTitle="No roles"
          emptyDescription="Built-in roles appear in this table."
          columns={[
            { key: "role", header: "Role" },
            { key: "screens", header: "Screens" },
          ]}
          rows={applicationRoles.map((role) => ({
            id: role.id,
            role: (
              <span className="inline-flex items-center gap-2">
                <span className="font-medium">{role.name}</span>
                <StatusBadge>Built-in</StatusBadge>
              </span>
            ),
            screens: role.screens,
          }))}
        />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Created roles</h2>
        {!created.ok ? (
          <ErrorState title="Roles unavailable" message={created.message} />
        ) : (
          <DataTable
            caption="Created roles"
            emptyTitle="No created roles"
            emptyDescription="Create a role to choose which screens an application user can open."
            columns={[
              { key: "role", header: "Role" },
              { key: "screens", header: "Screens" },
            ]}
            rows={created.data.map((role) => ({
              id: role.id,
              role: role.name,
              screens: role.screens.map(screenLabel).join(", "),
            }))}
          />
        )}
      </section>
    </main>
  );
}
