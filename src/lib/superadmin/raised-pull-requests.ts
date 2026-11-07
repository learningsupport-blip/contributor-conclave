import type { AdminError, AdminSuccess } from "@/lib/admin/access";
import { adminInvalid, requireSuperAdminActor } from "@/lib/superadmin/access";
import { db } from "@/lib/db";
import { logError } from "@/lib/log";
import type { GitHubResult, ValidatedPullRequest } from "@/lib/github/types";
import { github as defaultGitHub } from "@/lib/github/service";
import {
  loadRaisedPullRequestRows,
  refreshRaisedPullRequest,
  type RaisedPullRequestView,
} from "@/lib/mentor/raised-pull-requests";
import { parseRaisedPullRequestScores, type RaisedPullRequestScores } from "@/lib/mentor/raised-pull-request-score";

export type SuperadminRaisedPullRequest = RaisedPullRequestView & { mentorName: string };

type PullRequestCheck = {
  validatePullRequestUrl: (value: string) => Promise<GitHubResult<ValidatedPullRequest>>;
};

export async function listRaisedPullRequests(
  actorId: string,
  pullRequests: PullRequestCheck = defaultGitHub,
): Promise<AdminSuccess<SuperadminRaisedPullRequest[]> | AdminError> {
  const actor = await requireSuperAdminActor(actorId, "prs");
  if (!actor.ok) {
    return actor;
  }

  return { ok: true, data: await loadRaisedPullRequestRows(pullRequests) };
}

export async function refreshRaisedPullRequestDetails(
  actorId: string,
  pullRequestId: string,
  pullRequests: PullRequestCheck = defaultGitHub,
): Promise<AdminSuccess<{ id: string }> | AdminError> {
  const actor = await requireSuperAdminActor(actorId, "prs");
  if (!actor.ok) {
    return actor;
  }

  const exists = await db.mentorRaisedPullRequest.findUnique({ where: { id: pullRequestId }, select: { id: true } });
  if (!exists) {
    return adminInvalid("That pull request could not be found.");
  }

  const refreshed = await refreshRaisedPullRequest(pullRequestId, pullRequests);
  if (!refreshed) {
    return adminInvalid("GitHub details could not be refreshed. The saved details are still available.");
  }

  return { ok: true, data: { id: pullRequestId } };
}

export async function scoreRaisedPullRequest(
  actorId: string,
  pullRequestId: string,
  input: { clarity: string; scope: string; evidence: string; outcome: string; note: string },
): Promise<AdminSuccess<{ id: string; scores: RaisedPullRequestScores }> | AdminError> {
  const actor = await requireSuperAdminActor(actorId, "prs");
  if (!actor.ok) {
    return actor;
  }

  const scores = parseRaisedPullRequestScores(input);
  if (!scores) {
    return adminInvalid("Score each metric with a whole number from 0 to 10.");
  }

  const note = input.note.trim();
  if (note.length > 500) {
    return adminInvalid("The note must be 500 characters or fewer.");
  }

  const existing = await db.mentorRaisedPullRequest.findUnique({ where: { id: pullRequestId }, select: { id: true } });
  if (!existing) {
    return adminInvalid("That pull request could not be found.");
  }

  try {
    await db.mentorRaisedPullRequest.update({
      where: { id: existing.id },
      data: {
        clarityScore: scores.clarity,
        scopeScore: scores.scope,
        evidenceScore: scores.evidence,
        outcomeScore: scores.outcome,
        scoreNote: note.length > 0 ? note : null,
        scoredById: actor.data.id,
        scoredAt: new Date(),
      },
    });
  } catch (error) {
    logError("raised_pull_request_score_failed", { name: error instanceof Error ? error.name : "Error" });
    return adminInvalid("The score could not be saved.");
  }

  return { ok: true, data: { id: existing.id, scores } };
}
