-- Superadmin approval can be withdrawn without deleting the organisation.
ALTER TABLE "organisations" ADD COLUMN "approved" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "organisations_approved_idx" ON "organisations"("approved");
