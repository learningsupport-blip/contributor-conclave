import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ANALYSIS_SERVICE_ID, DEFAULT_ANALYSIS_SETTINGS } from "@/lib/superadmin/analysis-rubric";
import { getAnalysisServiceSettings, saveAnalysisServiceSettings } from "@/lib/superadmin/analysis-service-settings";
import { db } from "@/lib/db";
import { insertUser, removeFixtures } from "@/test/fixtures";

const domain = "@analysis-settings.example";

let superadminId = "";
let adminId = "";

beforeAll(async () => {
  await removeFixtures(domain, "Analysis settings ");
  const superadmin = await insertUser({
    role: "SUPERADMIN",
    email: `root${domain}`,
    firstName: "Root",
    lastName: "Admin",
  });
  const admin = await insertUser({
    role: "ADMIN",
    email: `admin${domain}`,
    firstName: "Ada",
    lastName: "Admin",
  });
  superadminId = superadmin.id;
  adminId = admin.id;
});

afterAll(async () => {
  await db.analysisServiceConfig.deleteMany({ where: { id: ANALYSIS_SERVICE_ID } });
  await removeFixtures(domain, "Analysis settings ");
});

describe("analysis service settings", () => {
  it("lets a super admin change the switches and refuses an admin", async () => {
    const initial = await getAnalysisServiceSettings(superadminId);
    expect(initial.ok && initial.data.enabled).toBe(true);

    const denied = await saveAnalysisServiceSettings(adminId, { ...DEFAULT_ANALYSIS_SETTINGS, enabled: false });
    expect(denied.ok).toBe(false);

    const saved = await saveAnalysisServiceSettings(superadminId, {
      ...DEFAULT_ANALYSIS_SETTINGS,
      enabled: false,
      aspects: { ...DEFAULT_ANALYSIS_SETTINGS.aspects, checks: false },
    });
    expect(saved.ok).toBe(true);

    const stored = await getAnalysisServiceSettings(superadminId);
    expect(stored.ok && stored.data.enabled).toBe(false);
    expect(stored.ok && stored.data.aspects.checks).toBe(false);

    await saveAnalysisServiceSettings(superadminId, DEFAULT_ANALYSIS_SETTINGS);
  });
});
