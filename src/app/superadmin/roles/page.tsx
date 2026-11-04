import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireSuperAdmin } from "@/lib/auth/authorization";
import { applicationRoles } from "@/lib/superadmin/roles";

export const metadata = { title: "Roles" };

export default async function SuperAdminRolesPage() {
  await requireSuperAdmin();

  return (
    <main className="flex flex-col gap-6">
      <PageHeader
        title="Roles"
        description="Choose which screens each role can open. Assign roles to people under Users."
      />
      <DataTable
        caption="Roles"
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
    </main>
  );
}
