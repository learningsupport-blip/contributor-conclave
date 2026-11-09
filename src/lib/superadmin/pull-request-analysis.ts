import { z } from "zod";

import type { RaisedPullRequestScores } from "@/lib/mentor/raised-pull-request-score";

/**
 * Contract for the external pull-request analysis service.
 * The server POSTs JSON to PR_ANALYSIS_URL. The browser never receives PR_ANALYSIS_TOKEN.
 * The token is sent only as an Authorization bearer header.
 * config is omitted so the service runs quality, merge readiness, checks, and coaching.
 *
 * Request:
 * { "pullRequest": { "url", "repository", "number", "title", "body", "state", "merged", "draft", "authorLogin", "additions", "deletions", "changedFiles", "commits" } }
 *
 * A Gemini response includes summary, insights, suggestedScores, category, categoryLabel,
 * mergeEstimate, report, and analysisMode "gemini". A rubric fallback includes summary,
 * insights, suggestedScores, and analysisMode "rubric".
 */

export const ANALYSIS_TIMEOUT_MS = 180_000;

const scorePoint = z
  .number()
  .min(0)
  .max(10)
  .transform((value) => Math.round(value));

const insightSchema = z.object({
  metric: z.enum(["clarity", "scope", "evidence", "outcome", "general"]),
  title: z.string().trim().min(1).max(160),
  detail: z.string().trim().min(1).max(2000),
});

const factorSchema = z.object({
  code: z.string().trim().min(1).max(80),
  delta: z.number().finite(),
  detail: z.string().trim().min(1).max(500),
});

const criterionSchema = z.object({
  text: z.string().trim().min(1).max(300),
  status: z.enum(["met", "partial", "missing", "unknown"]),
  evidence: z.string().max(1000),
});

const fileSchema = z.object({
  path: z.string().trim().min(1).max(300),
  relation: z.enum(["required", "related", "unrelated", "unknown"]),
  reason: z.string().max(500),
});

const guidelineSchema = z.object({
  rule: z.string().trim().min(1).max(200),
  status: z.enum(["pass", "fail", "unknown", "not_applicable"]),
  evidence: z.string().max(1000),
});

const reportSchema = z.object({
  issueFit: z.number().min(0).max(10).optional(),
  changeFit: z.number().min(0).max(10).optional(),
  guidelines: z.number().min(0).max(10).optional(),
  evidence: z.number().min(0).max(10).optional(),
  clarity: z.number().min(0).max(10).optional(),
  overall: z.number().min(0).max(10).optional(),
  missingGuide: z.boolean().optional(),
  criteria: z.array(criterionSchema).max(40).optional(),
  files: z.array(fileSchema).max(80).optional(),
  guidelineChecks: z.array(guidelineSchema).max(40).optional(),
  notes: z.array(z.string().max(500)).max(20).optional(),
  skippedFiles: z.array(z.string().max(300)).max(80).optional(),
  reviewedFiles: z.array(z.string().max(300)).max(80).optional(),
  truncatedFiles: z.array(z.string().max(300)).max(80).optional(),
  failingChecks: z.array(z.string().max(300)).max(40).optional(),
  nextSteps: z.array(z.string().max(500)).max(20).optional(),
});

const analysisResponseSchema = z.object({
  summary: z.string().trim().min(1).max(2000),
  insights: z.array(insightSchema).max(20),
  suggestedScores: z
    .object({
      clarity: scorePoint,
      scope: scorePoint,
      evidence: scorePoint,
      outcome: scorePoint,
    })
    .optional(),
  category: z.enum(["bad", "good", "very_good"]).optional(),
  categoryLabel: z.string().trim().min(1).max(40).optional(),
  mergeEstimate: z
    .object({
      value: z.number().min(5).max(92),
      band: z.enum(["low", "medium", "high"]),
      factors: z.array(factorSchema).max(20).optional(),
    })
    .optional(),
  report: reportSchema.optional(),
  analysisMode: z.enum(["gemini", "rubric"]),
});

export type AnalysisInsight = z.infer<typeof insightSchema>;
export type AnalysisCriterion = z.infer<typeof criterionSchema>;
export type AnalysisFileRelation = z.infer<typeof fileSchema>;
export type AnalysisGuidelineCheck = z.infer<typeof guidelineSchema>;

export type AnalysisReport = {
  issueFit: number | null;
  changeFit: number | null;
  guidelines: number | null;
  evidence: number | null;
  clarity: number | null;
  overall: number | null;
  missingGuide: boolean;
  criteria: AnalysisCriterion[];
  files: AnalysisFileRelation[];
  guidelineChecks: AnalysisGuidelineCheck[];
  notes: string[];
  skippedFiles: string[];
  reviewedFiles: string[];
  truncatedFiles: string[];
  failingChecks: string[];
  nextSteps: string[];
};

export type PullRequestAnalysis = {
  summary: string;
  insights: AnalysisInsight[];
  suggestedScores: RaisedPullRequestScores | null;
  analysisMode: "gemini" | "rubric";
  category: "bad" | "good" | "very_good" | null;
  categoryLabel: string | null;
  mergeEstimate: {
    value: number;
    band: "low" | "medium" | "high";
    factors: { code: string; delta: number; detail: string }[];
  } | null;
  report: AnalysisReport | null;
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
const rejectedToken = "The analysis service rejected the token.";
const analysisFailed = "The pull request could not be analyzed.";

function list<T>(value: T[] | undefined): T[] {
  return value ?? [];
}

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

  const report = parsed.data.report;
  return {
    summary: parsed.data.summary,
    insights: parsed.data.insights,
    suggestedScores: parsed.data.suggestedScores ?? null,
    analysisMode: parsed.data.analysisMode,
    category: parsed.data.category ?? null,
    categoryLabel: parsed.data.categoryLabel ?? null,
    mergeEstimate: parsed.data.mergeEstimate
      ? {
          value: parsed.data.mergeEstimate.value,
          band: parsed.data.mergeEstimate.band,
          factors: list(parsed.data.mergeEstimate.factors),
        }
      : null,
    report: report
      ? {
          issueFit: report.issueFit ?? null,
          changeFit: report.changeFit ?? null,
          guidelines: report.guidelines ?? null,
          evidence: report.evidence ?? null,
          clarity: report.clarity ?? null,
          overall: report.overall ?? null,
          missingGuide: report.missingGuide ?? false,
          criteria: list(report.criteria),
          files: list(report.files),
          guidelineChecks: list(report.guidelineChecks),
          notes: list(report.notes),
          skippedFiles: list(report.skippedFiles),
          reviewedFiles: list(report.reviewedFiles),
          truncatedFiles: list(report.truncatedFiles),
          failingChecks: list(report.failingChecks),
          nextSteps: list(report.nextSteps),
        }
      : null,
  };
}

function messageForStatus(status: number): string {
  if (status === 401) {
    return rejectedToken;
  }
  if (status === 503) {
    return analysisFailed;
  }
  return unavailable;
}

export async function requestPullRequestAnalysis(
  pullRequest: AnalysisSubject,
  config: AnalysisConfig,
  fetchImpl: typeof fetch = fetch,
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
      body: JSON.stringify({ pullRequest }),
      signal: AbortSignal.timeout(ANALYSIS_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    return { ok: false, message: name === "TimeoutError" || name === "AbortError" ? timedOut : unavailable };
  }

  if (!response.ok) {
    return { ok: false, message: messageForStatus(response.status) };
  }

  try {
    const analysis = parsePullRequestAnalysis(await response.json());
    return analysis ? { ok: true, data: analysis } : { ok: false, message: unreadable };
  } catch {
    return { ok: false, message: unreadable };
  }
}
