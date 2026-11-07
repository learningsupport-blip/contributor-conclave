import { z } from "zod";

import type { RaisedPullRequestScores } from "@/lib/mentor/raised-pull-request-score";
import { DEFAULT_ANALYSIS_SETTINGS, type AnalysisRubric } from "@/lib/superadmin/analysis-rubric";

/**
 * Contract for the external pull-request analysis service.
 * The app POSTs JSON to PR_ANALYSIS_URL and reads this shape back.
 * PR_ANALYSIS_TOKEN, when set, is sent only as an Authorization bearer header.
 *
 * Request:
 * { "pullRequest": { "url", "repository", "number", "title", "body", "state", "merged", "draft", "authorLogin", "additions", "deletions", "changedFiles", "commits" } }
 *
 * Response:
 * { "summary": string, "insights": [{ "metric": "clarity" | "scope" | "evidence" | "outcome" | "general", "title": string, "detail": string }], "suggestedScores"?: { "clarity", "scope", "evidence", "outcome" } }
 */

const scorePoint = z.number().int().min(0).max(10);

const insightSchema = z.object({
  metric: z.enum(["clarity", "scope", "evidence", "outcome", "general"]),
  title: z.string().trim().min(1).max(120),
  detail: z.string().trim().min(1).max(1000),
});

const analysisResponseSchema = z.object({
  summary: z.string().trim().min(1).max(2000),
  insights: z.array(insightSchema).max(12),
  suggestedScores: z
    .object({
      clarity: scorePoint,
      scope: scorePoint,
      evidence: scorePoint,
      outcome: scorePoint,
    })
    .optional(),
});

export type AnalysisInsight = z.infer<typeof insightSchema>;

export type PullRequestAnalysis = {
  summary: string;
  insights: AnalysisInsight[];
  suggestedScores: RaisedPullRequestScores | null;
};

export type AnalysisSubject = {
  url: string;
  repository: string;
  number: number;
  title: string;
  body: string;
  state: string;
  merged: boolean;
  draft: boolean;
  authorLogin: string;
  additions: number | null;
  deletions: number | null;
  changedFiles: number | null;
  commits: number | null;
};

export type AnalysisConfig = { url: string; token: string | null };

const unavailable = "The analysis service could not review this pull request.";
const unreadable = "The analysis service returned a response that could not be read.";
const timedOut = "The analysis service did not respond.";

export function readPullRequestAnalysisConfig(env?: {
  PR_ANALYSIS_URL?: string;
  PR_ANALYSIS_TOKEN?: string;
}): AnalysisConfig | null {
  const source = env ?? {
    PR_ANALYSIS_URL: process.env.PR_ANALYSIS_URL,
    PR_ANALYSIS_TOKEN: process.env.PR_ANALYSIS_TOKEN,
  };
  const raw = source.PR_ANALYSIS_URL?.trim() ?? "";
  if (!raw) {
    return null;
  }

  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return null;
    }
    const token = source.PR_ANALYSIS_TOKEN?.trim() ?? "";
    return { url: url.toString(), token: token.length > 0 ? token : null };
  } catch {
    return null;
  }
}

export function parsePullRequestAnalysis(body: unknown): PullRequestAnalysis | null {
  const parsed = analysisResponseSchema.safeParse(body);
  if (!parsed.success) {
    return null;
  }

  return {
    summary: parsed.data.summary,
    insights: parsed.data.insights,
    suggestedScores: parsed.data.suggestedScores ?? null,
  };
}

export async function requestPullRequestAnalysis(
  pullRequest: AnalysisSubject,
  config: AnalysisConfig,
  fetchImpl: typeof fetch = fetch,
  rubric: AnalysisRubric = DEFAULT_ANALYSIS_SETTINGS,
): Promise<{ ok: true; data: PullRequestAnalysis } | { ok: false; message: string }> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (config.token) {
    headers.Authorization = `Bearer ${config.token}`;
  }

  let response: Response;
  try {
    response = await fetchImpl(config.url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        pullRequest,
        config: { aspects: rubric.aspects, suggestScores: rubric.suggestScores, weights: rubric.weights },
      }),
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    });
  } catch (error) {
    return { ok: false, message: error instanceof Error && error.name === "TimeoutError" ? timedOut : unavailable };
  }

  if (!response.ok) {
    return { ok: false, message: unavailable };
  }

  try {
    const analysis = parsePullRequestAnalysis(await response.json());
    return analysis ? { ok: true, data: analysis } : { ok: false, message: unreadable };
  } catch {
    return { ok: false, message: unreadable };
  }
}
