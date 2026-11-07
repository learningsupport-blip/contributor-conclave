export const ANALYSIS_SERVICE_ID = "pr-analysis";

export type AnalysisRubric = {
  aspects: {
    quality: boolean;
    mergeReadiness: boolean;
    checks: boolean;
    coaching: boolean;
  };
  suggestScores: boolean;
  weights: {
    issueMatch: number;
    fileMatch: number;
    description: number;
    checks: number;
    size: number;
  };
};

export type AnalysisServiceSettings = AnalysisRubric & { enabled: boolean };

export const DEFAULT_ANALYSIS_SETTINGS: AnalysisServiceSettings = {
  enabled: true,
  aspects: { quality: true, mergeReadiness: true, checks: true, coaching: true },
  suggestScores: true,
  weights: { issueMatch: 4, fileMatch: 4, description: 2, checks: 6, size: 4 },
};

function flagged(value: string | undefined): boolean {
  return value === "true";
}

function weight(value: string | undefined): number | null {
  if (!value || !/^\d{1,2}$/.test(value)) {
    return null;
  }
  const parsed = Number(value);
  return parsed <= 10 ? parsed : null;
}

export function parseAnalysisServiceForm(input: Record<string, string | undefined>): AnalysisServiceSettings | null {
  const issueMatch = weight(input.issueMatch);
  const fileMatch = weight(input.fileMatch);
  const description = weight(input.description);
  const checks = weight(input.checksWeight);
  const size = weight(input.size);
  if (issueMatch === null || fileMatch === null || description === null || checks === null || size === null) {
    return null;
  }

  return {
    enabled: flagged(input.enabled),
    suggestScores: flagged(input.suggestScores),
    aspects: {
      quality: flagged(input.quality),
      mergeReadiness: flagged(input.mergeReadiness),
      checks: flagged(input.checks),
      coaching: flagged(input.coaching),
    },
    weights: { issueMatch, fileMatch, description, checks, size },
  };
}
