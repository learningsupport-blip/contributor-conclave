import { describe, expect, it, vi } from "vitest";

import {
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

  it("accepts a summary, insights, and optional scores", () => {
    expect(
      parsePullRequestAnalysis({
        summary: "The change is small and explained.",
        insights: [{ metric: "clarity", title: "Clear title", detail: "The title names the encoding fix." }],
        suggestedScores: { clarity: 8, scope: 7, evidence: 6, outcome: 9 },
      }),
    ).toEqual({
      summary: "The change is small and explained.",
      insights: [{ metric: "clarity", title: "Clear title", detail: "The title names the encoding fix." }],
      suggestedScores: { clarity: 8, scope: 7, evidence: 6, outcome: 9 },
    });
    expect(parsePullRequestAnalysis({ summary: "Missing insights" })).toBeNull();
    expect(
      parsePullRequestAnalysis({
        summary: "Scores out of range",
        insights: [],
        suggestedScores: { clarity: 11, scope: 7, evidence: 6, outcome: 9 },
      }),
    ).toBeNull();
  });

  it("posts the pull request and sends the token only as a bearer header", async () => {
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      return new Response(
        JSON.stringify({
          summary: "Ready to score.",
          insights: [{ metric: "general", title: "Merged", detail: "The pull request is already merged." }],
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
    expect(JSON.parse(String(init.body))).toMatchObject({
      pullRequest: { number: 153, repository: subject.repository },
      config: { aspects: { quality: true, checks: true }, suggestScores: true },
    });
  });

  it("reports an unreadable response without returning the body", async () => {
    const fetchImpl = vi.fn(async () => new Response("nope", { status: 200 }));
    const result = await requestPullRequestAnalysis(subject, { url: "https://analysis.example/review", token: null }, fetchImpl);
    expect(result).toEqual({ ok: false, message: "The analysis service returned a response that could not be read." });
  });
});
