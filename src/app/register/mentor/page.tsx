import Link from "next/link";

import { MentorRegisterForm } from "@/components/auth/mentor-register-form";
import { focusRing } from "@/components/ui/styles";

export default function MentorRegisterPage() {
  return (
    <main className="w-full flex-1 px-6 py-12 lg:py-16">
      <div className="mx-auto grid w-full max-w-6xl items-start gap-10 lg:grid-cols-[minmax(16rem,1fr)_minmax(0,36rem)]">
        <section className="flex max-w-md flex-col gap-5 lg:sticky lg:top-24">
          <h1 tabIndex={-1} className={`text-3xl font-semibold tracking-tight ${focusRing}`}>
            Mentor registration
          </h1>
          <p className="text-ink/75 dark:text-paper/75">
            Review student pull requests with the conversation kept next to the diff. A super admin approves the account
            before you can sign in.
          </p>
          <ul className="flex flex-col gap-3 text-sm text-ink/80 dark:text-paper/80">
            <li className="border-l-2 border-moss-500 px-3 py-1">Use your NxtWave email and employee ID.</li>
            <li className="border-l-2 border-moss-500 px-3 py-1">Add the GitHub username you review from.</li>
            <li className="border-l-2 border-moss-500 px-3 py-1">Choose a password and confirm it before creating the account.</li>
          </ul>
          <p className="text-sm">
            <Link className={`underline underline-offset-4 ${focusRing}`} href="/register/student">
              Register as a student
            </Link>{" "}
            or{" "}
            <Link className={`underline underline-offset-4 ${focusRing}`} href="/login">
              log in
            </Link>
            .
          </p>
        </section>
        <section className="w-full border border-ink/15 bg-paper p-6 dark:border-paper/15 dark:bg-ink sm:p-8">
          <h2 className="mb-6 text-lg font-semibold">Account details</h2>
          <MentorRegisterForm />
        </section>
      </div>
    </main>
  );
}
