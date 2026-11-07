-- Mentors are not tied to a university or batch.
DROP INDEX "mentor_profiles_batch_idx";

ALTER TABLE "mentor_profiles" DROP COLUMN "batch";
ALTER TABLE "mentor_profiles" DROP COLUMN "university_name";
