import { CurrentLink } from "@/components/shell/current-link";
import { NavGroup } from "@/components/shell/nav-group";
import type { NavItem } from "@/components/shell/workspace-items";

export function Sidebar({ label, items }: { label: string; items: NavItem[] }) {
  return (
    <nav
      aria-label={label}
      className="sticky top-[4.25rem] z-10 h-[calc(100dvh-4.25rem)] w-72 shrink-0 self-start overflow-y-auto border-r border-ink/10 dark:border-paper/10"
    >
      <ul className="flex flex-col gap-1 px-3 py-4">
        {items.map((item) =>
          "children" in item ? (
            <NavGroup key={item.label} label={item.label} items={item.children} />
          ) : (
            <li key={item.href}>
              <CurrentLink
                href={item.href}
                section={item.section}
                className="block px-3 py-2 text-sm text-ink/80 dark:text-paper/80"
                currentClassName="block bg-moss-100 px-3 py-2 text-sm font-medium text-moss-900 underline decoration-moss-900 underline-offset-4 dark:bg-moss-900 dark:text-moss-100 dark:decoration-moss-100"
              >
                {item.label}
              </CurrentLink>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}
