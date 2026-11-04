import "dotenv/config";

import { hashPassword } from "@/lib/auth/password";
import { db } from "@/lib/db";
import { logError } from "@/lib/log";

export const SUPERADMIN_EMAIL = "superadmin@contributor-conclave.com";

/** Creates the super admin once. A later start does not change the stored hash. */
export async function seedSuperAdmin() {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return;
  }

  const password = process.env.SUPERADMIN_PASSWORD?.trim();
  if (!password || !process.env.DATABASE_URL?.trim()) {
    return;
  }

  const existing = await db.user.findUnique({
    where: { email: SUPERADMIN_EMAIL },
    select: { id: true, role: true },
  });

  if (existing) {
    if (existing.role !== "SUPERADMIN") {
      logError("superadmin_seed_skipped", { reason: "email_taken" });
    }
    return;
  }

  const passwordHash = await hashPassword(password);
  await db.user.create({
    data: {
      role: "SUPERADMIN",
      firstName: "Super",
      lastName: "Admin",
      email: SUPERADMIN_EMAIL,
      passwordHash,
    },
  });
}
