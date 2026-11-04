-- Organisations created from Resource Management.
CREATE TABLE "organisations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "program" TEXT NOT NULL,
    "website_url" TEXT NOT NULL,
    "repository_url" TEXT NOT NULL,
    "technologies" TEXT[] NOT NULL,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organisations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "organisations_created_by_id_idx" ON "organisations"("created_by_id");
CREATE INDEX "organisations_created_at_idx" ON "organisations"("created_at");

ALTER TABLE "organisations" ADD CONSTRAINT "organisations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
