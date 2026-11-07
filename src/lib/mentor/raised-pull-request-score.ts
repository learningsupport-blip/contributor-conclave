import { z } from "zod";

import { parsePullRequestUrl } from "@/lib/github/parse";

export const SCORE_METRICS = [
  { key: "clarity", label: "Clarity", hint: "The title and description explain the change." },
  { key: "scope", label: "Scope", hint: "The change stays focused on one purpose." },
  { key: "evidence", label: "Evidence", hint: "The size, commits, and discussion support the change." },
  { key: "outcome", label: "Outcome", hint: "The pull request progressed toward a merge." },
] as const;

export type ScoreMetricKey = (typeof SCORE_METRICS)[number]["key"];

export type RaisedPullRequestStatus = "Draft" | "Open" | "Merged" | "Closed";

export type RaisedPullRequestScores = Record<ScoreMetricKey, number>;

const pullRequestUrlSchema = z
  .string()
  .trim()
  .min(1, { error: "Enter a GitHub pull request URL." })
  .max(300, { error: "Pull request URL must be 300 characters or fewer." })
  .refine((value) => parsePullRequestUrl(value) !== null, {
    error: "Enter a GitHub pull request URL, such as https://github.com/owner/repo/pull/1.",
  });

export const raisedPullRequestSchema = z.object({
  organisationId: z.uuid({ error: "Choose an organisation." }),
  pullRequestUrl: pullRequestUrlSchema,
});

export type RaisedPullRequestInput = z.infer<typeof raisedPullRequestSchema>;

export function parseScorePoint(value: string): number | null {
  if (!/^\d{1,2}$/.test(value)) {
    return null;
  }
  const score = Number(value);
  return score <= 10 ? score : null;
}

export function parseRaisedPullRequestScores(input: {
  clarity: string;
  scope: string;
  evidence: string;
  outcome: string;
}): RaisedPullRequestScores | null {
  const clarity = parseScorePoint(input.clarity);
  const scope = parseScorePoint(input.scope);
  const evidence = parseScorePoint(input.evidence);
  const outcome = parseScorePoint(input.outcome);
  if (clarity === null || scope === null || evidence === null || outcome === null) {
    return null;
  }
  return { clarity, scope, evidence, outcome };
}

export function averageScore(scores: RaisedPullRequestScores): number {
  return (scores.clarity + scores.scope + scores.evidence + scores.outcome) / 4;
}

export function formatScore(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }
  return value.toFixed(2).replace(/0$/, "");
}

export function raisedPullRequestStatus(input: {
  state: string;
  merged: boolean;
  draft: boolean;
}): RaisedPullRequestStatus {
  if (input.merged) {
    return "Merged";
  }
  if (input.state === "closed") {
    return "Closed";
  }
  if (input.draft) {
    return "Draft";
  }
  return "Open";
}
