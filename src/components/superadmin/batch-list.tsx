"use client";

import { useActionState, useId, useRef, useState } from "react";

import { deleteBatchAction, updateBatchAction, type OrganisationFormState } from "@/app/actions/superadmin";
import { SubmitButton } from "@/components/auth/submit-button";
import { SelectField } from "@/components/ui/select-field";
import { TextField } from "@/components/ui/text-field";
import { buttonCorners, focusRing } from "@/components/ui/styles";

type BatchRecord = {
  id: string;
  year: string;
  totalStudents: number;
  universityId: string | null;
  universityName: string | null;
};

type UniversityOption = { id: string; name: string; location: string };

const quietButton = `inline-flex h-10 items-center justify-center border border-ink/20 px-4 text-sm font-medium dark:border-paper/25 ${buttonCorners} ${focusRing}`;
const cardButton = `inline-flex h-9 items-center justify-center border border-ink/20 px-3 text-sm font-medium dark:border-paper/25 ${buttonCorners} ${focusRing}`;
const dialogClass =
  "fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-4rem)] w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-ink/15 bg-paper p-6 text-ink backdrop:bg-ink/60 sm:p-8 dark:border-paper/15 dark:bg-ink dark:text-paper";

function BatchMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.35">
      <path strokeLinecap="square" d="M4.5 5.25h15v15.25h-15z" />
      <path strokeLinecap="square" d="M4.5 9.25h15" />
      <path strokeLinecap="square" d="M8 3.25v3.25M16 3.25v3.25" />
      <path strokeLinecap="square" d="M8 12.75h2.75M13.25 12.75H16M8 16h2.75" />
    </svg>
  );
}

export function BatchList({
  batches,
  universities,
}: {
  batches: BatchRecord[];
  universities: UniversityOption[];
}) {
  const editRef = useRef<HTMLDialogElement>(null);
  const deleteRef = useRef<HTMLDialogElement>(null);
  const editTitleId = useId();
  const deleteTitleId = useId();
  const fieldId = useId();
  const [selected, setSelected] = useState<BatchRecord | null>(null);
  const [editState, editAction, editPending] = useActionState(saveEdit, undefined);
  const [deleteState, deleteAction, deletePending] = useActionState(saveDelete, undefined);

  async function saveEdit(previous: OrganisationFormState | undefined, formData: FormData) {
    const result = await updateBatchAction(previous, formData);
    if (result.saved) {
      editRef.current?.close();
    }
    return result;
  }

  async function saveDelete(previous: OrganisationFormState | undefined, formData: FormData) {
    const result = await deleteBatchAction(previous, formData);
    if (result.saved) {
      deleteRef.current?.close();
    }
    return result;
  }

  if (batches.length === 0) {
    return <p className="text-sm text-ink/70 dark:text-paper/70">No batches yet.</p>;
  }

  const universityOptions = [
    { value: "", label: universities.length > 0 ? "Choose a university" : "Create a university first" },
    ...universities.map((university) => ({
      value: university.id,
      label: `${university.name}, ${university.location}`,
    })),
  ];

  return (
    <>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {batches.map((batch) => (
          <li key={batch.id} className="flex min-w-0 items-center gap-3 border border-ink/10 p-3 dark:border-paper/10">
            <span className="flex size-12 shrink-0 items-center justify-center border border-moss-700/40 bg-moss-100 text-moss-700 dark:border-moss-300/30 dark:bg-moss-900/70 dark:text-moss-300">
              <BatchMark />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{batch.year}</p>
              <p className="mt-1 truncate text-sm text-ink/70 dark:text-paper/70">{batch.universityName ?? "No university"}</p>
              <p className="text-sm text-ink/70 dark:text-paper/70">{batch.totalStudents} students</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={cardButton}
                  onClick={() => {
                    setSelected(batch);
                    editRef.current?.showModal();
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className={cardButton}
                  onClick={() => {
                    setSelected(batch);
                    deleteRef.current?.showModal();
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <dialog ref={editRef} aria-labelledby={editTitleId} className={dialogClass}>
        <h2 id={editTitleId} className="text-xl font-semibold">
          Edit batch
        </h2>
        {selected ? (
          <form key={selected.id} action={editAction} className="mt-6 flex flex-col gap-5 [&_input]:min-h-11 [&_select]:min-h-11" aria-label="Edit batch">
            <input type="hidden" name="batchId" value={selected.id} />
            <SelectField
              id={`${fieldId}-university`}
              name="universityId"
              label="University"
              required
              defaultValue={selected.universityId ?? ""}
              options={universityOptions}
              errors={editState?.fieldErrors?.universityId}
            />
            <TextField
              id={`${fieldId}-year`}
              name="year"
              label="Year"
              required
              inputMode="numeric"
              autoComplete="off"
              defaultValue={selected.year}
              errors={editState?.fieldErrors?.year}
            />
            <TextField
              id={`${fieldId}-total`}
              name="totalStudents"
              label="Total Students"
              required
              inputMode="numeric"
              autoComplete="off"
              defaultValue={String(selected.totalStudents)}
              errors={editState?.fieldErrors?.totalStudents}
            />
            {editState?.formError ? (
              <p role="alert" className="text-sm text-red-700 dark:text-red-400">
                {editState.formError}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <SubmitButton pending={editPending} pendingLabel="Saving…">
                Save batch
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
          Delete batch
        </h2>
        {selected ? (
          <form action={deleteAction} className="mt-4 flex flex-col gap-4">
            <input type="hidden" name="batchId" value={selected.id} />
            <p>
              Delete the {selected.year} batch{selected.universityName ? ` at ${selected.universityName}` : ""}? This cannot be undone. A batch with registered students stays in place.
            </p>
            {deleteState?.formError ? (
              <p role="alert" className="text-sm text-red-700 dark:text-red-400">
                {deleteState.formError}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <SubmitButton pending={deletePending} pendingLabel="Deleting…">
                Delete batch
              </SubmitButton>
              <button type="button" className={quietButton} onClick={() => deleteRef.current?.close()}>
                Cancel
              </button>
            </div>
          </form>
        ) : null}
      </dialog>
    </>
  );
}
