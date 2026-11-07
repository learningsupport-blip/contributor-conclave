import { describe, expect, it } from "vitest";

import { parseAnalysisServiceForm } from "@/lib/superadmin/analysis-rubric";

describe("analysis service form", () => {
  it("reads switches and weights", () => {
    expect(
      parseAnalysisServiceForm({
        enabled: "true",
        quality: "true",
        mergeReadiness: undefined,
        checks: "true",
        coaching: undefined,
        suggestScores: "true",
        issueMatch: "4",
        fileMatch: "3",
        description: "2",
        checksWeight: "6",
        size: "1",
      }),
    ).toEqual({
      enabled: true,
      suggestScores: true,
      aspects: { quality: true, mergeReadiness: false, checks: true, coaching: false },
      weights: { issueMatch: 4, fileMatch: 3, description: 2, checks: 6, size: 1 },
    });
  });

  it("rejects a weight above 10", () => {
    expect(parseAnalysisServiceForm({ issueMatch: "11", fileMatch: "4", description: "2", checksWeight: "6", size: "4" })).toBeNull();
  });
});
