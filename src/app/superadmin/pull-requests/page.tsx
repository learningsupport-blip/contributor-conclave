import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import { focusRing } from "@/components/ui/styles";
import { requireScreen } from "@/lib/auth/authorization";

export const metadata = { title: "PR Management" };

const cards = [
  {
    href: "/superadmin/pull-requests/mentors",
    title: "Mentor PR Management",
    text: "Pull requests mentors raised in an assigned organisation, with GitHub status and a manual score.",
  },
  {
    href: "/superadmin/pull-requests/students",
    title: "Student PR Management",
    text: "Pull requests students submitted for review.",
  },
];

export default async function PullRequestManagementPage() {
  await requireScreen("prs");

  return (
    <main className="flex flex-col gap-6">
      <PageHeader
        title="PR Management"
        description="Choose whose pull requests to review."
      />
      <ul className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <li key={card.href}>
            <Link
              href={card.href}
              className={`flex h-full flex-col gap-3 border border-ink/15 px-6 py-8 dark:border-paper/15 ${focusRing}`}
            >
              <h2 className="text-xl font-semibold">{card.title}</h2>
              <p className="text-sm text-ink/75 dark:text-paper/75">{card.text}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
