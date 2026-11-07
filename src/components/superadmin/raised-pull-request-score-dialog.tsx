"use client";

import { useActionState, useId, useState, type RefObject } from "react";

import {
  analyzeRaisedPullRequestAction,
  refreshRaisedPullRequestAction,
  scoreRaisedPullRequestAction,
  type OrganisationFormState,
} from "@/app/actions/superadmin";
import { SubmitButton } from "@/components/auth/submit-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { TextareaField } from "@/components/ui/textarea-field";
import { buttonCorners, controlClass, focusRing } from "@/components/ui/styles";
import { SCORE_METRICS, type ScoreMetricKey } from "@/lib/mentor/raised-pull-request-score";
import type { PullRequestAnalysis } from "@/lib/superadmin/pull-request-analysis";
import type { SuperadminRaisedPullRequest } from "@/lib/superadmin/raised-pull-requests";

const quietButton = `inline-flex h-9 items-center justify-center border border-ink/20 px-3 text-sm font-medium dark:border-paper/25 ${buttonCorners} ${focusRing}`;
const solidButton = `inline-flex h-11 items-center justify-center bg-zinc-950 px-5 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:focus-visible:outline-zinc-50 ${buttonCorners}`;
const dialogClass =
  "fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[min(68rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-ink/15 bg-paper p-6 text-ink backdrop:bg-ink/60 sm:p-8 dark:border-paper/15 dark:bg-ink dark:text-paper";

const statusTone = {
  Draft: "pending",
  Open: "pending",
  Merged: "approved",
  Closed: "closed",
} as const;

const metricLabel: Record<PullRequestAnalysis["insights"][number]["metric"], string> = {
  clarity: "Clarity",
  scope: "Scope",
  evidence: "Evidence",
  outcome: "Outcome",
  general: "General",
};

function countLabel(value: number | null): string {
  return value === null ? "—" : value.toLocaleString("en-IN");
}

function ScorePanel({
  submission,
  headingId,
  onClose,
}: {
  submission: SuperadminRaisedPullRequest;
  headingId: string;
  onClose: () => void;
}) {
  const titleId = headingId;
  const [scores, setScores] = useState<Record<ScoreMetricKey, string>>({
    clarity: submission.clarity === null ? "" : String(submission.clarity),
    scope: submission.scope === null ? "" : String(submission.scope),
    evidence: submission.evidence === null ? "" : String(submission.evidence),
    outcome: submission.outcome === null ? "" : String(submission.outcome),
  });
  const [analysis, setAnalysis] = useState<PullRequestAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [scoreState, scoreAction, scorePending] = useActionState(saveScore, undefined);
  const [refreshState, refreshAction, refreshPending] = useActionState(refreshRaisedPullRequestAction, undefined);
  const facts = [
    { label: "Commits", value: countLabel(submission.commits) },
    { label: "Additions", value: countLabel(submission.additions) },
    { label: "Deletions", value: countLabel(submission.deletions) },
    { label: "Files", value: countLabel(submission.changedFiles) },
  ];

  async function saveScore(previous: OrganisationFormState | undefined, formData: FormData) {
    const result = await scoreRaisedPullRequestAction(previous, formData);
    if (result.saved) {
      onClose();
    }
    return result;
  }

  async function analyze() {
    setAnalyzing(true);
    setAnalysisError(null);
    try {
      const result = await analyzeRaisedPullRequestAction(submission.id);
      if ("formError" in result) {
        setAnalysisError(result.formError);
        return;
      }
      setAnalysis(result.analysis);
    } catch {
      setAnalysisError("The analysis service could not review this pull request.");
    } finally {
      setAnalyzing(false);
    }
  }

  function useSuggestedScores() {
    if (!analysis?.suggestedScores) {
      return;
    }
    setScores({
      clarity: String(analysis.suggestedScores.clarity),
      scope: String(analysis.suggestedScores.scope),
      evidence: String(analysis.suggestedScores.evidence),
      outcome: String(analysis.suggestedScores.outcome),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id={titleId} className="text-2xl font-semibold tracking-tight">
            Score pull request
          </h2>
          <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">
            {submission.mentorName} · {submission.organisationName} · {submission.authorLogin}
          </p>
          <a
            href={submission.url}
            target="_blank"
            rel="noreferrer"
            className={`mt-2 inline-block max-w-full font-medium underline underline-offset-4 ${focusRing}`}
          >
            {submission.title}
          </a>
          <p className="mt-1 text-sm text-ink/70 dark:text-paper/60">
            {submission.repository}#{submission.number}
          </p>
        </div>
        <StatusBadge tone={statusTone[submission.status]}>{submission.status}</StatusBadge>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {facts.map((fact) => (
          <div key={fact.label} className="border border-ink/10 px-3 py-3 dark:border-paper/15">
            <dt className="text-xs tracking-wide text-ink/70 uppercase dark:text-paper/60">{fact.label}</dt>
            <dd className="mt-1 text-lg font-semibold">{fact.value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <section className="flex flex-col gap-4 border border-ink/10 p-4 dark:border-paper/15" aria-labelledby={`${titleId}-analysis`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 id={`${titleId}-analysis`} className="text-lg font-semibold">
                AI analysis
              </h3>
              <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">
                Ask the review service for insights. Suggested scores stay editable until you save them.
              </p>
            </div>
            <button type="button" className={solidButton} onClick={analyze} disabled={analyzing} aria-busy={analyzing}>
              {analyzing ? "Analyzing…" : "AI Analysis"}
            </button>
          </div>
          {analysisError ? (
            <p role="alert" className="text-sm text-red-700 dark:text-red-400">
              {analysisError}
            </p>
          ) : null}
          {analysis ? (
            <div className="flex flex-col gap-3" aria-live="polite">
              <p className="text-sm">{analysis.summary}</p>
              {analysis.insights.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {analysis.insights.map((insight) => (
                    <li key={`${insight.metric}-${insight.title}`} className="border border-ink/10 px-3 py-3 dark:border-paper/15">
                      <p className="text-xs font-medium tracking-wide text-moss-800 uppercase dark:text-moss-200">
                        {metricLabel[insight.metric]}
                      </p>
                      <p className="mt-1 font-medium">{insight.title}</p>
                      <p className="mt-1 text-sm text-ink/75 dark:text-paper/75">{insight.detail}</p>
                    </li>
                  ))}
                </ul>
              ) : null}
              {analysis.suggestedScores ? (
                <div className="flex flex-wrap items-center justify-between gap-3 border border-moss-700/30 px-3 py-3 dark:border-moss-300/30">
                  <p className="text-sm">
                    Suggested scores:{" "}
                    {SCORE_METRICS.map((metric) => `${metric.label} ${analysis.suggestedScores?.[metric.key]}`).join(" · ")}
                  </p>
                  <button type="button" className={quietButton} onClick={useSuggestedScores}>
                    Use suggested scores
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
          {submission.body ? (
            <p className="max-h-36 overflow-y-auto text-sm text-ink/80 dark:text-paper/80">{submission.body}</p>
          ) : (
            <p className="text-sm text-ink/70 dark:text-paper/60">GitHub did not include a description.</p>
          )}
          <form action={refreshAction}>
            <input type="hidden" name="pullRequestId" value={submission.id} />
            <button type="submit" className={quietButton} disabled={refreshPending}>
              {refreshPending ? "Refreshing…" : "Refresh from GitHub"}
            </button>
            {refreshState?.formError ? (
              <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-400">
                {refreshState.formError}
              </p>
            ) : null}
          </form>
        </section>

        <form action={scoreAction} className="flex flex-col gap-4 border border-ink/10 p-4 dark:border-paper/15">
          <h3 className="text-lg font-semibold">Scores</h3>
          <input type="hidden" name="pullRequestId" value={submission.id} />
          <div className="grid gap-3">
            {SCORE_METRICS.map((metric) => (
              <div key={metric.key} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-3">
                  <label htmlFor={`${submission.id}-${metric.key}`} className="text-sm font-medium">
                    {metric.label}
                  </label>
                  <span className="text-xs text-ink/55 dark:text-paper/55">0–10</span>
                </div>
                <p id={`${submission.id}-${metric.key}-hint`} className="text-sm text-ink/70 dark:text-paper/70">
                  {metric.hint}
                </p>
                <input
                  id={`${submission.id}-${metric.key}`}
                  name={metric.key}
                  type="number"
                  min={0}
                  max={10}
                  step={1}
                  required
                  value={scores[metric.key]}
                  onChange={(event) => setScores((current) => ({ ...current, [metric.key]: event.target.value }))}
                  aria-describedby={`${submission.id}-${metric.key}-hint`}
                  className={controlClass}
                />
              </div>
            ))}
          </div>
          <TextareaField id={`${submission.id}-note`} name="note" label="Note" maxLength={500} defaultValue={submission.note} />
          {scoreState?.formError ? (
            <p role="alert" className="text-sm text-red-700 dark:text-red-400">
              {scoreState.formError}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <SubmitButton pending={scorePending} pendingLabel="Saving…">
              Save score
            </SubmitButton>
            <button type="button" className={quietButton} onClick={onClose}>
              Close
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function RaisedPullRequestScoreDialog({
  submission,
  dialogRef,
}: {
  submission: SuperadminRaisedPullRequest | null;
  dialogRef: RefObject<HTMLDialogElement | null>;
}) {
  const titleId = useId();

  return (
    <dialog ref={dialogRef} aria-labelledby={titleId} className={dialogClass}>
      {submission ? (
        <ScorePanel key={submission.id} submission={submission} headingId={titleId} onClose={() => dialogRef.current?.close()} />
      ) : (
        <h2 id={titleId} className="text-xl font-semibold">
          Score pull request
        </h2>
      )}
    </dialog>
  );
}
