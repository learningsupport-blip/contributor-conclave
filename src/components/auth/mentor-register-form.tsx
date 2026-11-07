"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";

import { registerMentorAction } from "@/app/actions/auth";
import { Field } from "@/components/auth/field";
import { SubmitButton } from "@/components/auth/submit-button";
import { ButtonLink } from "@/components/ui/button-link";
import { focusRing } from "@/components/ui/styles";
import { passwordMatchStatus } from "@/lib/auth/password-match";

const matchId = "mentor-password-match";

const steps = [
  { title: "Account created", text: "Your mentor account is saved." },
  { title: "Profile verification", text: "A super admin reviews the profile before it can be used." },
  { title: "Sign in", text: "After verification, log in with the email and password you chose." },
];

function CreatedAccount() {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section
      role="status"
      aria-live="polite"
      className="mx-auto flex w-full max-w-2xl flex-col gap-8 border border-moss-700/30 bg-paper px-6 py-10 dark:border-moss-300/30 dark:bg-ink sm:px-10 sm:py-14"
    >
      <div className="flex size-14 items-center justify-center border border-moss-700/40 bg-moss-100 text-moss-800 dark:border-moss-300/30 dark:bg-moss-900/70 dark:text-moss-200">
        <svg viewBox="0 0 24 24" className="size-7" aria-hidden="true">
          <path
            d="M5 12.5 9.2 17 19 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="square"
          />
        </svg>
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium tracking-wide text-moss-800 uppercase dark:text-moss-200">Registration complete</p>
        <h1 ref={headingRef} tabIndex={-1} className={`text-3xl font-semibold tracking-tight sm:text-4xl ${focusRing}`}>
          Account created
        </h1>
        <p className="max-w-xl text-lg text-ink/80 dark:text-paper/80">
          Your mentor account is created. Once your profile is verified, you can log in to the system.
        </p>
      </div>
      <ol className="grid gap-4 sm:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title} className="border border-ink/10 px-4 py-4 dark:border-paper/15">
            <p className="text-sm font-medium text-moss-800 dark:text-moss-200">{index + 1}</p>
            <p className="mt-2 font-medium">{step.title}</p>
            <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">{step.text}</p>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/login">Log in</ButtonLink>
        <Link className={`inline-flex h-10 items-center text-sm underline underline-offset-4 ${focusRing}`} href="/">
          Back to home
        </Link>
      </div>
    </section>
  );
}

export function MentorRegisterForm() {
  const [state, action, pending] = useActionState(registerMentorAction, undefined);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const errors = state?.fieldErrors;
  const match = passwordMatchStatus(password, confirmPassword);
  const showMatch = password.length > 0 || confirmPassword.length > 0;
  const confirmErrors =
    match === "match" ? errors?.confirmPassword?.filter((error) => error !== "Passwords do not match.") : errors?.confirmPassword;

  function confirmBeforeSubmit(event: FormEvent<HTMLFormElement>) {
    if (match === "mismatch") {
      event.preventDefault();
      event.currentTarget.querySelector<HTMLInputElement>("#confirmPassword")?.focus();
    }
  }

  if (state?.notice) {
    return <CreatedAccount />;
  }

  return (
    <div className="grid w-full items-start gap-10 lg:grid-cols-2">
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
        <form action={action} onSubmit={confirmBeforeSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="firstName" name="firstName" label="First name" autoComplete="given-name" errors={errors?.firstName} />
          <Field id="lastName" name="lastName" label="Last name" autoComplete="family-name" errors={errors?.lastName} />
          <Field id="email" name="email" label="NxtWave email" type="email" autoComplete="email" errors={errors?.email} />
          <Field id="employeeId" name="employeeId" label="Employee ID" autoComplete="off" errors={errors?.employeeId} />
          <div className="sm:col-span-2">
            <Field
              id="githubUsername"
              name="githubUsername"
              label="GitHub username"
              autoComplete="username"
              errors={errors?.githubUsername}
            />
          </div>
          <Field
            id="password"
            name="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
            describedBy={showMatch ? matchId : undefined}
            errors={errors?.password}
          />
          <Field
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            describedBy={showMatch ? matchId : undefined}
            invalid={match === "mismatch"}
            errors={confirmErrors}
          />
          {showMatch ? (
            <p
              id={matchId}
              role="status"
              aria-live="polite"
              className={`border-l-2 px-3 py-2 text-sm sm:col-span-2 ${
                match === "match"
                  ? "border-moss-500 text-moss-800 dark:text-moss-200"
                  : match === "mismatch"
                    ? "border-amber-500 text-amber-800 dark:text-amber-100"
                    : "border-ink/25 text-ink/70 dark:border-paper/30 dark:text-paper/70"
              }`}
            >
              {match === "match"
                ? "Passwords match."
                : match === "mismatch"
                  ? "Passwords do not match."
                  : "Retype the password to check that it matches."}
            </p>
          ) : null}
          {state?.formError ? (
            <p role="alert" className="text-sm text-red-700 sm:col-span-2 dark:text-red-400">
              {state.formError}
            </p>
          ) : null}
          <div className="sm:col-span-2">
            <SubmitButton pending={pending}>Create mentor account</SubmitButton>
          </div>
        </form>
      </section>
    </div>
  );
}
