"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

import { CurrentLink } from "@/components/shell/current-link";
import type { NavLink } from "@/components/shell/workspace-items";
import { buttonCorners, focusRing } from "@/components/ui/styles";

function containsCurrent(pathname: string, items: NavLink[]): boolean {
  return items.some((item) =>
    item.section ? pathname === item.href || pathname.startsWith(`${item.href}/`) : pathname === item.href,
  );
}

export function NavGroup({ label, items }: { label: string; items: NavLink[] }) {
  const pathname = usePathname();
  const current = containsCurrent(pathname, items);
  const [open, setOpen] = useState(current);
  const expanded = open || current;

  return (
    <li>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setOpen((value) => !value)}
        className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-ink/80 dark:text-paper/80 ${buttonCorners} ${focusRing}`}
      >
        <span className="flex items-center gap-2">
          <ShieldIcon />
          {label}
        </span>
        <Chevron open={expanded} />
      </button>
      {expanded ? (
        <ul className="mt-1 ml-4 flex flex-col gap-1 border-l border-ink/15 pl-2 dark:border-paper/20">
          {items.map((item) => (
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
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function ShieldIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3 5 6v6c0 4.2 2.8 7.2 7 8.5 4.2-1.3 7-4.3 7-8.5V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={`size-4 shrink-0 ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="m5 8 5 5 5-5" />
    </svg>
  );
}
