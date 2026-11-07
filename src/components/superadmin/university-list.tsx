"use client";

import { useActionState, useId, useRef, useState } from "react";

import { deleteUniversityAction, updateUniversityAction, type OrganisationFormState } from "@/app/actions/superadmin";
import { SubmitButton } from "@/components/auth/submit-button";
import { TextField } from "@/components/ui/text-field";
import { buttonCorners, focusRing } from "@/components/ui/styles";

type UniversityRecord = { id: string; name: string; location: string };

const quietButton = `inline-flex h-10 items-center justify-center border border-ink/20 px-4 text-sm font-medium dark:border-paper/25 ${buttonCorners} ${focusRing}`;
const cardButton = `inline-flex h-9 items-center justify-center border border-ink/20 px-3 text-sm font-medium dark:border-paper/25 ${buttonCorners} ${focusRing}`;

function UniversityMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.35">
      <path strokeLinecap="square" strokeLinejoin="miter" d="M2.75 10.25 12 3.75 21.25 10.25" />
      <path strokeLinecap="square" d="M3.75 10.25h16.5" />
      <path strokeLinecap="square" d="M5.25 10.25v8.25M8.4 10.25v8.25M15.6 10.25v8.25M18.75 10.25v8.25" />
      <path strokeLinecap="square" d="M3.75 18.5h16.5M2.5 21h19" />
      <path strokeLinecap="square" d="M10.15 18.5V14.15h3.7v4.35" />
      <path strokeLinecap="square" d="M12 3.75V2.15" />
      <rect x="11.2" y="1.15" width="1.6" height="1.15" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function UniversityList({ universities }: { universities: UniversityRecord[] }) {
  const editRef = useRef<HTMLDialogElement>(null);
  const deleteRef = useRef<HTMLDialogElement>(null);
  const editTitleId = useId();
  const deleteTitleId = useId();
  const fieldId = useId();
  const [selected, setSelected] = useState<UniversityRecord | null>(null);
  const [editState, editAction, editPending] = useActionState(saveEdit, undefined);
  const [deleteState, deleteAction, deletePending] = useActionState(saveDelete, undefined);

  async function saveEdit(previous: OrganisationFormState | undefined, formData: FormData) {
    const result = await updateUniversityAction(previous, formData);
    if (result.saved) {
      editRef.current?.close();
    }
    return result;
  }

  async function saveDelete(previous: OrganisationFormState | undefined, formData: FormData) {
    const result = await deleteUniversityAction(previous, formData);
    if (result.saved) {
      deleteRef.current?.close();
    }
    return result;
  }

  if (universities.length === 0) {
    return <p className="text-sm text-ink/70 dark:text-paper/70">No universities yet.</p>;
  }

  return (
    <>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {universities.map((university) => (
          <li key={university.id} className="flex min-w-0 items-center gap-3 border border-ink/10 p-3 dark:border-paper/10">
            <span className="flex size-12 shrink-0 items-center justify-center border border-moss-700/40 bg-moss-100 text-moss-700 dark:border-moss-300/30 dark:bg-moss-900/70 dark:text-moss-300">
              <UniversityMark />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{university.name}</p>
              <p className="mt-1 truncate text-sm text-ink/70 dark:text-paper/70">{university.location}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={cardButton}
                  onClick={() => {
                    setSelected(university);
                    editRef.current?.showModal();
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className={cardButton}
                  onClick={() => {
                    setSelected(university);
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
      <dialog
        ref={editRef}
        aria-labelledby={editTitleId}
        className="fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-4rem)] w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-ink/15 bg-paper p-6 text-ink backdrop:bg-ink/60 sm:p-8 dark:border-paper/15 dark:bg-ink dark:text-paper"
      >
        <h2 id={editTitleId} className="text-xl font-semibold">
          Edit university
        </h2>
        {selected ? (
          <form key={selected.id} action={editAction} className="mt-6 flex flex-col gap-5 [&_input]:min-h-11" aria-label="Edit university">
            <input type="hidden" name="universityId" value={selected.id} />
            <TextField
              id={`${fieldId}-name`}
              name="name"
              label="Name"
              required
              autoComplete="organization"
              defaultValue={selected.name}
              errors={editState?.fieldErrors?.name}
            />
            <TextField
              id={`${fieldId}-location`}
              name="location"
              label="Location"
              required
              autoComplete="address-level2"
              defaultValue={selected.location}
              errors={editState?.fieldErrors?.location}
            />
            {editState?.formError ? (
              <p role="alert" className="text-sm text-red-700 dark:text-red-400">
                {editState.formError}
              </p>
            ) : null}
            {editState?.saved ? (
              <p role="status" className="text-sm text-moss-800 dark:text-moss-200">
                University updated.
              </p>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <SubmitButton pending={editPending} pendingLabel="Saving…">
                Save university
              </SubmitButton>
              <button type="button" className={quietButton} onClick={() => editRef.current?.close()}>
                Close
              </button>
            </div>
          </form>
        ) : null}
      </dialog>
      <dialog
        ref={deleteRef}
        aria-labelledby={deleteTitleId}
        className="fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-4rem)] w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-ink/15 bg-paper p-6 text-ink backdrop:bg-ink/60 sm:p-8 dark:border-paper/15 dark:bg-ink dark:text-paper"
      >
        <h2 id={deleteTitleId} className="text-xl font-semibold">
          Delete university
        </h2>
        {selected ? (
          <form action={deleteAction} className="mt-4 flex flex-col gap-4">
            <input type="hidden" name="universityId" value={selected.id} />
            <p>
              Delete {selected.name}? This cannot be undone. A university with batches or registered students stays in place.
            </p>
            {deleteState?.formError ? (
              <p role="alert" className="text-sm text-red-700 dark:text-red-400">
                {deleteState.formError}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <SubmitButton pending={deletePending} pendingLabel="Deleting…">
                Delete university
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
