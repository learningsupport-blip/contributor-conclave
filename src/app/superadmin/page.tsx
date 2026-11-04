import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import { focusRing } from "@/components/ui/styles";
import { requireSuperAdmin } from "@/lib/auth/authorization";

export const metadata = { title: "Overview" };

const areas = [
  {
    href: "/superadmin/roles",
    label: "Application Managed Roles",
    text: "See which screens each role can open.",
  },
  {
    href: "/superadmin/users",
    label: "Application Managed Users",
    text: "Assign a role or change whether an account can sign in.",
  },
  {
    href: "/superadmin/logs",
    label: "Application Logs",
    text: "Review requests recorded across the application.",
  },
];

export default async function SuperAdminPage() {
  const actor = await requireSuperAdmin();

  return (
    <main className="flex flex-col gap-6">
      <PageHeader
        title={`Hello, ${actor.firstName}`}
        description="Roles, users, and application logs."
      />
      <ul className="grid gap-4 sm:grid-cols-2">
        {areas.map((area) => (
          <li key={area.href}>
            <Link
              href={area.href}
              className={`block border border-ink/10 px-4 py-4 dark:border-paper/10 ${focusRing}`}
            >
              <p className="font-medium">{area.label}</p>
              <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">{area.text}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
