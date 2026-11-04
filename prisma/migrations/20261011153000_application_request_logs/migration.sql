-- Application Logs records signed-in and sign-in requests for 7 days.
-- The row stores the path only. Query strings are removed before insert so tokens cannot land here.

CREATE TYPE "ApplicationArea" AS ENUM (
  'AUTH',
  'MENTORSHIP',
  'REVIEWS',
  'COLLABORATE',
  'STUDENT',
  'MENTOR',
  'SUBMISSIONS',
  'CHAT',
  'ADMIN',
  'ACCESS',
  'PROFILE',
  'OTHER'
);

CREATE TABLE "application_request_logs" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID,
    "actor_name" TEXT NOT NULL,
    "actor_email" TEXT NOT NULL,
    "role" "Role",
    "operation" TEXT NOT NULL,
    "area" "ApplicationArea" NOT NULL,
    "method" VARCHAR(8) NOT NULL,
    "path" VARCHAR(300) NOT NULL,
    "status_code" INTEGER NOT NULL,
    "duration_ms" INTEGER NOT NULL,

    CONSTRAINT "application_request_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "application_request_logs_created_at_idx" ON "application_request_logs"("created_at");
CREATE INDEX "application_request_logs_area_created_at_idx" ON "application_request_logs"("area", "created_at");
CREATE INDEX "application_request_logs_role_created_at_idx" ON "application_request_logs"("role", "created_at");
CREATE INDEX "application_request_logs_status_code_created_at_idx" ON "application_request_logs"("status_code", "created_at");

ALTER TABLE "application_request_logs" ADD CONSTRAINT "application_request_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
