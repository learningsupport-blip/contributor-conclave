"use client";

import { useActionState, useRef, useState } from "react";

import {
  approveMentorAction,
  assignMentorOrganisationAction,
  deleteMentorAction,
  setMentorActiveAction,
  unassignMentorOrganisationAction,
} from "@/app/actions/superadmin";
import { buttonCorners, controlClass, focusRing } from "@/components/ui/styles";
import type { ManagedMentor } from "@/lib/superadmin/mentor-model";

const solidButton = `inline-flex h-10 items-center justify-center bg-zinc-950 px-4 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 ${buttonCorners} ${focusRing}`;
const quietButton = `inline-flex h-10 items-center justify-center border border-ink/20 px-4 text-sm font-medium disabled:opacity-60 dark:border-paper/20 ${buttonCorners} ${focusRing}`;

const approvalLabel = {
  PENDING: "Pending approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
} as const;

const registeredOn = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeZone: "Asia/Kolkata",
});

function MentorAction({
  action,
  userId,
  label,
  name,
  value,
  quiet = false,
  disabled = false,
  title,
  confirmMessage,
}: {
  action: (state: { formError?: string } | undefined, formData: FormData) => Promise<{ formError?: string }>;
  userId: string;
  label: string;
  name?: string;
  value?: string;
  quiet?: boolean;
  disabled?: boolean;
  title?: string;
  confirmMessage?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      {name && value ? <input type="hidden" name={name} value={value} /> : null}
      <button type="submit" disabled={disabled || pending} title={title} className={quiet ? quietButton : solidButton}>
        {pending ? "Please wait…" : label}
      </button>
      {state?.formError ? (
        <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-400">
          {state.formError}
        </p>
      ) : null}
    </form>
  );
}

function AssignOrganisation({
  userId,
  organisations,
  hasApprovedOrganisations,
}: {
  userId: string;
  organisations: { id: string; name: string }[];
  hasApprovedOrganisations: boolean;
}) {
  const [state, formAction, pending] = useActionState(assignMentorOrganisationAction, undefined);

  if (!hasApprovedOrganisations) {
    return (
      <p className="text-sm text-ink/70 dark:text-paper/70">
        Approve an organisation in Resource Management before assigning one.
      </p>
    );
  }

  if (organisations.length === 0) {
    return <p className="text-sm text-ink/70 dark:text-paper/70">Every approved organisation is already assigned.</p>;
  }

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="userId" value={userId} />
      <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm">
        Approved organisation
        <select name="organisationId" className={controlClass} defaultValue={organisations[0]?.id}>
          {organisations.map((organisation) => (
            <option key={organisation.id} value={organisation.id}>
              {organisation.name}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" disabled={pending} className={solidButton}>
        {pending ? "Please wait…" : "Assign"}
      </button>
      {state?.formError ? (
        <p role="alert" className="w-full text-sm text-red-700 dark:text-red-400">
          {state.formError}
        </p>
      ) : null}
    </form>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-ink/55 dark:text-paper/55">{label}</dt>
      <dd className="mt-1">{value}</dd>
    </div>
  );
}

export function MentorDirectory({
  mentors,
  organisations,
}: {
  mentors: ManagedMentor[];
  organisations: { id: string; name: string }[];
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<ManagedMentor | null>(null);

  function openDetails(mentor: ManagedMentor) {
    setSelected(mentor);
    dialogRef.current?.showModal();
  }

  if (mentors.length === 0) {
    return <p className="text-sm text-ink/70 dark:text-paper/70">No mentors have registered yet.</p>;
  }

  return (
    <>
      <ul className="grid gap-3">
        {mentors.map((mentor) => {
          const name = `${mentor.firstName} ${mentor.lastName}`;
          return (
            <li key={mentor.id} className="border border-ink/10 px-4 py-4 dark:border-paper/10">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{name}</p>
                  <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">{mentor.email}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="border border-ink/15 px-2 py-1 dark:border-paper/20">
                    {approvalLabel[mentor.approvalStatus]}
                  </span>
                  <span className="border border-ink/15 px-2 py-1 dark:border-paper/20">
                    {mentor.active ? "Active" : "Disabled"}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-sm text-ink/70 dark:text-paper/70">{mentor.employeeId}</p>
              <div className="mt-4 flex flex-col gap-3">
                <h3 className="text-sm font-medium">Organisations</h3>
                {mentor.approvalStatus === "APPROVED" ? (
                  <>
                    {mentor.organisations.length === 0 ? (
                      <p className="text-sm text-ink/70 dark:text-paper/70">No organisation is assigned.</p>
                    ) : (
                      <ul className="flex flex-col gap-2">
                        {mentor.organisations.map((organisation) => (
                          <li key={organisation.id} className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-sm">
                              {organisation.name}
                              {organisation.approved ? "" : " · Not approved"}
                            </span>
                            <MentorAction
                              action={unassignMentorOrganisationAction}
                              userId={mentor.id}
                              label="Remove"
                              name="organisationId"
                              value={organisation.id}
                              quiet
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                    <AssignOrganisation
                      userId={mentor.id}
                      hasApprovedOrganisations={organisations.length > 0}
                      organisations={organisations.filter(
                        (organisation) => !mentor.organisations.some((assigned) => assigned.id === organisation.id),
                      )}
                    />
                  </>
                ) : (
                  <p className="text-sm text-ink/70 dark:text-paper/70">
                    Approve this mentor before assigning an organisation.
                  </p>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className={quietButton} onClick={() => openDetails(mentor)}>
                  View details
                </button>
                {mentor.approvalStatus === "APPROVED" ? null : (
                  <MentorAction action={approveMentorAction} userId={mentor.id} label="Approve" />
                )}
                <MentorAction
                  action={setMentorActiveAction}
                  userId={mentor.id}
                  label={mentor.active ? "Disable" : "Enable"}
                  name="active"
                  value={mentor.active ? "false" : "true"}
                  quiet
                />
                <MentorAction
                  action={deleteMentorAction}
                  userId={mentor.id}
                  label="Delete"
                  quiet
                  disabled={mentor.active}
                  title={mentor.active ? "Disable this mentor before deleting." : undefined}
                  confirmMessage={`Delete ${name}? This cannot be undone.`}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <dialog
        ref={dialogRef}
        className="fixed top-1/2 left-1/2 max-h-[calc(100dvh-4rem)] w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 border border-ink/15 bg-paper p-6 text-ink backdrop:bg-ink/40 dark:border-paper/15 dark:bg-ink dark:text-paper"
      >
        {selected ? (
          <>
            <h2 className="text-lg font-medium">
              {selected.firstName} {selected.lastName}
            </h2>
            <dl className="mt-4 grid gap-4 text-sm">
              <Detail label="Email" value={selected.email} />
              <Detail label="Employee ID" value={selected.employeeId} />
              <Detail label="GitHub username" value={selected.githubUsername ?? "Not linked"} />
              <Detail label="Approval" value={approvalLabel[selected.approvalStatus]} />
              <Detail label="Access" value={selected.active ? "Can sign in after approval" : "Disabled"} />
              <Detail label="Registered" value={registeredOn.format(new Date(selected.registeredAt))} />
              <Detail
                label="Organisations"
                value={
                  selected.organisations.length > 0
                    ? selected.organisations.map((organisation) => organisation.name).join(", ")
                    : "None assigned"
                }
              />
            </dl>
            <form method="dialog" className="mt-6">
              <button type="submit" className={quietButton}>
                Close
              </button>
            </form>
          </>
        ) : null}
      </dialog>
    </>
  );
}
