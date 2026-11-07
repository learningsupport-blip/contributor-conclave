"use client";

import { useActionState, useId, useRef, useState } from "react";

import {
  deleteApplicationUserAction,
  setAccessAction,
  updateApplicationUserAction,
  type OrganisationFormState,
} from "@/app/actions/superadmin";
import { UserAccessForm } from "@/components/superadmin/user-controls";
import { SubmitButton } from "@/components/auth/submit-button";
import { DataTable } from "@/components/ui/data-table";
import { SelectField } from "@/components/ui/select-field";
import { StatusBadge } from "@/components/ui/status-badge";
import { TextField } from "@/components/ui/text-field";
import { buttonCorners, focusRing } from "@/components/ui/styles";
import { accountLabel } from "@/lib/admin/labels";

export type ApplicationUserRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roleLabel: string;
  applicationRoleId: string | null;
  active: boolean;
  locked: boolean;
};

const quietButton = `inline-flex h-9 items-center justify-center border border-ink/20 px-3 text-sm font-medium dark:border-paper/25 ${buttonCorners} ${focusRing}`;

function ReactivateUser({ userId, personName }: { userId: string; personName: string }) {
  const [state, action, pending] = useActionState(setAccessAction, undefined);

  return (
    <form action={action}>
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="active" value="true" />
      <button type="submit" className={quietButton} disabled={pending} aria-label={`Reactivate ${personName}`}>
        {pending ? "Reactivating…" : "Reactivate"}
      </button>
      {state?.formError ? (
        <p role="alert" className="mt-1 text-sm text-red-700 dark:text-red-400">
          {state.formError}
        </p>
      ) : null}
    </form>
  );
}
const dialogClass =
  "fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-4rem)] w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-ink/15 bg-paper p-6 text-ink backdrop:bg-ink/60 sm:p-8 dark:border-paper/15 dark:bg-ink dark:text-paper";

export function ApplicationUserTable({
  users,
  roles,
}: {
  users: ApplicationUserRow[];
  roles: { id: string; name: string }[];
}) {
  const editRef = useRef<HTMLDialogElement>(null);
  const deleteRef = useRef<HTMLDialogElement>(null);
  const editTitleId = useId();
  const deleteTitleId = useId();
  const fieldId = useId();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editState, editAction, editPending] = useActionState(saveEdit, undefined);
  const [deleteState, deleteAction, deletePending] = useActionState(saveDelete, undefined);
  const selected = users.find((user) => user.id === selectedId) ?? null;

  async function saveEdit(previous: OrganisationFormState | undefined, formData: FormData) {
    const result = await updateApplicationUserAction(previous, formData);
    if (result.saved) {
      editRef.current?.close();
    }
    return result;
  }

  async function saveDelete(previous: OrganisationFormState | undefined, formData: FormData) {
    const result = await deleteApplicationUserAction(previous, formData);
    if (result.saved) {
      deleteRef.current?.close();
    }
    return result;
  }

  return (
    <>
      <DataTable
        caption="Application managed users"
        emptyTitle="No application users"
        emptyDescription="Create an application user and assign a role."
        columns={[
          { key: "name", header: "Name" },
          { key: "email", header: "Email" },
          { key: "role", header: "Role" },
          { key: "status", header: "Status" },
          { key: "action", header: "Action" },
        ]}
        rows={users.map((user) => {
          const person = `${user.firstName} ${user.lastName}`;
          const status = accountLabel(user.active ? null : new Date());
          return {
            id: user.id,
            name: person,
            email: user.email,
            role: user.roleLabel,
            status: <StatusBadge tone={status.tone}>{status.label}</StatusBadge>,
            action: user.locked ? (
              "This account"
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={quietButton}
                  onClick={() => {
                    setSelectedId(user.id);
                    editRef.current?.showModal();
                  }}
                >
                  Edit
                </button>
                {user.active ? null : <ReactivateUser userId={user.id} personName={person} />}
                <button
                  type="button"
                  className={quietButton}
                  onClick={() => {
                    setSelectedId(user.id);
                    deleteRef.current?.showModal();
                  }}
                >
                  Delete
                </button>
              </div>
            ),
          };
        })}
      />
      <dialog ref={editRef} aria-labelledby={editTitleId} className={dialogClass}>
        <h2 id={editTitleId} className="text-xl font-semibold">
          Edit application user
        </h2>
        {selected ? (
          <form
            key={selected.id}
            action={editAction}
            className="mt-6 flex flex-col gap-5 [&_input]:min-h-11 [&_select]:min-h-11"
            aria-label="Edit application user"
          >
            <input type="hidden" name="userId" value={selected.id} />
            <TextField id={`${fieldId}-first`} name="firstName" label="First name" required autoComplete="given-name" defaultValue={selected.firstName} errors={editState?.fieldErrors?.firstName} />
            <TextField id={`${fieldId}-last`} name="lastName" label="Last name" required autoComplete="family-name" defaultValue={selected.lastName} errors={editState?.fieldErrors?.lastName} />
            <TextField id={`${fieldId}-email`} name="email" label="Email" type="email" required autoComplete="off" defaultValue={selected.email} errors={editState?.fieldErrors?.email} />
            <TextField
              id={`${fieldId}-password`}
              name="password"
              label="Password"
              type="password"
              autoComplete="new-password"
              errors={editState?.fieldErrors?.password}
            />
            <p className="text-sm text-ink/70 dark:text-paper/70">Leave the password blank to keep the current one.</p>
            <SelectField
              id={`${fieldId}-role`}
              name="roleId"
              label="Role"
              defaultValue={selected.applicationRoleId ?? ""}
              options={[
                { value: "", label: selected.applicationRoleId ? "Keep the current role" : "Admin" },
                ...roles.map((role) => ({ value: role.id, label: role.name })),
              ]}
              errors={editState?.fieldErrors?.roleId}
            />
            {editState?.formError ? (
              <p role="alert" className="text-sm text-red-700 dark:text-red-400">
                {editState.formError}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <SubmitButton pending={editPending} pendingLabel="Saving…">
                Save user
              </SubmitButton>
              <button type="button" className={quietButton} onClick={() => editRef.current?.close()}>
                Close
              </button>
            </div>
          </form>
        ) : null}
      </dialog>
      <dialog ref={deleteRef} aria-labelledby={deleteTitleId} className={dialogClass}>
        <h2 id={deleteTitleId} className="text-xl font-semibold">
          Delete application user
        </h2>
        {selected ? (
          selected.active ? (
            <div className="mt-4 flex flex-col gap-4">
              <p>Deactivate {selected.firstName} {selected.lastName} before deleting this account.</p>
              <div className="flex flex-wrap items-start gap-3">
                <UserAccessForm userId={selected.id} personName={`${selected.firstName} ${selected.lastName}`} active />
                <button type="button" className={quietButton} onClick={() => deleteRef.current?.close()}>
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form action={deleteAction} className="mt-4 flex flex-col gap-4">
              <input type="hidden" name="userId" value={selected.id} />
              <p>Delete {selected.firstName} {selected.lastName}? This cannot be undone.</p>
              {deleteState?.formError ? (
                <p role="alert" className="text-sm text-red-700 dark:text-red-400">
                  {deleteState.formError}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-3">
                <SubmitButton pending={deletePending} pendingLabel="Deleting…">
                  Delete user
                </SubmitButton>
                <button type="button" className={quietButton} onClick={() => deleteRef.current?.close()}>
                  Cancel
                </button>
              </div>
            </form>
          )
        ) : null}
      </dialog>
    </>
  );
}
