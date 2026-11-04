import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import { insertUser, removeFixtures } from "@/test/fixtures";
import { loadApplicationLogs, recordObservedRequest } from "@/lib/superadmin/request-log";
import { parseLogQuery } from "@/lib/superadmin/request-log-model";

const domain = "@request-log-test.example";

let superadminId = "";
let adminId = "";

beforeAll(async () => {
  await removeFixtures(domain, "Request log ");
  const superadmin = await insertUser({
    role: "SUPERADMIN",
    email: `root${domain}`,
    firstName: "Root",
    lastName: "Logger",
  });
  const admin = await insertUser({
    role: "ADMIN",
    email: `admin${domain}`,
    firstName: "Ada",
    lastName: "Logger",
  });
  superadminId = superadmin.id;
  adminId = admin.id;
});

afterAll(async () => {
  await removeFixtures(domain, "Request log ");
});

describe("application logs", () => {
  it("refuses an admin and lets the super admin read a recorded request", async () => {
    const denied = await loadApplicationLogs(adminId, parseLogQuery({}));
    expect(denied).toMatchObject({ ok: false, code: "forbidden" });

    await recordObservedRequest({
      path: "/superadmin/users?token=do-not-store",
      method: "GET",
      startedAt: Date.now() - 40,
      statusCode: 200,
      user: {
        id: superadminId,
        role: "SUPERADMIN",
        firstName: "Root",
        lastName: "Logger",
        email: `root${domain}`,
      },
      operation: "Fixture viewed users",
    });

    const result = await loadApplicationLogs(superadminId, parseLogQuery({ q: "Fixture viewed users" }));
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.data.activity.total).toBe(1);
    expect(result.data.activity.rows[0]).toMatchObject({
      operation: "Fixture viewed users",
      path: "/superadmin/users",
      statusCode: 200,
      area: "ACCESS",
      actorEmail: `root${domain}`,
    });
    expect(result.data.activity.rows[0]?.path.includes("token")).toBe(false);
  });

  it("drops a request older than seven days when the log is opened", async () => {
    await db.applicationRequestLog.create({
      data: {
        actorName: "Old Logger",
        actorEmail: `old${domain}`,
        operation: "Fixture old action",
        area: "OTHER",
        method: "GET",
        path: "/old",
        statusCode: 200,
        durationMs: 5,
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      },
    });

    await loadApplicationLogs(superadminId, parseLogQuery({}));
    const left = await db.applicationRequestLog.findFirst({ where: { operation: "Fixture old action" } });
    expect(left).toBeNull();
  });
});
