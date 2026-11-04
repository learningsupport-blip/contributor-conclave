import { after } from "next/server";
import { headers } from "next/headers";

import type { PublicUser } from "@/lib/auth/types";
import { shouldRecordRequest } from "@/lib/superadmin/request-log-model";
import { recordObservedRequest } from "@/lib/superadmin/request-log";

export async function RequestRecorder({ user }: { user: PublicUser | null }) {
  const headerList = await headers();
  const path = headerList.get("x-cc-path");
  if (!path) {
    return null;
  }

  const record = shouldRecordRequest({
    path,
    prefetch: headerList.get("next-router-prefetch") === "1" || headerList.get("purpose") === "prefetch",
    serverAction: headerList.has("next-action"),
  });
  if (!record) {
    return null;
  }

  const method = headerList.get("x-cc-method") ?? "GET";
  const startedAt = Number(headerList.get("x-cc-start"));
  const actor = user;

  after(() =>
    recordObservedRequest({
      path,
      method,
      startedAt,
      statusCode: 200,
      user: actor,
    }),
  );

  return null;
}
