"use client";

import { useActionState, useState, type FormEvent } from "react";

import { registerMentorAction } from "@/app/actions/auth";
import { Field } from "@/components/auth/field";
import { SubmitButton } from "@/components/auth/submit-button";
import { passwordMatchStatus } from "@/lib/auth/password-match";

const matchId = "mentor-password-match";

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

  return (
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
      {state?.notice ? (
        <p role="status" className="text-sm text-moss-800 sm:col-span-2 dark:text-moss-200">
          {state.notice}
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
  );
}
