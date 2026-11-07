import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import { focusRing } from "@/components/ui/styles";
import { requireScreen } from "@/lib/auth/authorization";

export const metadata = { title: "Services" };

export default async function ServicesPage() {
  await requireScreen("services");

  return (
    <main className="flex flex-col gap-6">
      <PageHeader
        title="Services"
        description="Choose a service to configure. Addresses and tokens stay in the server environment."
      />
      <ul className="grid gap-4 md:grid-cols-2">
        <li>
          <Link
            href="/superadmin/services/pr-analysis"
            className={`flex h-full flex-col gap-3 border border-ink/15 px-6 py-8 dark:border-paper/15 ${focusRing}`}
          >
            <h2 className="text-xl font-semibold">PR Analysis</h2>
            <p className="text-sm text-ink/75 dark:text-paper/75">
              Turn the pull-request review service on and choose which aspects it scores.
            </p>
          </Link>
        </li>
      </ul>
    </main>
  );
}
