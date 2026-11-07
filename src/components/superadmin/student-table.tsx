"use client";

import { useActionState, useId, useRef, useState } from "react";

import {
  deleteStudentAction,
  setStudentAccessAction,
  type OrganisationFormState,
} from "@/app/actions/superadmin";
import { UserAccessForm } from "@/components/superadmin/user-controls";
import { SubmitButton } from "@/components/auth/submit-button";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { buttonCorners, focusRing } from "@/components/ui/styles";
import { accountLabel } from "@/lib/admin/labels";

export type StudentRow = {
  id: string;
  name: string;
  email: string;
  university: string;
  batch: string;
  active: boolean;
};

const quietButton = `inline-flex h-9 items-center justify-center border border-ink/20 px-3 text-sm font-medium dark:border-paper/25 ${buttonCorners} ${focusRing}`;
const dialogClass =
  "fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-4rem)] w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-ink/15 bg-paper p-6 text-ink backdrop:bg-ink/60 sm:p-8 dark:border-paper/15 dark:bg-ink dark:text-paper";

function ReactivateStudent({ userId, personName }: { userId: string; personName: string }) {
  const [state, action, pending] = useActionState(setStudentAccessAction, undefined);

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

export function StudentTable({ students }: { students: StudentRow[] }) {
  const deleteRef = useRef<HTMLDialogElement>(null);
  const deleteTitleId = useId();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteState, deleteAction, deletePending] = useActionState(saveDelete, undefined);
  const selected = students.find((student) => student.id === selectedId) ?? null;

  async function saveDelete(previous: OrganisationFormState | undefined, formData: FormData) {
    const result = await deleteStudentAction(previous, formData);
    if (result.saved) {
      deleteRef.current?.close();
    }
    return result;
  }

  return (
    <>
      <DataTable
        caption="Students"
        emptyTitle="No students"
        emptyDescription="Student accounts appear here after registration."
        columns={[
          { key: "name", header: "Name" },
          { key: "email", header: "Email" },
          { key: "university", header: "University" },
          { key: "batch", header: "Batch" },
          { key: "status", header: "Status" },
          { key: "action", header: "Action" },
        ]}
        rows={students.map((student) => {
          const status = accountLabel(student.active ? null : new Date());
          return {
            id: student.id,
            name: student.name,
            email: student.email,
            university: student.university,
            batch: student.batch,
            status: <StatusBadge tone={status.tone}>{status.label}</StatusBadge>,
            action: (
              <div className="flex flex-wrap gap-2">
                {student.active ? null : <ReactivateStudent userId={student.id} personName={student.name} />}
                <button
                  type="button"
                  className={quietButton}
                  onClick={() => {
                    setSelectedId(student.id);
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
      <dialog ref={deleteRef} aria-labelledby={deleteTitleId} className={dialogClass}>
        <h2 id={deleteTitleId} className="text-xl font-semibold">
          Delete student
        </h2>
        {selected ? (
          selected.active ? (
            <div className="mt-4 flex flex-col gap-4">
              <p>Deactivate {selected.name} before deleting this account.</p>
              <div className="flex flex-wrap items-start gap-3">
                <UserAccessForm userId={selected.id} personName={selected.name} active action={setStudentAccessAction} />
                <button type="button" className={quietButton} onClick={() => deleteRef.current?.close()}>
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form action={deleteAction} className="mt-4 flex flex-col gap-4">
              <input type="hidden" name="userId" value={selected.id} />
              <p>
                Delete {selected.name}? This removes the student and their records from the application. This cannot be undone.
              </p>
              {deleteState?.formError ? (
                <p role="alert" className="text-sm text-red-700 dark:text-red-400">
                  {deleteState.formError}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-3">
                <SubmitButton pending={deletePending} pendingLabel="Deleting…">
                  Delete student
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
