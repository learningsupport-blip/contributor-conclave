import { describe, expect, it } from "vitest";

import {
  activityHours,
  classifyRequest,
  durationMs,
  formatDuration,
  parseLogQuery,
  safeRequestPath,
  shouldRecordRequest,
} from "@/lib/superadmin/request-log-model";

describe("application log model", () => {
  it("drops query strings so a token cannot be stored", () => {
    expect(safeRequestPath("/superadmin/users?token=secret&q=1")).toBe("/superadmin/users");
  });

  it("names the screen from the path", () => {
    expect(classifyRequest("/superadmin/users")).toEqual({
      area: "ACCESS",
      operation: "Viewed users",
    });
    expect(classifyRequest("/student/submissions/123")).toEqual({
      area: "SUBMISSIONS",
      operation: "Viewed submissions",
    });
    expect(classifyRequest("/login")).toEqual({ area: "AUTH", operation: "Viewed sign in" });
  });

  it("skips prefetches, server actions, and the logs poll", () => {
    expect(shouldRecordRequest({ path: "/superadmin/users", prefetch: false, serverAction: false })).toBe(true);
    expect(shouldRecordRequest({ path: "/superadmin/users", prefetch: true, serverAction: false })).toBe(false);
    expect(shouldRecordRequest({ path: "/superadmin/users", prefetch: false, serverAction: true })).toBe(false);
    expect(shouldRecordRequest({ path: "/api/superadmin/logs", prefetch: false, serverAction: false })).toBe(false);
  });

  it("keeps the last seven days and a page of 25 unless the query says otherwise", () => {
    expect(parseLogQuery({})).toMatchObject({ window: "7d", pageSize: 25, role: "all", slow: false });
    expect(parseLogQuery({ time: "15m", role: "MENTOR", slow: "1", show: "50", outcome: "failed" })).toMatchObject({
      window: "15m",
      role: "MENTOR",
      slow: true,
      pageSize: 50,
      outcome: "failed",
    });
  });

  it("counts distinct people per IST hour and ignores guests", () => {
    const now = new Date("2026-10-11T15:30:00.000Z");
    const result = activityHours(
      [
        { createdAt: new Date("2026-10-11T14:10:00.000Z"), userId: "a" },
        { createdAt: new Date("2026-10-11T14:40:00.000Z"), userId: "a" },
        { createdAt: new Date("2026-10-11T14:50:00.000Z"), userId: "b" },
        { createdAt: new Date("2026-10-11T14:20:00.000Z"), userId: null },
      ],
      now,
    );

    const twenty = result.series.find((point) => point.label === "20:00");
    expect(twenty?.count).toBe(2);
    expect(result.peak).toEqual({ count: 2, label: "20:00" });
    expect(result.series).toHaveLength(24);
  });

  it("formats durations and caps a clock glitch", () => {
    expect(formatDuration(840)).toBe("840 ms");
    expect(formatDuration(2400)).toBe("2.4 s");
    expect(durationMs(1_000, 1_000 + 200_000)).toBe(120_000);
  });
});
