import { Prisma } from "@/generated/prisma/client";

import { toFieldErrors } from "@/lib/auth/validation";
import { githubAccountFromRepositoryUrl } from "@/lib/github/active-projects";
import { github as defaultGitHub } from "@/lib/github/service";
import type { GitHubPullRequestDetails, GitHubResult, ValidatedPullRequest } from "@/lib/github/types";
import { canonicalSubmission, pullRequestAuthorMatches } from "@/lib/student/submission-schema";
import { db } from "@/lib/db";
import { logError } from "@/lib/log";
import { mentorInvalid, requireMentorActor, type MentorError, type MentorSuccess } from "@/lib/mentor/access";
import {
  averageScore,
  formatScore,
  raisedPullRequestSchema,
  raisedPullRequestStatus,
  type RaisedPullRequestStatus,
} from "@/lib/mentor/raised-pull-request-score";

export type RaisedPullRequestView = {
  id: string;
  organisationId: string;
  organisationName: string;
  title: string;
  url: string;
  repository: string;
  number: number;
  status: RaisedPullRequestStatus;
  authorLogin: string;
  body: string;
  additions: number | null;
  deletions: number | null;
  changedFiles: number | null;
  commits: number | null;
  fetchedAt: string;
  clarity: number | null;
  scope: number | null;
  evidence: number | null;
  outcome: number | null;
  note: string;
  overall: string | null;
};

type PullRequestCheck = {
  validatePullRequestUrl: (value: string) => Promise<GitHubResult<ValidatedPullRequest>>;
};

const duplicateUrl = mentorInvalid("This pull request has already been submitted.", {
  pullRequestUrl: ["This pull request has already been submitted."],
});

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function githubDate(value: string, fallback: Date): Date {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function snapshot(pullRequest: GitHubPullRequestDetails, fetchedAt: Date) {
  return {
    title: pullRequest.title.slice(0, 300),
    body: (pullRequest.body ?? "").slice(0, 2000),
    state: pullRequest.state,
    merged: pullRequest.merged,
    draft: pullRequest.draft,
    authorLogin: pullRequest.authorLogin ?? "",
    additions: pullRequest.additions,
    deletions: pullRequest.deletions,
    changedFiles: pullRequest.changedFiles,
    commits: pullRequest.commits,
    githubCreatedAt: githubDate(pullRequest.createdAt, fetchedAt),
    githubUpdatedAt: githubDate(pullRequest.updatedAt, fetchedAt),
    fetchedAt,
  };
}

const rowSelect = {
  id: true,
  organisationId: true,
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
  fetchedAt: true,
  clarityScore: true,
  scopeScore: true,
  evidenceScore: true,
  outcomeScore: true,
  scoreNote: true,
  organisation: { select: { name: true } },
} as const;

type StoredRow = {
  id: string;
  organisationId: string;
  githubPrUrl: string;
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
  fetchedAt: Date;
  clarityScore: number | null;
  scopeScore: number | null;
  evidenceScore: number | null;
  outcomeScore: number | null;
  scoreNote: string | null;
  organisation: { name: string };
};

function toView(row: StoredRow): RaisedPullRequestView {
  const scored =
    row.clarityScore !== null && row.scopeScore !== null && row.evidenceScore !== null && row.outcomeScore !== null;
  return {
    id: row.id,
    organisationId: row.organisationId,
    organisationName: row.organisation.name,
    title: row.title,
    url: row.githubPrUrl,
    repository: row.repository,
    number: row.number,
    status: raisedPullRequestStatus(row),
    authorLogin: row.authorLogin,
    body: row.body,
    additions: row.additions,
    deletions: row.deletions,
    changedFiles: row.changedFiles,
    commits: row.commits,
    fetchedAt: row.fetchedAt.toISOString(),
    clarity: row.clarityScore,
    scope: row.scopeScore,
    evidence: row.evidenceScore,
    outcome: row.outcomeScore,
    note: row.scoreNote ?? "",
    overall: scored
      ? formatScore(
          averageScore({
            clarity: row.clarityScore,
            scope: row.scopeScore,
            evidence: row.evidenceScore,
            outcome: row.outcomeScore,
          }),
        )
      : null,
  };
}

async function refreshRow(row: StoredRow, pullRequests: PullRequestCheck): Promise<StoredRow> {
  const validated = await pullRequests.validatePullRequestUrl(row.githubPrUrl);
  if (!validated.ok) {
    return row;
  }

  try {
    return await db.mentorRaisedPullRequest.update({
      where: { id: row.id },
      data: snapshot(validated.data.pullRequest, new Date()),
      select: rowSelect,
    });
  } catch (error) {
    logError("raised_pull_request_refresh_failed", { name: error instanceof Error ? error.name : "Error" });
    return row;
  }
}

export async function listMentorRaisedPullRequests(
  actorId: string,
  pullRequests: PullRequestCheck = defaultGitHub,
): Promise<MentorSuccess<RaisedPullRequestView[]> | MentorError> {
  const actor = await requireMentorActor(actorId);
  if (!actor.ok) {
    return actor;
  }

  const rows = await db.mentorRaisedPullRequest.findMany({
    where: { mentorId: actor.data.mentorId },
    orderBy: { createdAt: "desc" },
    select: rowSelect,
  });
  const refreshed = await Promise.all(rows.map((row) => refreshRow(row, pullRequests)));
  return { ok: true, data: refreshed.map((row) => toView(row)) };
}

export async function submitMentorRaisedPullRequest(
  actorId: string,
  input: { organisationId: string; pullRequestUrl: string },
  pullRequests: PullRequestCheck = defaultGitHub,
): Promise<MentorSuccess<{ id: string }> | MentorError> {
  const actor = await requireMentorActor(actorId);
  if (!actor.ok) {
    return actor;
  }

  const parsed = raisedPullRequestSchema.safeParse(input);
  if (!parsed.success) {
    return mentorInvalid("Check the pull request.", toFieldErrors(parsed.error));
  }

  const mentor = await db.mentorProfile.findUnique({
    where: { id: actor.data.mentorId },
    select: {
      id: true,
      approvalStatus: true,
      user: { select: { githubAccount: { select: { username: true } } } },
    },
  });
  if (!mentor || mentor.approvalStatus !== "APPROVED") {
    return mentorInvalid("An approved mentor account is required before submitting a pull request.");
  }

  const username = mentor.user.githubAccount?.username;
  if (!username) {
    return mentorInvalid("Link a GitHub username before submitting a pull request.");
  }

  const organisation = await db.organisation.findFirst({
    where: {
      id: parsed.data.organisationId,
      approved: true,
      mentorAssignments: { some: { mentorId: mentor.id } },
    },
    select: { id: true, repositoryUrl: true },
  });
  if (!organisation) {
    return mentorInvalid("Choose an approved organisation assigned to you.", {
      organisationId: ["Choose an approved organisation assigned to you."],
    });
  }

  const account = githubAccountFromRepositoryUrl(organisation.repositoryUrl);
  const canonical = canonicalSubmission(parsed.data.pullRequestUrl);
  if (!account || !canonical || canonical.repository.split("/")[0] !== account) {
    return mentorInvalid("Submit a pull request from the selected organisation's GitHub account.", {
      pullRequestUrl: ["Submit a pull request from the selected organisation's GitHub account."],
    });
  }

  const validated = await pullRequests.validatePullRequestUrl(parsed.data.pullRequestUrl);
  if (!validated.ok) {
    if (validated.code === "invalid_url" || validated.code === "not_found") {
      return mentorInvalid(validated.message, { pullRequestUrl: [validated.message] });
    }
    return mentorInvalid(validated.message);
  }

  if (!pullRequestAuthorMatches(validated.data.pullRequest.authorLogin, username)) {
    return mentorInvalid("Submit a pull request opened by your linked GitHub account.", {
      pullRequestUrl: ["Submit a pull request opened by your linked GitHub account."],
    });
  }

  try {
    const created = await db.mentorRaisedPullRequest.create({
      data: {
        mentorId: mentor.id,
        organisationId: organisation.id,
        githubPrUrl: canonical.url,
        repository: canonical.repository,
        number: canonical.number,
        ...snapshot(validated.data.pullRequest, new Date()),
      },
      select: { id: true },
    });
    return { ok: true, data: { id: created.id } };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return duplicateUrl;
    }
    logError("raised_pull_request_submit_failed", { name: error instanceof Error ? error.name : "Error" });
    return mentorInvalid("The pull request could not be submitted.");
  }
}

export async function loadRaisedPullRequestRows(pullRequests: PullRequestCheck = defaultGitHub) {
  const rows = await db.mentorRaisedPullRequest.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      ...rowSelect,
      mentor: { select: { user: { select: { firstName: true, lastName: true } } } },
    },
  });
  return Promise.all(
    rows.map(async (row) => {
      const refreshed = await refreshRow(row, pullRequests);
      return {
        ...toView(refreshed),
        mentorName: `${row.mentor.user.firstName} ${row.mentor.user.lastName}`,
      };
    }),
  );
}

export async function refreshRaisedPullRequest(
  id: string,
  pullRequests: PullRequestCheck = defaultGitHub,
): Promise<boolean> {
  const row = await db.mentorRaisedPullRequest.findUnique({ where: { id }, select: rowSelect });
  if (!row) {
    return false;
  }
  const refreshed = await refreshRow(row, pullRequests);
  return refreshed.fetchedAt.getTime() !== row.fetchedAt.getTime();
}
