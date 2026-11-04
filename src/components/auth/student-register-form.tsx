"use client";

import { useActionState } from "react";

import { registerStudentAction } from "@/app/actions/auth";
import { Field } from "@/components/auth/field";
import { SubmitButton } from "@/components/auth/submit-button";
import { SelectField } from "@/components/ui/select-field";

export function StudentRegisterForm({
  universities,
  batches,
}: {
  universities: { id: string; name: string; location: string }[];
  batches: { id: string; year: string }[];
}) {
  const [state, action, pending] = useActionState(registerStudentAction, undefined);
  const errors = state?.fieldErrors;

  return (
    <form action={action} className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
      <Field id="firstName" name="firstName" label="First name" autoComplete="given-name" errors={errors?.firstName} />
      <Field id="lastName" name="lastName" label="Last name" autoComplete="family-name" errors={errors?.lastName} />
      <Field id="email" name="email" label="Email" type="email" autoComplete="email" errors={errors?.email} />
      <Field id="niatId" name="niatId" label="NIAT ID" autoComplete="off" errors={errors?.niatId} />
      <SelectField
        id="universityId"
        name="universityId"
        label="University"
        required
        defaultValue=""
        options={[
          { value: "", label: universities.length > 0 ? "Choose a university" : "No universities yet" },
          ...universities.map((university) => ({
            value: university.id,
            label: `${university.name}, ${university.location}`,
          })),
        ]}
        errors={errors?.universityId}
      />
      <SelectField
        id="batchId"
        name="batchId"
        label="Batch"
        required
        defaultValue=""
        options={[
          { value: "", label: batches.length > 0 ? "Choose a batch" : "No batches yet" },
          ...batches.map((batch) => ({ value: batch.id, label: batch.year })),
        ]}
        errors={errors?.batchId}
      />
      <Field id="githubUsername" name="githubUsername" label="GitHub username" autoComplete="username" errors={errors?.githubUsername} />
      <Field id="mobileNumber" name="mobileNumber" label="Mobile number" type="tel" autoComplete="tel" errors={errors?.mobileNumber} />
      <Field id="password" name="password" label="Password" type="password" autoComplete="new-password" errors={errors?.password} />
      <Field id="confirmPassword" name="confirmPassword" label="Confirm password" type="password" autoComplete="new-password" errors={errors?.confirmPassword} />
      {state?.formError ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400 sm:col-span-2">
          {state.formError}
        </p>
      ) : null}
      <div className="sm:col-span-2">
        <SubmitButton pending={pending}>Create student account</SubmitButton>
      </div>
    </form>
  );
}
