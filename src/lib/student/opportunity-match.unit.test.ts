import { describe, expect, it } from "vitest";

import { matchingOrganisations, technologiesInUse, type OpportunityOrganisation } from "@/lib/student/opportunity-match";

const reactOrg: OpportunityOrganisation = {
  id: "org-react",
  name: "React Org",
  program: "GSOC",
  websiteUrl: "https://react.example",
  repositoryUrl: "https://github.com/react-org",
  technologies: ["React"],
  projects: [
    {
      id: "project-react",
      name: "Portal",
      program: "GSOC",
      websiteUrl: "https://react.example/portal",
      repositoryUrl: "https://github.com/react-org/portal",
      technologies: ["Typescript"],
    },
  ],
};

const nativeOrg: OpportunityOrganisation = {
  id: "org-native",
  name: "Native Org",
  program: "LFX",
  websiteUrl: "https://native.example",
  repositoryUrl: "https://gitlab.com/native-org",
  technologies: ["React-Native"],
  projects: [],
};

describe("student opportunity matching", () => {
  it("lists only technologies that an organisation or project uses", () => {
    expect(technologiesInUse([reactOrg, nativeOrg])).toEqual(["React", "React-Native", "Typescript"]);
  });

  it("suggests organisations whose own stack or a project stack overlaps the selection", () => {
    expect(matchingOrganisations([nativeOrg, reactOrg], ["Typescript"]).map((organisation) => organisation.id)).toEqual(["org-react"]);
    expect(matchingOrganisations([reactOrg, nativeOrg], ["React", "React-Native"]).map((organisation) => organisation.id)).toEqual([
      "org-native",
      "org-react",
    ]);
  });
});
