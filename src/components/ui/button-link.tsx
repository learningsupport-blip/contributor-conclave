import Link from "next/link";

import { buttonCorners, focusRing } from "@/components/ui/styles";

export function ButtonLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: string;
  variant?: "primary" | "secondary";
}) {
  const styles =
    variant === "primary"
      ? "bg-ink text-paper dark:bg-paper dark:text-ink"
      : "border border-ink/20 dark:border-paper/25";

  return (
    <Link
      href={href}
      className={`inline-flex h-10 shrink-0 items-center justify-center px-4 text-sm font-medium whitespace-nowrap ${buttonCorners} ${styles} ${focusRing}`}
    >
      {children}
    </Link>
  );
}
