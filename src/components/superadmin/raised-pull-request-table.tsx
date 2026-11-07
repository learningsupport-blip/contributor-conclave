"use client";

import { useRef, useState } from "react";

import { RaisedPullRequestScoreDialog } from "@/components/superadmin/raised-pull-request-score-dialog";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { buttonCorners, focusRing } from "@/components/ui/styles";
import type { SuperadminRaisedPullRequest } from "@/lib/superadmin/raised-pull-requests";

const quietButton = `inline-flex h-9 items-center justify-center border border-ink/20 px-3 text-sm font-medium dark:border-paper/25 ${buttonCorners} ${focusRing}`;

const statusTone = {
  Draft: "pending",
  Open: "pending",
  Merged: "approved",
  Closed: "closed",
} as const;

export function RaisedPullRequestTable({ submissions }: { submissions: SuperadminRaisedPullRequest[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = submissions.find((submission) => submission.id === selectedId) ?? null;

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
      <RaisedPullRequestScoreDialog submission={selected} dialogRef={dialogRef} />
    </>
  );
}
