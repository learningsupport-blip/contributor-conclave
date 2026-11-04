-- Projects created from Resource Management.
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "organisation_id" UUID NOT NULL,
    "program" TEXT NOT NULL,
    "website_url" TEXT NOT NULL,
    "repository_url" TEXT NOT NULL,
    "technologies" TEXT[] NOT NULL,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "projects_organisation_id_idx" ON "projects"("organisation_id");
CREATE INDEX "projects_created_by_id_idx" ON "projects"("created_by_id");
CREATE INDEX "projects_created_at_idx" ON "projects"("created_at");

ALTER TABLE "projects" ADD CONSTRAINT "projects_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
