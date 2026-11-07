import type { AdminError, AdminSuccess } from "@/lib/admin/access";
import { db } from "@/lib/db";
import { logError } from "@/lib/log";
import { adminInvalid, requireSuperAdminActor } from "@/lib/superadmin/access";
import { analysisRubricForReview } from "@/lib/superadmin/analysis-service-settings";
import {
  readPullRequestAnalysisConfig,
  requestPullRequestAnalysis,
  type PullRequestAnalysis,
} from "@/lib/superadmin/pull-request-analysis";
import { z } from "zod";

export async function analyzeRaisedPullRequest(
  actorId: string,
  pullRequestId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<AdminSuccess<PullRequestAnalysis> | AdminError> {
  const actor = await requireSuperAdminActor(actorId, "prs");
  if (!actor.ok) {
    return actor;
  }

  if (!z.uuid().safeParse(pullRequestId).success) {
    return adminInvalid("That pull request could not be found.");
  }

  const settings = await analysisRubricForReview();
  if (!settings.enabled) {
    return adminInvalid("Pull request analysis is turned off.");
  }

  const config = readPullRequestAnalysisConfig();
  if (!config) {
    return adminInvalid("The analysis service is not connected yet.");
  }

  const row = await db.mentorRaisedPullRequest.findUnique({
    where: { id: pullRequestId },
    select: {
      githubPrUrl: true,
      repository: true,
      number: true,
      title: true,
      body: true,
      state: true,
      merged: true,
      draft: true,
      authorLogin: true,
      additions: true,
      deletions: true,
      changedFiles: true,
      commits: true,
    },
  });
  if (!row) {
    return adminInvalid("That pull request could not be found.");
  }

  const analysis = await requestPullRequestAnalysis(
    {
      url: row.githubPrUrl,
      repository: row.repository,
      number: row.number,
      title: row.title,
      body: row.body,
      state: row.state,
      merged: row.merged,
      draft: row.draft,
      authorLogin: row.authorLogin,
      additions: row.additions,
      deletions: row.deletions,
      changedFiles: row.changedFiles,
      commits: row.commits,
    },
    config,
    fetchImpl,
    settings,
  );
  if (!analysis.ok) {
    logError("raised_pull_request_analysis_failed", { configured: true });
    return adminInvalid(analysis.message);
  }

  return { ok: true, data: analysis.data };
}
