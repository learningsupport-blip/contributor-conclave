import { describe, expect, it } from "vitest";

import {
  averageScore,
  formatScore,
  parseRaisedPullRequestScores,
  raisedPullRequestStatus,
} from "@/lib/mentor/raised-pull-request-score";

describe("raised pull request scores", () => {
  it("accepts four scores from 0 to 10 and averages them", () => {
    const scores = parseRaisedPullRequestScores({ clarity: "8", scope: "6", evidence: "10", outcome: "4" });
    expect(scores).toEqual({ clarity: 8, scope: 6, evidence: 10, outcome: 4 });
    if (scores) {
      expect(averageScore(scores)).toBe(7);
      expect(formatScore(averageScore(scores))).toBe("7");
    }
    expect(formatScore(7.5)).toBe("7.5");
    expect(formatScore(7.25)).toBe("7.25");
    expect(parseRaisedPullRequestScores({ clarity: "11", scope: "1", evidence: "1", outcome: "1" })).toBeNull();
    expect(parseRaisedPullRequestScores({ clarity: "1.5", scope: "1", evidence: "1", outcome: "1" })).toBeNull();
  });

  it("names the GitHub state", () => {
    expect(raisedPullRequestStatus({ state: "open", merged: false, draft: false })).toBe("Open");
    expect(raisedPullRequestStatus({ state: "open", merged: false, draft: true })).toBe("Draft");
    expect(raisedPullRequestStatus({ state: "closed", merged: false, draft: false })).toBe("Closed");
    expect(raisedPullRequestStatus({ state: "closed", merged: true, draft: false })).toBe("Merged");
  });
});
