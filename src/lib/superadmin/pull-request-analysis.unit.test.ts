import { describe, expect, it, vi } from "vitest";

import {
  ANALYSIS_TIMEOUT_MS,
  parsePullRequestAnalysis,
  readPullRequestAnalysisConfig,
  requestPullRequestAnalysis,
  type AnalysisSubject,
} from "@/lib/superadmin/pull-request-analysis";

const subject: AnalysisSubject = {
  url: "https://github.com/owasp/owasp-java-encoder/pull/153",
  repository: "owasp/owasp-java-encoder",
  number: 153,
  title: "Fix XML encoding",
  body: "Encodes NEL characters.",
  state: "closed",
  merged: true,
  draft: false,
  authorLogin: "tirupatilakshmidevi6-hub",
  additions: 12,
  deletions: 3,
  changedFiles: 2,
  commits: 1,
};

describe("pull request analysis", () => {
  it("reads only an http analysis URL and keeps the token separate", () => {
    expect(readPullRequestAnalysisConfig({})).toBeNull();
    expect(readPullRequestAnalysisConfig({ PR_ANALYSIS_URL: "javascript:alert(1)" })).toBeNull();
    expect(
      readPullRequestAnalysisConfig({
        PR_ANALYSIS_URL: "https://analysis.example/review",
        PR_ANALYSIS_TOKEN: "secret-token",
      }),
    ).toEqual({ url: "https://analysis.example/review", token: "secret-token" });
  });

  it("accepts a rubric fallback and a Gemini report", () => {
    expect(
      parsePullRequestAnalysis({
        summary: "The change is small and explained.",
        insights: [{ metric: "clarity", title: "Clear title", detail: "The title names the encoding fix." }],
        suggestedScores: { clarity: 8, scope: 7, evidence: 6, outcome: 9 },
        analysisMode: "rubric",
      }),
    ).toEqual({
      summary: "The change is small and explained.",
      insights: [{ metric: "clarity", title: "Clear title", detail: "The title names the encoding fix." }],
      suggestedScores: { clarity: 8, scope: 7, evidence: 6, outcome: 9 },
      analysisMode: "rubric",
      category: null,
      categoryLabel: null,
      mergeEstimate: null,
      report: null,
    });
    expect(
      parsePullRequestAnalysis({
        summary: "Good PR. Overall 6.4/10.",
        insights: [{ metric: "clarity", title: "No linked issue", detail: "The description does not close an issue." }],
        suggestedScores: { clarity: 6, scope: 8, evidence: 5, outcome: 5.5 },
        category: "good",
        categoryLabel: "Good PR",
        mergeEstimate: {
          value: 55,
          band: "medium",
          factors: [{ code: "issue_fit", delta: -20, detail: "The change does not satisfy the linked issue." }],
        },
        report: {
          issueFit: 2,
          changeFit: 8,
          guidelines: 6,
          evidence: 5,
          clarity: 6,
          overall: 6.4,
          missingGuide: true,
          criteria: [{ text: "The change addresses the issue", status: "missing", evidence: "" }],
          files: [{ path: "app/main.py", relation: "related", reason: "Review route updated." }],
          guidelineChecks: [{ rule: "Link the issue", status: "fail", evidence: "No closing keyword." }],
          notes: [],
          skippedFiles: [],
          reviewedFiles: ["app/main.py"],
          truncatedFiles: [],
          failingChecks: [],
          nextSteps: ["Link the issue with Fixes #number."],
        },
        analysisMode: "gemini",
      })?.suggestedScores,
    ).toEqual({ clarity: 6, scope: 8, evidence: 5, outcome: 6 });
    expect(parsePullRequestAnalysis({ summary: "Missing insights", analysisMode: "rubric" })).toBeNull();
    expect(
      parsePullRequestAnalysis({
        summary: "Scores out of range",
        insights: [],
        suggestedScores: { clarity: 11, scope: 7, evidence: 6, outcome: 9 },
        analysisMode: "rubric",
      }),
    ).toBeNull();
  });

  it("posts the pull request and sends the token only as a bearer header", async () => {
    const timeout = vi.spyOn(AbortSignal, "timeout");
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      return new Response(
        JSON.stringify({
          summary: "Ready to score.",
          insights: [{ metric: "general", title: "Merged", detail: "The pull request is already merged." }],
          analysisMode: "rubric",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    const result = await requestPullRequestAnalysis(
      subject,
      { url: "https://analysis.example/review", token: "secret-token" },
      fetchImpl as typeof fetch,
    );

    expect(result.ok).toBe(true);
    const [, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toMatchObject({ Authorization: "Bearer secret-token" });
    expect(init.body).not.toContain("secret-token");
    expect(JSON.parse(String(init.body))).toEqual({ pullRequest: subject });
    expect(timeout).toHaveBeenCalledWith(ANALYSIS_TIMEOUT_MS);
    timeout.mockRestore();
  });

  it("maps a rejected token and a failed review without returning the service body", async () => {
    const denied = vi.fn(async () => new Response(JSON.stringify({ detail: "A valid bearer token is required." }), { status: 401 }));
    const failed = vi.fn(async () => new Response(JSON.stringify({ detail: "The pull request could not be analyzed." }), { status: 503 }));

    await expect(requestPullRequestAnalysis(subject, { url: "https://analysis.example/review", token: "secret-token" }, denied)).resolves.toEqual({
      ok: false,
      message: "The analysis service rejected the token.",
    });
    await expect(requestPullRequestAnalysis(subject, { url: "https://analysis.example/review", token: "secret-token" }, failed)).resolves.toEqual({
      ok: false,
      message: "The pull request could not be analyzed.",
    });
  });

  it("reports an unreadable response without returning the body", async () => {
    const fetchImpl = vi.fn(async () => new Response("nope", { status: 200 }));
    const result = await requestPullRequestAnalysis(subject, { url: "https://analysis.example/review", token: null }, fetchImpl);
    expect(result).toEqual({ ok: false, message: "The analysis service returned a response that could not be read." });
  });
});
