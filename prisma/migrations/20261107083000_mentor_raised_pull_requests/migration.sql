-- Mentors submit pull requests they raised in an assigned organisation. A super admin scores each one.
CREATE TABLE "mentor_raised_pull_requests" (
    "id" UUID NOT NULL,
    "mentor_id" UUID NOT NULL,
    "organisation_id" UUID NOT NULL,
    "github_pr_url" TEXT NOT NULL,
    "repository" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "merged" BOOLEAN NOT NULL,
    "draft" BOOLEAN NOT NULL,
    "author_login" TEXT NOT NULL,
    "additions" INTEGER,
    "deletions" INTEGER,
    "changed_files" INTEGER,
    "commits" INTEGER,
    "github_created_at" TIMESTAMP(3) NOT NULL,
    "github_updated_at" TIMESTAMP(3) NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL,
    "clarity_score" INTEGER,
    "scope_score" INTEGER,
    "evidence_score" INTEGER,
    "outcome_score" INTEGER,
    "score_note" TEXT,
    "scored_by_id" UUID,
    "scored_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentor_raised_pull_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "mentor_raised_pull_requests_github_pr_url_key" ON "mentor_raised_pull_requests"("github_pr_url");
CREATE INDEX "mentor_raised_pull_requests_mentor_id_created_at_idx" ON "mentor_raised_pull_requests"("mentor_id", "created_at");
CREATE INDEX "mentor_raised_pull_requests_organisation_id_idx" ON "mentor_raised_pull_requests"("organisation_id");
CREATE INDEX "mentor_raised_pull_requests_scored_by_id_idx" ON "mentor_raised_pull_requests"("scored_by_id");

ALTER TABLE "mentor_raised_pull_requests" ADD CONSTRAINT "mentor_raised_pull_requests_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "mentor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mentor_raised_pull_requests" ADD CONSTRAINT "mentor_raised_pull_requests_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "mentor_raised_pull_requests" ADD CONSTRAINT "mentor_raised_pull_requests_scored_by_id_fkey" FOREIGN KEY ("scored_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "mentor_raised_pull_requests" ADD CONSTRAINT "mentor_raised_pull_requests_scores_check" CHECK (
    (
        "clarity_score" IS NULL
        AND "scope_score" IS NULL
        AND "evidence_score" IS NULL
        AND "outcome_score" IS NULL
        AND "scored_at" IS NULL
    )
    OR (
        "clarity_score" BETWEEN 0 AND 10
        AND "scope_score" BETWEEN 0 AND 10
        AND "evidence_score" BETWEEN 0 AND 10
        AND "outcome_score" BETWEEN 0 AND 10
        AND "scored_by_id" IS NOT NULL
        AND "scored_at" IS NOT NULL
    )
);
