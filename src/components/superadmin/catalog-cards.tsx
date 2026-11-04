"use client";

import { useActionState, useId, useRef, type ReactNode } from "react";

import {
  createBatchAction,
  createUniversityAction,
  type OrganisationFormState,
} from "@/app/actions/superadmin";
import { SubmitButton } from "@/components/auth/submit-button";
import { SelectField } from "@/components/ui/select-field";
import { TextField } from "@/components/ui/text-field";
import { buttonCorners, focusRing } from "@/components/ui/styles";

function CreateCard({
  title,
  action,
  children,
}: {
  title: string;
  action: (state: OrganisationFormState | undefined, formData: FormData) => Promise<OrganisationFormState>;
  children: (fieldId: string, state: OrganisationFormState | undefined) => ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  const fieldId = useId();
  const [state, formAction, pending] = useActionState(submit, undefined);

  async function submit(previous: OrganisationFormState | undefined, formData: FormData) {
    const result = await action(previous, formData);
    if (result.created) {
      formRef.current?.reset();
      dialogRef.current?.close();
    }
    return result;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          dialogRef.current?.showModal();
          titleRef.current?.focus();
        }}
        className={`flex min-h-44 w-full max-w-xs flex-col items-center justify-center gap-3 border border-dashed border-ink/40 bg-transparent px-6 py-8 text-center dark:border-paper/40 ${buttonCorners} ${focusRing}`}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="square" d="M12 5v14M5 12h14" />
        </svg>
        <span className="text-base font-medium">{title}</span>
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-4rem)] w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-ink/15 bg-paper p-6 text-ink backdrop:bg-ink/60 sm:p-8 dark:border-paper/15 dark:bg-ink dark:text-paper"
      >
        <h2 id={titleId} ref={titleRef} tabIndex={-1} className={`text-xl font-semibold ${focusRing}`}>
          {title}
        </h2>
        <form ref={formRef} action={formAction} className="mt-6 flex flex-col gap-5 [&_input]:min-h-11 [&_select]:min-h-11" aria-label={title}>
          {children(fieldId, state)}
          {state?.formError ? (
            <p role="alert" className="text-sm text-red-700 dark:text-red-400">
              {state.formError}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <SubmitButton pending={pending} pendingLabel="Creating…">
              {title}
            </SubmitButton>
            <button
              type="button"
              className={`inline-flex h-11 items-center justify-center border border-ink/20 px-5 text-sm font-medium dark:border-paper/25 ${buttonCorners} ${focusRing}`}
              onClick={() => dialogRef.current?.close()}
            >
              Close
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

export function CreateUniversityCard() {
  return (
    <CreateCard title="Create a University" action={createUniversityAction}>
      {(fieldId, state) => (
        <>
          <TextField id={`${fieldId}-name`} name="name" label="Name" required autoComplete="organization" errors={state?.fieldErrors?.name} />
          <TextField id={`${fieldId}-location`} name="location" label="Location" required autoComplete="address-level2" errors={state?.fieldErrors?.location} />
        </>
      )}
    </CreateCard>
  );
}

export function CreateBatchCard({
  universities,
}: {
  universities: { id: string; name: string; location: string }[];
}) {
  return (
    <CreateCard title="Create a Batch" action={createBatchAction}>
      {(fieldId, state) => (
        <>
          <SelectField
            id={`${fieldId}-university`}
            name="universityId"
            label="University"
            required
            defaultValue=""
            options={[
              { value: "", label: universities.length > 0 ? "Choose a university" : "Create a university first" },
              ...universities.map((university) => ({
                value: university.id,
                label: `${university.name}, ${university.location}`,
              })),
            ]}
            errors={state?.fieldErrors?.universityId}
          />
          <TextField id={`${fieldId}-year`} name="year" label="Year" required inputMode="numeric" autoComplete="off" errors={state?.fieldErrors?.year} />
          <TextField
            id={`${fieldId}-total`}
            name="totalStudents"
            label="Total Students"
            required
            inputMode="numeric"
            autoComplete="off"
            errors={state?.fieldErrors?.totalStudents}
          />
        </>
      )}
    </CreateCard>
  );
}
