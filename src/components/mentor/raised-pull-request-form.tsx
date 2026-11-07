"use client";

import { useActionState, useState } from "react";

import { submitRaisedPullRequestAction, type MentorFormState } from "@/app/actions/mentor";
import { SubmitButton } from "@/components/auth/submit-button";
import { SelectField } from "@/components/ui/select-field";
import { TextField } from "@/components/ui/text-field";
import { StatusBadge } from "@/components/ui/status-badge";
import { focusRing } from "@/components/ui/styles";
import type { RaisedPullRequestView } from "@/lib/mentor/raised-pull-requests";

const statusTone = {
  Draft: "pending",
  Open: "pending",
  Merged: "approved",
  Closed: "closed",
} as const;

function FormMessages({ state }: { state: MentorFormState | undefined }) {
  if (!state?.formError) {
    return null;
  }
  const fieldMessages = Object.values(state.fieldErrors ?? {}).flat();
  if (fieldMessages.includes(state.formError)) {
    return null;
  }
  return (
    <p role="alert" className="text-sm text-red-700 dark:text-red-400">
      {state.formError}
    </p>
  );
}

export function RaisedPullRequestForm({
  organisations,
  submissions,
}: {
  organisations: { id: string; name: string }[];
  submissions: RaisedPullRequestView[];
}) {
  const [state, action, pending] = useActionState(submitRaisedPullRequestAction, undefined);
  const [organisationId, setOrganisationId] = useState("");

  return (
    <div className="flex flex-col gap-8">
      {organisations.length === 0 ? (
        <p className="text-ink/75 dark:text-paper/75">No approved organisation has been assigned to you yet.</p>
      ) : (
        <form action={action} className="flex max-w-xl flex-col gap-4">
          <SelectField
            id="organisationId"
            name="organisationId"
            label="Organisation"
            required
            value={organisationId}
            onChange={setOrganisationId}
            options={[
              { value: "", label: "Choose an organisation" },
              ...organisations.map((organisation) => ({ value: organisation.id, label: organisation.name })),
            ]}
            errors={state?.fieldErrors?.organisationId}
          />
          {organisationId ? (
            <TextField
              id="pullRequestUrl"
              name="pullRequestUrl"
              label="Pull request link"
              type="url"
              required
              autoComplete="off"
              errors={state?.fieldErrors?.pullRequestUrl}
            />
          ) : (
            <p className="text-sm text-ink/70 dark:text-paper/70">Select an organisation to submit a pull request link.</p>
          )}
          <FormMessages state={state} />
          <div>
            <SubmitButton pending={pending} pendingLabel="Submitting…">
              Submit pull request
            </SubmitButton>
          </div>
        </form>
      )}
      <section className="flex flex-col gap-3" aria-labelledby="raised-pr-list">
        <h2 id="raised-pr-list" className="text-lg font-semibold">
          Submitted pull requests
        </h2>
        {submissions.length === 0 ? (
          <p className="text-ink/75 dark:text-paper/75">Pull requests you submit will appear here with their GitHub status.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {submissions.map((submission) => (
              <li key={submission.id} className="border border-ink/10 px-4 py-4 dark:border-paper/10">
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={submission.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`font-medium underline underline-offset-4 ${focusRing}`}
                  >
                    {submission.title}
                  </a>
                  <StatusBadge tone={statusTone[submission.status]}>{submission.status}</StatusBadge>
                </div>
                <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">
                  {submission.organisationName} · {submission.repository}#{submission.number}
                </p>
                <p className="mt-2 text-sm">
                  {submission.overall ? `Score ${submission.overall} / 10` : "Waiting for analysis"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
