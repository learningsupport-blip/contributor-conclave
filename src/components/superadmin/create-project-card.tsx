"use client";

import { useActionState, useId, useRef } from "react";

import { createProjectAction, type OrganisationFormState } from "@/app/actions/superadmin";
import { SubmitButton } from "@/components/auth/submit-button";
import { SelectField } from "@/components/ui/select-field";
import { TextField } from "@/components/ui/text-field";
import { buttonCorners, focusRing } from "@/components/ui/styles";
import { OPEN_SOURCE_PROGRAMS, ORGANISATION_TECHNOLOGIES } from "@/lib/superadmin/organisation-options";

const dialogClass =
  "fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-4rem)] w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-ink/15 bg-paper p-6 text-ink backdrop:bg-ink/60 sm:p-8 dark:border-paper/15 dark:bg-ink dark:text-paper";

export function CreateProjectCard({ organisations }: { organisations: { id: string; name: string }[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  const fieldId = useId();
  const [state, action, pending] = useActionState(submit, undefined);

  async function submit(previous: OrganisationFormState | undefined, formData: FormData) {
    const result = await createProjectAction(previous, formData);
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
        <span className="text-base font-medium">Create a Project</span>
      </button>
      <dialog ref={dialogRef} aria-labelledby={titleId} className={dialogClass}>
        <h2 id={titleId} ref={titleRef} tabIndex={-1} className={`text-xl font-semibold ${focusRing}`}>
          Create a Project
        </h2>
        <form
          ref={formRef}
          action={action}
          className="mt-6 flex flex-col gap-5 [&_input]:min-h-11 [&_select]:min-h-11"
          aria-label="Create a Project"
        >
          <TextField
            id={`${fieldId}-name`}
            name="name"
            label="Project Name"
            required
            errors={state?.fieldErrors?.name}
          />
          <SelectField
            id={`${fieldId}-organisation`}
            name="organisationId"
            label="Organisation"
            required
            defaultValue=""
            options={[
              { value: "", label: organisations.length > 0 ? "Choose an organisation" : "Create an organisation first" },
              ...organisations.map((organisation) => ({ value: organisation.id, label: organisation.name })),
            ]}
            errors={state?.fieldErrors?.organisationId}
          />
          <SelectField
            id={`${fieldId}-program`}
            name="program"
            label="Associated Open Source program"
            required
            defaultValue=""
            options={[{ value: "", label: "Choose a program" }, ...OPEN_SOURCE_PROGRAMS]}
            errors={state?.fieldErrors?.program}
          />
          <TextField
            id={`${fieldId}-website`}
            name="websiteUrl"
            label="Project URL"
            type="url"
            required
            errors={state?.fieldErrors?.websiteUrl}
          />
          <TextField
            id={`${fieldId}-repository`}
            name="repositoryUrl"
            label="Github/Gitlab URL of Project"
            type="url"
            required
            errors={state?.fieldErrors?.repositoryUrl}
          />
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">Technological Stack</legend>
            <p className="text-sm text-ink/70 dark:text-paper/70">Select every technology the project uses.</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {ORGANISATION_TECHNOLOGIES.map((technology) => (
                <li key={technology.value}>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="technologies" value={technology.value} className="size-4 accent-moss-700" />
                    {technology.label}
                  </label>
                </li>
              ))}
            </ul>
            {state?.fieldErrors?.technologies ? (
              <ul className="text-sm text-amber-800 dark:text-amber-100">
                {state.fieldErrors.technologies.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            ) : null}
          </fieldset>
          {state?.formError ? (
            <p role="alert" className="text-sm text-red-700 dark:text-red-400">
              {state.formError}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <SubmitButton pending={pending} pendingLabel="Creating…">
              Create a Project
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
