-- Optional so existing student profiles remain valid. New registrations always set it.
ALTER TABLE "student_profiles" ADD COLUMN "mobile_number" TEXT;
