import { db } from "@/lib/db";
import { adminInvalid, type AdminError, type AdminSuccess } from "@/lib/admin/access";
import type { ApplicationScreenId } from "@/lib/superadmin/screens";

export async function requireSuperAdminActor(
  userId: string,
  screen?: ApplicationScreenId,
): Promise<AdminSuccess<{ id: string }> | AdminError> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      deactivatedAt: true,
      applicationRole: { select: { screens: true } },
    },
  });

  if (!user) {
    return { ok: false, code: "unauthenticated", message: "Authentication required." };
  }

  if (user.deactivatedAt) {
    return { ok: false, code: "forbidden", message: "You do not have access to this resource." };
  }

  if (user.role === "SUPERADMIN" || (screen !== undefined && user.applicationRole?.screens.includes(screen))) {
    return { ok: true, data: { id: user.id } };
  }

  return { ok: false, code: "forbidden", message: "You do not have access to this resource." };
}

export { adminInvalid };
