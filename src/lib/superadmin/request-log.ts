import "server-only";

import type { Prisma } from "@/generated/prisma/client";

import { db } from "@/lib/db";
import { logError } from "@/lib/log";
import type { AdminError, AdminSuccess } from "@/lib/admin/access";
import { requireSuperAdminActor } from "@/lib/superadmin/access";
import {
  APPLICATION_LOG_ACTIVE_MS,
  APPLICATION_LOG_DAY_MS,
  APPLICATION_LOG_RETENTION_MS,
  AREA_LABELS,
  LOG_AREAS,
  LOG_ROLES,
  ROLE_LABELS,
  TIME_WINDOWS,
  activityHours,
  areasMatchingSearch,
  classifyRequest,
  durationMs,
  safeRequestPath,
  sanitizeMethod,
  type LogArea,
  type LogQuery,
  type LogRole,
  type LogsDashboard,
} from "@/lib/superadmin/request-log-model";

type Actor = {
  id: string;
  role: LogRole;
  firstName: string;
  lastName: string;
  email: string;
};

export async function recordObservedRequest(input: {
  path: string;
  method: string;
  startedAt: number;
  statusCode: number;
  user: Actor | null;
  actorName?: string;
  actorEmail?: string;
  operation?: string;
  area?: LogArea;
}): Promise<void> {
  const path = safeRequestPath(input.path);
  const classified = classifyRequest(path);
  const actorName = (input.actorName ?? (input.user ? `${input.user.firstName} ${input.user.lastName}` : "Guest")).slice(0, 120);
  const actorEmail = (input.actorEmail ?? input.user?.email ?? "").slice(0, 200);

  try {
    await db.applicationRequestLog.create({
      data: {
        userId: input.user?.id,
        actorName,
        actorEmail,
        role: input.user?.role ?? null,
        operation: (input.operation ?? classified.operation).slice(0, 160),
        area: input.area ?? classified.area,
        method: sanitizeMethod(input.method),
        path: path.startsWith("/") ? path : `/${path}`,
        statusCode: input.statusCode,
        durationMs: durationMs(input.startedAt),
      },
    });
  } catch (error) {
    const name = error instanceof Error ? error.name : "Error";
    logError("application_request_log_failed", { name });
  }
}

function activityWhere(query: LogQuery, since: Date): Prisma.ApplicationRequestLogWhereInput {
  const where: Prisma.ApplicationRequestLogWhereInput = { createdAt: { gte: since } };
  if (query.role !== "all") {
    where.role = query.role;
  }
  if (query.area !== "all") {
    where.area = query.area;
  }
  if (query.outcome === "ok") {
    where.statusCode = { lt: 400 };
  }
  if (query.outcome === "failed") {
    where.statusCode = { gte: 400 };
  }
  if (query.method !== "all") {
    where.method = query.method;
  }
  if (query.slow) {
    where.durationMs = { gte: 1000 };
  }
  if (query.search) {
    const areas = areasMatchingSearch(query.search);
    where.OR = [
      { actorName: { contains: query.search, mode: "insensitive" } },
      { actorEmail: { contains: query.search, mode: "insensitive" } },
      { operation: { contains: query.search, mode: "insensitive" } },
      { path: { contains: query.search, mode: "insensitive" } },
      ...(areas.length > 0 ? [{ area: { in: areas } }] : []),
    ];
  }
  return where;
}

export async function loadApplicationLogs(
  actorId: string,
  query: LogQuery,
  now = new Date(),
): Promise<AdminSuccess<LogsDashboard> | AdminError> {
  const actor = await requireSuperAdminActor(actorId);
  if (!actor.ok) {
    return actor;
  }

  const cutoff = new Date(now.getTime() - APPLICATION_LOG_RETENTION_MS);
  await db.applicationRequestLog.deleteMany({ where: { createdAt: { lt: cutoff } } });

  const since24h = new Date(now.getTime() - APPLICATION_LOG_DAY_MS);
  const since15m = new Date(now.getTime() - APPLICATION_LOG_ACTIVE_MS);
  const sinceWindow = new Date(now.getTime() - TIME_WINDOWS[query.window]);
  const where = activityWhere(query, sinceWindow);

  const [recent, activeUsers, roleCounts, areaCounts, total, failed, average] = await Promise.all([
    db.applicationRequestLog.findMany({
      where: { createdAt: { gte: since24h } },
      select: { createdAt: true, userId: true, statusCode: true, durationMs: true },
    }),
    db.applicationRequestLog.findMany({
      where: { createdAt: { gte: since15m }, userId: { not: null } },
      distinct: ["userId"],
      select: { userId: true },
    }),
    db.user.groupBy({ by: ["role"], _count: { _all: true } }),
    db.applicationRequestLog.groupBy({
      by: ["area"],
      where: { createdAt: { gte: since24h } },
      _count: { _all: true },
    }),
    db.applicationRequestLog.count({ where }),
    db.applicationRequestLog.count({ where: { AND: [where, { statusCode: { gte: 400 } }] } }),
    db.applicationRequestLog.aggregate({ where, _avg: { durationMs: true } }),
  ]);

  const pages = Math.max(1, Math.ceil(total / query.pageSize));
  const page = Math.min(query.page, pages);
  const rows = await db.applicationRequestLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * query.pageSize,
    take: query.pageSize,
  });

  const hours = activityHours(recent, now);
  const requests24h = recent.length;
  const errors24h = recent.filter((row) => row.statusCode >= 400).length;
  const average24h = requests24h === 0 ? 0 : recent.reduce((sum, row) => sum + row.durationMs, 0) / requests24h;

  return {
    ok: true,
    data: {
      updatedAt: now.toISOString(),
      performance: {
        activeNow: activeUsers.length,
        requests24h,
        errors24h,
        errorRate: requests24h === 0 ? 0 : (errors24h / requests24h) * 100,
        averageMs: average24h,
      },
      hours: hours.series,
      peak: hours.peak,
      roles: LOG_ROLES.map((role) => ({
        role,
        name: ROLE_LABELS[role],
        count: roleCounts.find((row) => row.role === role)?._count._all ?? 0,
      })),
      areas: LOG_AREAS.flatMap((area) => {
        const count = areaCounts.find((row) => row.area === area)?._count._all ?? 0;
        return count > 0 ? [{ area, label: AREA_LABELS[area], count }] : [];
      }),
      activity: {
        total,
        failed,
        averageMs: average._avg.durationMs ?? 0,
        page,
        pageSize: query.pageSize,
        rows: rows.map((row) => ({
          id: row.id,
          createdAt: row.createdAt.toISOString(),
          actorName: row.actorName,
          actorEmail: row.actorEmail,
          role: row.role,
          operation: row.operation,
          area: row.area,
          areaLabel: AREA_LABELS[row.area],
          method: row.method,
          path: row.path,
          statusCode: row.statusCode,
          durationMs: row.durationMs,
        })),
      },
    },
  };
}
