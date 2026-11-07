"use client";

import { useActionState, useId, useRef, type ReactNode } from "react";

import {
  createApplicationRoleAction,
  createApplicationUserAction,
  type OrganisationFormState,
} from "@/app/actions/superadmin";
import { SubmitButton } from "@/components/auth/submit-button";
import { SelectField } from "@/components/ui/select-field";
import { TextField } from "@/components/ui/text-field";
import { buttonCorners, focusRing } from "@/components/ui/styles";
import { APPLICATION_SCREENS } from "@/lib/superadmin/screens";

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

export function CreateRoleCard() {
  return (
    <CreateCard title="Create a Role" action={createApplicationRoleAction}>
      {(fieldId, state) => (
        <>
          <TextField id={`${fieldId}-name`} name="name" label="Role name" required autoComplete="off" errors={state?.fieldErrors?.name} />
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">Screen access</legend>
            <p id={`${fieldId}-screens-hint`} className="text-sm text-ink/70 dark:text-paper/70">
              Choose the screens this role can open.
            </p>
            <ul className="flex flex-col gap-2" aria-describedby={`${fieldId}-screens-hint`}>
              {APPLICATION_SCREENS.map((screen) => (
                <li key={screen.id}>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="screens" value={screen.id} className={`size-4 ${focusRing}`} />
                    {screen.label}
                  </label>
                </li>
              ))}
            </ul>
            {state?.fieldErrors?.screens ? (
              <p role="alert" className="text-sm text-amber-800 dark:text-amber-100">
                {state.fieldErrors.screens[0]}
              </p>
            ) : null}
          </fieldset>
        </>
      )}
    </CreateCard>
  );
}

export function CreateApplicationUserCard({ roles }: { roles: { id: string; name: string }[] }) {
  return (
    <CreateCard title="Create an Application User" action={createApplicationUserAction}>
      {(fieldId, state) => (
        <>
          <TextField id={`${fieldId}-first`} name="firstName" label="First name" required autoComplete="given-name" errors={state?.fieldErrors?.firstName} />
          <TextField id={`${fieldId}-last`} name="lastName" label="Last name" required autoComplete="family-name" errors={state?.fieldErrors?.lastName} />
          <TextField id={`${fieldId}-email`} name="email" label="Email" type="email" required autoComplete="off" errors={state?.fieldErrors?.email} />
          <TextField
            id={`${fieldId}-password`}
            name="password"
            label="Password"
            type="password"
            required
            autoComplete="new-password"
            errors={state?.fieldErrors?.password}
          />
          <SelectField
            id={`${fieldId}-role`}
            name="roleId"
            label="Role"
            required
            defaultValue=""
            options={[
              { value: "", label: roles.length > 0 ? "Choose a role" : "Create a role first" },
              ...roles.map((role) => ({ value: role.id, label: role.name })),
            ]}
            errors={state?.fieldErrors?.roleId}
          />
        </>
      )}
    </CreateCard>
  );
}
