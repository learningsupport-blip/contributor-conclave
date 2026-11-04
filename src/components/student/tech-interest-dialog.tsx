"use client";

import { useActionState, useEffect, useId, useRef } from "react";

import { saveStudentInterestsAction, type InterestFormState } from "@/app/actions/student-opportunities";
import { SubmitButton } from "@/components/auth/submit-button";
import { buttonCorners, focusRing } from "@/components/ui/styles";

const dialogClass =
  "fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-4rem)] w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-ink/15 bg-paper p-6 text-ink backdrop:bg-ink/60 sm:p-8 dark:border-paper/15 dark:bg-ink dark:text-paper";

export function TechInterestDialog({
  openOnLoad,
  technologies,
  selected,
}: {
  openOnLoad: boolean;
  technologies: string[];
  selected: string[];
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  const [state, action, pending] = useActionState(submit, undefined);
  const chosen = new Set(selected);

  useEffect(() => {
    if (openOnLoad) {
      dialogRef.current?.showModal();
      titleRef.current?.focus();
    }
  }, [openOnLoad]);

  async function submit(previous: InterestFormState | undefined, formData: FormData) {
    const result = await saveStudentInterestsAction(previous, formData);
    if (result.saved) {
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
        className={`inline-flex h-11 items-center justify-center border border-ink/20 px-5 text-sm font-medium dark:border-paper/25 ${buttonCorners} ${focusRing}`}
      >
        Choose tech stacks
      </button>
      <dialog ref={dialogRef} aria-labelledby={titleId} className={dialogClass}>
        <h2 id={titleId} ref={titleRef} tabIndex={-1} className={`text-xl font-semibold ${focusRing}`}>
          Tech stacks you are interested in
        </h2>
        <p className="mt-2 text-sm text-ink/70 dark:text-paper/70">
          These are the technologies used by organisations and projects. Your selection suggests organisations you can work on.
        </p>
        <form action={action} className="mt-6 flex flex-col gap-5" aria-label="Tech stacks you are interested in">
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">Tech stack</legend>
            {technologies.length === 0 ? (
              <p className="text-sm text-ink/70 dark:text-paper/70">No organisation or project has a tech stack yet.</p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {technologies.map((technology) => (
                  <li key={technology}>
                    <label className="flex min-h-11 items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="technologies"
                        value={technology}
                        defaultChecked={chosen.has(technology)}
                        className="size-4 accent-moss-700"
                      />
                      {technology}
                    </label>
                  </li>
                ))}
              </ul>
            )}
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
            <SubmitButton pending={pending} pendingLabel="Saving…">
              Show organisations
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
