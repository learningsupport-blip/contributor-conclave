-- Universities and batches a super admin offers on student registration.
CREATE TABLE "universities" (
    "id" UUID NOT NULL,
    "name" CITEXT NOT NULL,
    "location" TEXT NOT NULL,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "universities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "batches" (
    "id" UUID NOT NULL,
    "year" TEXT NOT NULL,
    "total_students" INTEGER NOT NULL,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "batches_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "universities_name_key" ON "universities"("name");
CREATE INDEX "universities_created_by_id_idx" ON "universities"("created_by_id");
CREATE UNIQUE INDEX "batches_year_key" ON "batches"("year");
CREATE INDEX "batches_created_by_id_idx" ON "batches"("created_by_id");

ALTER TABLE "student_profiles" ADD COLUMN "university_id" UUID,
ADD COLUMN "batch_id" UUID;

CREATE INDEX "student_profiles_university_id_idx" ON "student_profiles"("university_id");
CREATE INDEX "student_profiles_batch_id_idx" ON "student_profiles"("batch_id");

ALTER TABLE "universities" ADD CONSTRAINT "universities_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "batches" ADD CONSTRAINT "batches_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "batches" ADD CONSTRAINT "batches_total_students_check" CHECK ("total_students" > 0);
