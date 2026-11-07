-- A super admin assigns approved organisations to a mentor and can remove that assignment.
CREATE TABLE "mentor_organisations" (
    "mentor_id" UUID NOT NULL,
    "organisation_id" UUID NOT NULL,
    "assigned_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentor_organisations_pkey" PRIMARY KEY ("mentor_id","organisation_id")
);

CREATE INDEX "mentor_organisations_organisation_id_idx" ON "mentor_organisations"("organisation_id");
CREATE INDEX "mentor_organisations_assigned_by_id_idx" ON "mentor_organisations"("assigned_by_id");

ALTER TABLE "mentor_organisations" ADD CONSTRAINT "mentor_organisations_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "mentor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mentor_organisations" ADD CONSTRAINT "mentor_organisations_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "mentor_organisations" ADD CONSTRAINT "mentor_organisations_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
