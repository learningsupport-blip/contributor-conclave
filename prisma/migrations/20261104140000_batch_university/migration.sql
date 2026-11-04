-- A batch belongs to one university. The same year may exist at different universities.
ALTER TABLE "batches" ADD COLUMN "university_id" UUID;

DROP INDEX "batches_year_key";

CREATE UNIQUE INDEX "batches_university_id_year_key" ON "batches"("university_id", "year");
CREATE INDEX "batches_university_id_idx" ON "batches"("university_id");

ALTER TABLE "batches" ADD CONSTRAINT "batches_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
