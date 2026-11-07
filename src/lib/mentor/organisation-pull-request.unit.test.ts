import { describe, expect, it } from "vitest";

import { pullRequestMatchesOrganisation } from "@/lib/mentor/organisation-pull-request";

describe("pull request organisation match", () => {
  it("uses the GitHub account on the repository link", () => {
    expect(
      pullRequestMatchesOrganisation({
        organisationName: "OWASP Foundation",
        websiteUrl: "https://owasp.org/",
        repositoryUrl: "https://github.com/kubernetes",
        repository: "owasp/owasp-java-encoder",
      }),
    ).toBe(false);
  });

  it("accepts the organisation website when no GitHub account is stored", () => {
    expect(
      pullRequestMatchesOrganisation({
        organisationName: "OWASP Foundation",
        websiteUrl: "https://owasp.org/",
        repositoryUrl: "https://owasp.org/",
        repository: "owasp/owasp-java-encoder",
      }),
    ).toBe(true);
  });

  it("rejects a pull request from a different account", () => {
    expect(
      pullRequestMatchesOrganisation({
        organisationName: "OWASP Foundation",
        websiteUrl: "https://owasp.org/",
        repositoryUrl: "https://owasp.org/",
        repository: "example/demo",
      }),
    ).toBe(false);
  });
});
