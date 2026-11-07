CREATE TABLE "analysis_service_configs" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "quality" BOOLEAN NOT NULL DEFAULT true,
    "merge_readiness" BOOLEAN NOT NULL DEFAULT true,
    "checks" BOOLEAN NOT NULL DEFAULT true,
    "coaching" BOOLEAN NOT NULL DEFAULT true,
    "suggest_scores" BOOLEAN NOT NULL DEFAULT true,
    "issue_match" INTEGER NOT NULL DEFAULT 4,
    "file_match" INTEGER NOT NULL DEFAULT 4,
    "description_weight" INTEGER NOT NULL DEFAULT 2,
    "checks_weight" INTEGER NOT NULL DEFAULT 6,
    "size_weight" INTEGER NOT NULL DEFAULT 4,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analysis_service_configs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "analysis_service_configs_weights_check" CHECK (
        "issue_match" BETWEEN 0 AND 10
        AND "file_match" BETWEEN 0 AND 10
        AND "description_weight" BETWEEN 0 AND 10
        AND "checks_weight" BETWEEN 0 AND 10
        AND "size_weight" BETWEEN 0 AND 10
    )
);
