import { ContributionGrid } from "@/components/shell/contribution-grid";
import { ButtonLink } from "@/components/ui/button-link";
import { focusRing } from "@/components/ui/styles";

export default function Home() {
  return (
    <main>
      <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
        <div className="flex flex-col gap-6">
          <h1 tabIndex={-1} className={`max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl ${focusRing}`}>
            Contributor Conclave
          </h1>
          <p className="max-w-xl text-lg text-ink/75 dark:text-paper/75">
            A place to practice GitHub contributions with a mentor beside the pull request.
            Open a change, ask for review, and learn from the comments.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/signup">Sign up</ButtonLink>
            <ButtonLink href="/login" variant="secondary">
              Log in
            </ButtonLink>
          </div>
        </div>
        <ContributionGrid />
      </section>
    </main>
  );
}
