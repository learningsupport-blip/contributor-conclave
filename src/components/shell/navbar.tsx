import Link from "next/link";

import { logoutAction } from "@/app/actions/auth";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { ButtonLink } from "@/components/ui/button-link";
import { buttonCorners, focusRing } from "@/components/ui/styles";
import type { PublicUser } from "@/lib/auth/types";
import type { Theme } from "@/lib/theme/theme";

export function Navbar({ user, theme }: { user: PublicUser | null; theme: Theme }) {
  return (
    <header className="sticky top-0 z-20 border-b border-ink/10 bg-paper/95 dark:border-paper/10 dark:bg-background">
      <div className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className={`flex shrink-0 items-center gap-2 font-semibold tracking-tight whitespace-nowrap ${focusRing} rounded-md`}>
          <span aria-hidden="true" className="grid grid-cols-2 gap-0.5">
            <span className="size-2 rounded-[2px] bg-moss-500" />
            <span className="size-2 rounded-[2px] bg-moss-700" />
            <span className="size-2 rounded-[2px] bg-moss-500" />
            <span className="size-2 rounded-[2px] bg-moss-900" />
          </span>
          Contributor Conclave
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle theme={theme} />
          {user ? (
            <form action={logoutAction}>
              <button
                type="submit"
                className={`inline-flex h-10 shrink-0 items-center justify-center border border-ink/20 px-4 text-sm font-medium whitespace-nowrap dark:border-paper/25 ${buttonCorners} ${focusRing}`}
              >
                Log out
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <ButtonLink href="/login" variant="secondary">
                Log in
              </ButtonLink>
              <ButtonLink href="/signup">Sign up</ButtonLink>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
