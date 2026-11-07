"use client";

import { useActionState, useId, useRef, useState } from "react";

import {
  refreshRaisedPullRequestAction,
  scoreRaisedPullRequestAction,
  type OrganisationFormState,
} from "@/app/actions/superadmin";
import { SubmitButton } from "@/components/auth/submit-button";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { TextareaField } from "@/components/ui/textarea-field";
import { buttonCorners, controlClass, focusRing } from "@/components/ui/styles";
import { SCORE_METRICS } from "@/lib/mentor/raised-pull-request-score";
import type { SuperadminRaisedPullRequest } from "@/lib/superadmin/raised-pull-requests";

const quietButton = `inline-flex h-9 items-center justify-center border border-ink/20 px-3 text-sm font-medium dark:border-paper/25 ${buttonCorners} ${focusRing}`;
const dialogClass =
  "fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-4rem)] w-[min(40rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-ink/15 bg-paper p-6 text-ink backdrop:bg-ink/60 sm:p-8 dark:border-paper/15 dark:bg-ink dark:text-paper";

const statusTone = {
  Draft: "pending",
  Open: "pending",
  Merged: "approved",
  Closed: "closed",
} as const;

function countLabel(value: number | null, label: string): string | null {
  return value === null ? null : `${value.toLocaleString("en-IN")} ${label}`;
}

export function RaisedPullRequestTable({ submissions }: { submissions: SuperadminRaisedPullRequest[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scoreState, scoreAction, scorePending] = useActionState(saveScore, undefined);
  const [refreshState, refreshAction, refreshPending] = useActionState(refreshRaisedPullRequestAction, undefined);
  const selected = submissions.find((submission) => submission.id === selectedId) ?? null;

  async function saveScore(previous: OrganisationFormState | undefined, formData: FormData) {
    const result = await scoreRaisedPullRequestAction(previous, formData);
    if (result.saved) {
      dialogRef.current?.close();
    }
    return result;
  }

  return (
    <>
      <DataTable
        caption="Mentor raised pull requests"
        emptyTitle="No pull requests"
        emptyDescription="Pull requests submitted by mentors appear here for scoring."
        columns={[
          { key: "mentor", header: "Mentor" },
          { key: "organisation", header: "Organisation" },
          { key: "pull", header: "Pull request" },
          { key: "status", header: "GitHub status" },
          { key: "score", header: "Score" },
          { key: "action", header: "Action" },
        ]}
        rows={submissions.map((submission) => ({
          id: submission.id,
          mentor: submission.mentorName,
          organisation: submission.organisationName,
          pull: submission.title,
          status: <StatusBadge tone={statusTone[submission.status]}>{submission.status}</StatusBadge>,
          score: submission.overall ? `${submission.overall} / 10` : "Not scored",
          action: (
            <button
              type="button"
              className={quietButton}
              onClick={() => {
                setSelectedId(submission.id);
                dialogRef.current?.showModal();
              }}
            >
              Score
            </button>
          ),
        }))}
      />
      <dialog ref={dialogRef} aria-labelledby={titleId} className={dialogClass}>
        {selected ? (
          <div className="flex flex-col gap-5">
            <div>
              <h2 id={titleId} className="text-xl font-semibold">
                Score pull request
              </h2>
              <p className="mt-2 text-sm text-ink/70 dark:text-paper/70">
                {selected.mentorName} · {selected.organisationName}
              </p>
              <a
                href={selected.url}
                target="_blank"
                rel="noreferrer"
                className={`mt-2 inline-block font-medium underline underline-offset-4 ${focusRing}`}
              >
                {selected.title}
              </a>
            </div>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-ink/60 dark:text-paper/60">Status</dt>
                <dd>{selected.status}</dd>
              </div>
              <div>
                <dt className="text-ink/60 dark:text-paper/60">Author</dt>
                <dd>{selected.authorLogin}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-ink/60 dark:text-paper/60">Change</dt>
                <dd>
                  {[
                    countLabel(selected.commits, "commits"),
                    countLabel(selected.additions, "additions"),
                    countLabel(selected.deletions, "deletions"),
                    countLabel(selected.changedFiles, "files"),
                  ]
                    .filter((item): item is string => Boolean(item))
                    .join(" · ") || "GitHub did not include change counts."}
                </dd>
              </div>
            </dl>
            {selected.body ? <p className="text-sm text-ink/80 dark:text-paper/80">{selected.body}</p> : null}
            <form action={refreshAction}>
              <input type="hidden" name="pullRequestId" value={selected.id} />
              <button type="submit" className={quietButton} disabled={refreshPending}>
                {refreshPending ? "Refreshing…" : "Refresh from GitHub"}
              </button>
              {refreshState?.formError ? (
                <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-400">
                  {refreshState.formError}
                </p>
              ) : null}
            </form>
            <form key={selected.id} action={scoreAction} className="flex flex-col gap-4">
              <input type="hidden" name="pullRequestId" value={selected.id} />
              <div className="grid gap-4 sm:grid-cols-2">
                {SCORE_METRICS.map((metric) => (
                  <div key={metric.key} className="flex flex-col gap-1">
                    <label htmlFor={`${selected.id}-${metric.key}`} className="text-sm font-medium">
                      {metric.label}
                    </label>
                    <p id={`${selected.id}-${metric.key}-hint`} className="text-sm text-ink/70 dark:text-paper/70">
                      {metric.hint}
                    </p>
                    <input
                      id={`${selected.id}-${metric.key}`}
                      name={metric.key}
                      type="number"
                      min={0}
                      max={10}
                      step={1}
                      required
                      defaultValue={selected[metric.key] ?? ""}
                      aria-describedby={`${selected.id}-${metric.key}-hint`}
                      className={controlClass}
                    />
                  </div>
                ))}
              </div>
              <TextareaField
                id={`${selected.id}-note`}
                name="note"
                label="Note"
                maxLength={500}
                defaultValue={selected.note}
              />
              {scoreState?.formError ? (
                <p role="alert" className="text-sm text-red-700 dark:text-red-400">
                  {scoreState.formError}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-3">
                <SubmitButton pending={scorePending} pendingLabel="Saving…">
                  Save score
                </SubmitButton>
                <button type="button" className={quietButton} onClick={() => dialogRef.current?.close()}>
                  Close
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
