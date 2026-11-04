"use client";

import { useActionState } from "react";

import { changeRoleAction, setAccessAction, type SuperAdminFormState } from "@/app/actions/superadmin";
import { SubmitButton } from "@/components/auth/submit-button";
import type { AssignableRole } from "@/lib/superadmin/users";

function FormError({ state }: { state: SuperAdminFormState | undefined }) {
  if (!state?.formError) {
    return null;
  }

  return (
    <p role="alert" className="text-sm text-red-700 dark:text-red-400">
      {state.formError}
    </p>
  );
}

export function UserRoleForm({
  userId,
  personName,
  role,
  roleOptions,
}: {
  userId: string;
  personName: string;
  role: AssignableRole;
  roleOptions: { value: AssignableRole; label: string }[];
}) {
  const [roleState, roleAction, rolePending] = useActionState(changeRoleAction, undefined);
  const roleId = `role-${userId}`;

  return (
    <div className="flex min-w-56 flex-col gap-2">
      <form action={roleAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="userId" value={userId} />
        <label htmlFor={roleId} className="sr-only">
          Role for {personName}
        </label>
        <select
          id={roleId}
          name="role"
          defaultValue={role}
          className="rounded-md border border-ink/15 bg-white px-3 py-2 text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss-700 dark:border-paper/20 dark:bg-ink dark:text-paper dark:focus-visible:outline-moss-300"
        >
          {roleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <SubmitButton pending={rolePending} pendingLabel="Saving role…" accessibleName={`Save role for ${personName}`}>
          Save role
        </SubmitButton>
      </form>
      <FormError state={roleState} />
    </div>
  );
}

export function UserAccessForm({
  userId,
  personName,
  active,
}: {
  userId: string;
  personName: string;
  active: boolean;
}) {
  const [accessState, accessAction, accessPending] = useActionState(setAccessAction, undefined);
  const actionLabel = active ? "Deactivate" : "Restore";

  return (
    <div className="flex flex-col gap-2">
      <form action={accessAction}>
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="active" value={active ? "false" : "true"} />
        <SubmitButton
          pending={accessPending}
          pendingLabel="Saving access…"
          accessibleName={`${actionLabel} account for ${personName}`}
        >
          {actionLabel}
        </SubmitButton>
      </form>
      <FormError state={accessState} />
    </div>
  );
}
