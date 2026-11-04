import { db } from "@/lib/db";
import { adminInvalid, type AdminError, type AdminSuccess } from "@/lib/admin/access";

export async function requireSuperAdminActor(
  userId: string,
): Promise<AdminSuccess<{ id: string }> | AdminError> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, deactivatedAt: true },
  });

  if (!user) {
    return { ok: false, code: "unauthenticated", message: "Authentication required." };
  }

  if (user.role !== "SUPERADMIN" || user.deactivatedAt) {
    return { ok: false, code: "forbidden", message: "You do not have access to this resource." };
  }

  return { ok: true, data: { id: user.id } };
}

export { adminInvalid };
