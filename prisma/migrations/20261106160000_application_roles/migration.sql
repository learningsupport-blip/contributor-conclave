-- Custom roles grant a chosen set of screens to application users.
CREATE TABLE "application_roles" (
    "id" UUID NOT NULL,
    "name" CITEXT NOT NULL,
    "screens" TEXT[] NOT NULL,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_roles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "application_roles_name_key" ON "application_roles"("name");
CREATE INDEX "application_roles_created_by_id_idx" ON "application_roles"("created_by_id");

ALTER TABLE "users" ADD COLUMN "application_role_id" UUID;

CREATE INDEX "users_application_role_id_idx" ON "users"("application_role_id");

ALTER TABLE "application_roles" ADD CONSTRAINT "application_roles_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_application_role_id_fkey" FOREIGN KEY ("application_role_id") REFERENCES "application_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
