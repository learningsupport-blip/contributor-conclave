-- Student tech interests and projects they start working on.
CREATE TABLE "student_tech_interests" (
    "student_id" UUID NOT NULL,
    "technology" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_tech_interests_pkey" PRIMARY KEY ("student_id", "technology")
);

CREATE TABLE "student_project_work" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_project_work_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "student_project_work_student_id_project_id_key" ON "student_project_work"("student_id", "project_id");
CREATE INDEX "student_project_work_project_id_idx" ON "student_project_work"("project_id");

ALTER TABLE "student_tech_interests" ADD CONSTRAINT "student_tech_interests_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_project_work" ADD CONSTRAINT "student_project_work_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_project_work" ADD CONSTRAINT "student_project_work_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
