import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { GitHubPullRequestDetails, GitHubResult, ValidatedPullRequest } from "@/lib/github/types";
import { db } from "@/lib/db";
import { listMentorRaisedPullRequests, submitMentorRaisedPullRequest } from "@/lib/mentor/raised-pull-requests";
import { assignMentorOrganisation } from "@/lib/superadmin/mentors";
import { listRaisedPullRequests, scoreRaisedPullRequest } from "@/lib/superadmin/raised-pull-requests";
import { insertUser, removeFixtures } from "@/test/fixtures";

const domain = "@raised-pr-test.example";
const pullUrl = "https://github.com/kubernetes/kubernetes/pull/10";

let superadminId = "";
let mentorId = "";
let organisationId = "";
let otherOrganisationId = "";
let merged = false;
const mentorLogin = `raiser-${randomUUID().slice(0, 8)}`;
let authorLogin = mentorLogin;

const pullRequest: GitHubPullRequestDetails = {
  number: 10,
  title: "Add a guide",
  body: "Explains the change",
  state: "open",
  draft: false,
  merged: false,
  htmlUrl: pullUrl,
  authorLogin: "mentor-raiser",
  headRef: "guide",
  baseRef: "main",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-02-01T00:00:00Z",
  commits: 2,
  additions: 20,
  deletions: 3,
  changedFiles: 4,
};

const checker = {
  async validatePullRequestUrl(): Promise<GitHubResult<ValidatedPullRequest>> {
    return {
      ok: true,
      data: {
        owner: "kubernetes",
        repo: "kubernetes",
        number: 10,
        url: pullUrl,
        pullRequest: { ...pullRequest, state: merged ? "closed" : "open", merged, authorLogin },
      },
    };
  },
};

beforeAll(async () => {
  await removeFixtures(domain, "Raised PR ");
  const superadmin = await insertUser({
    role: "SUPERADMIN",
    email: `root${domain}`,
    firstName: "Root",
    lastName: "Admin",
  });
  const mentor = await insertUser({
    role: "MENTOR",
    email: `mentor${domain}`,
    firstName: "Grace",
    lastName: "Hopper",
    employeeId: `EMP-${randomUUID()}`,
    githubUsername: mentorLogin,
    approvalStatus: "APPROVED",
  });
  const otherMentor = await insertUser({
    role: "MENTOR",
    email: `other${domain}`,
    firstName: "Other",
    lastName: "Mentor",
    employeeId: `EMP-${randomUUID()}`,
    githubUsername: "other-mentor",
    approvalStatus: "APPROVED",
  });
  superadminId = superadmin.id;
  mentorId = mentor.id;
  const organisation = await db.organisation.create({
    data: {
      name: `Kubernetes ${randomUUID()}`,
      program: "GSOC",
      websiteUrl: "https://kubernetes.io",
      repositoryUrl: "https://github.com/kubernetes",
      technologies: ["React"],
      approved: true,
      createdById: superadmin.id,
    },
  });
  const other = await db.organisation.create({
    data: {
      name: `Other ${randomUUID()}`,
      program: "GSOC",
      websiteUrl: "https://example.org",
      repositoryUrl: "https://github.com/other",
      technologies: ["Typescript"],
      approved: true,
      createdById: superadmin.id,
    },
  });
  organisationId = organisation.id;
  otherOrganisationId = other.id;
  await assignMentorOrganisation(superadminId, mentorId, organisationId);
  await assignMentorOrganisation(superadminId, otherMentor.id, other.id);
});

afterAll(async () => {
  await removeFixtures(domain, "Raised PR ");
});

describe("mentor raised pull requests", () => {
  it("stores the GitHub status and lets a super admin score it out of 10", async () => {
    const wrongOrganisation = await submitMentorRaisedPullRequest(
      mentorId,
      { organisationId: otherOrganisationId, pullRequestUrl: pullUrl },
      checker,
    );
    expect(wrongOrganisation.ok).toBe(false);

    authorLogin = "someone-else";
    const wrongAuthor = await submitMentorRaisedPullRequest(
      mentorId,
      { organisationId, pullRequestUrl: pullUrl },
      checker,
    );
    expect(wrongAuthor.ok).toBe(false);

    authorLogin = mentorLogin;
    const submitted = await submitMentorRaisedPullRequest(
      mentorId,
      { organisationId, pullRequestUrl: pullUrl },
      checker,
    );
    expect(submitted.ok).toBe(true);
    if (!submitted.ok) {
      return;
    }

    const duplicate = await submitMentorRaisedPullRequest(
      mentorId,
      { organisationId, pullRequestUrl: pullUrl },
      checker,
    );
    expect(duplicate.ok).toBe(false);

    const listed = await listMentorRaisedPullRequests(mentorId, checker);
    expect(listed.ok).toBe(true);
    if (listed.ok) {
      expect(listed.data[0]).toMatchObject({ status: "Open", overall: null, title: "Add a guide" });
    }

    const denied = await scoreRaisedPullRequest(mentorId, submitted.data.id, {
      clarity: "8",
      scope: "6",
      evidence: "10",
      outcome: "4",
      note: "Clear change",
    });
    expect(denied.ok).toBe(false);

    const invalid = await scoreRaisedPullRequest(superadminId, submitted.data.id, {
      clarity: "11",
      scope: "6",
      evidence: "10",
      outcome: "4",
      note: "",
    });
    expect(invalid.ok).toBe(false);

    const scored = await scoreRaisedPullRequest(superadminId, submitted.data.id, {
      clarity: "8",
      scope: "6",
      evidence: "10",
      outcome: "4",
      note: "Clear change",
    });
    expect(scored.ok).toBe(true);

    merged = true;
    const reviewed = await listRaisedPullRequests(superadminId, checker);
    expect(reviewed.ok).toBe(true);
    if (reviewed.ok) {
      expect(reviewed.data[0]).toMatchObject({
        status: "Merged",
        overall: "7",
        mentorName: "Grace Hopper",
        note: "Clear change",
      });
    }
  });
});
