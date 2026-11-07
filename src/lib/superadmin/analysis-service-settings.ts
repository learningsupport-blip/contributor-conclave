import type { AdminError, AdminSuccess } from "@/lib/admin/access";
import { db } from "@/lib/db";
import { logError } from "@/lib/log";
import {
  ANALYSIS_SERVICE_ID,
  DEFAULT_ANALYSIS_SETTINGS,
  type AnalysisServiceSettings,
} from "@/lib/superadmin/analysis-rubric";
import { adminInvalid, requireSuperAdminActor } from "@/lib/superadmin/access";

const select = {
  enabled: true,
  quality: true,
  mergeReadiness: true,
  checks: true,
  coaching: true,
  suggestScores: true,
  issueMatch: true,
  fileMatch: true,
  descriptionWeight: true,
  checksWeight: true,
  sizeWeight: true,
} as const;

function toSettings(row: {
  enabled: boolean;
  quality: boolean;
  mergeReadiness: boolean;
  checks: boolean;
  coaching: boolean;
  suggestScores: boolean;
  issueMatch: number;
  fileMatch: number;
  descriptionWeight: number;
  checksWeight: number;
  sizeWeight: number;
}): AnalysisServiceSettings {
  return {
    enabled: row.enabled,
    suggestScores: row.suggestScores,
    aspects: {
      quality: row.quality,
      mergeReadiness: row.mergeReadiness,
      checks: row.checks,
      coaching: row.coaching,
    },
    weights: {
      issueMatch: row.issueMatch,
      fileMatch: row.fileMatch,
      description: row.descriptionWeight,
      checks: row.checksWeight,
      size: row.sizeWeight,
    },
  };
}

export async function getAnalysisServiceSettings(
  actorId: string,
): Promise<AdminSuccess<AnalysisServiceSettings> | AdminError> {
  const actor = await requireSuperAdminActor(actorId, "services");
  if (!actor.ok) {
    return actor;
  }

  const row = await db.analysisServiceConfig.findUnique({ where: { id: ANALYSIS_SERVICE_ID }, select });
  return { ok: true, data: row ? toSettings(row) : DEFAULT_ANALYSIS_SETTINGS };
}

export async function analysisRubricForReview(): Promise<AnalysisServiceSettings> {
  const row = await db.analysisServiceConfig.findUnique({ where: { id: ANALYSIS_SERVICE_ID }, select });
  return row ? toSettings(row) : DEFAULT_ANALYSIS_SETTINGS;
}

export async function saveAnalysisServiceSettings(
  actorId: string,
  settings: AnalysisServiceSettings,
): Promise<AdminSuccess<{ id: string }> | AdminError> {
  const actor = await requireSuperAdminActor(actorId, "services");
  if (!actor.ok) {
    return actor;
  }

  const data = {
    enabled: settings.enabled,
    quality: settings.aspects.quality,
    mergeReadiness: settings.aspects.mergeReadiness,
    checks: settings.aspects.checks,
    coaching: settings.aspects.coaching,
    suggestScores: settings.suggestScores,
    issueMatch: settings.weights.issueMatch,
    fileMatch: settings.weights.fileMatch,
    descriptionWeight: settings.weights.description,
    checksWeight: settings.weights.checks,
    sizeWeight: settings.weights.size,
  };

  try {
    await db.analysisServiceConfig.upsert({
      where: { id: ANALYSIS_SERVICE_ID },
      create: { id: ANALYSIS_SERVICE_ID, ...data },
      update: data,
    });
  } catch (error) {
    logError("analysis_service_settings_failed", { name: error instanceof Error ? error.name : "Error" });
    return adminInvalid("The analysis settings could not be saved.");
  }

  return { ok: true, data: { id: ANALYSIS_SERVICE_ID } };
}
