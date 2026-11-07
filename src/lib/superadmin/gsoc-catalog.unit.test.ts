import { describe, expect, it } from "vitest";

import {
  GSOC_PAGE_SIZE,
  GSOC_REPOSITORY,
  gsocApprovalInput,
  latestGsocDataFile,
  pageOrganisations,
  parseGsocYear,
  withParticipationYears,
} from "@/lib/superadmin/gsoc-catalog";
import { loadGsocCatalog } from "@/lib/superadmin/gsoc-source";

const rawUrl = `https://raw.githubusercontent.com/${GSOC_REPOSITORY}/master/api/data/2026.json`;

const yearPayload = {
  year: 2026,
  organizations: [
    {
      name: "React Org",
      description: "Interface tools",
      url: "https://react.example",
      category: "Web",
      technologies: ["javascript", "reactjs"],
      ideas_url: "https://github.com/react-org/ideas",
    },
    {
      name: "Site Org",
      description: "Website only",
      url: "https://site.example",
      category: "Web",
      technologies: ["TypeScript"],
    },
    {
      name: "Python Org",
      description: "Scientific tools",
      url: "https://python.example",
      technologies: ["python"],
    },
    {
      name: "Broken Org",
      url: "not-a-url",
      technologies: ["react"],
    },
  ],
};

describe("GSoC organisation catalog", () => {
  it("chooses the latest year file from the repository listing", () => {
    const file = latestGsocDataFile([
      { name: "2025.json", type: "file", download_url: rawUrl.replace("2026", "2025") },
      { name: "2026.json", type: "file", download_url: rawUrl },
      { name: "notes.json", type: "file", download_url: "https://example.com/notes.json" },
    ]);
    expect(file).toEqual({ year: 2026, downloadUrl: rawUrl });
  });

  it("maps known tech stacks and keeps a GitHub URL when one is published", () => {
    const catalog = parseGsocYear(yearPayload, 2026);
    expect(catalog?.organisations.map((organisation) => organisation.name)).toEqual([
      "Python Org",
      "React Org",
      "Site Org",
    ]);
    const react = catalog?.organisations.find((organisation) => organisation.name === "React Org");
    expect(react?.technologies).toEqual(["React", "Javascript"]);
    expect(react?.codeRepositoryUrl).toBe("https://github.com/react-org/ideas");
    expect(gsocApprovalInput(react!)).toMatchObject({
      program: "GSOC",
      technologies: ["React", "Javascript"],
      repositoryUrl: "https://github.com/react-org/ideas",
    });
  });

  it("approves a matching organisation with its website when no code host is published", () => {
    const catalog = parseGsocYear(yearPayload, 2026);
    const site = catalog?.organisations.find((organisation) => organisation.name === "Site Org");
    expect(gsocApprovalInput(site!)).toMatchObject({
      repositoryUrl: "https://site.example/",
      technologies: ["Typescript"],
    });
    const python = catalog?.organisations.find((organisation) => organisation.name === "Python Org");
    expect(gsocApprovalInput(python!)).toMatchObject({
      name: "Python Org",
      technologies: [],
      repositoryUrl: "https://python.example/",
    });
  });

  it("records every year the same organisation name appears", () => {
    const catalog = parseGsocYear(yearPayload, 2026);
    const merged = catalog
      ? withParticipationYears(catalog, [
          { year: 2026, names: ["React Org"] },
          { year: 2024, names: ["React Org"] },
          { year: 2018, names: ["react org"] },
        ])
      : null;
    expect(merged?.organisations.find((organisation) => organisation.name === "React Org")?.years).toEqual([
      2026, 2024, 2018,
    ]);
  });

  it("returns twelve organisations per page and keeps the requested page inside the result", () => {
    const organisations = Array.from({ length: 30 }, (_, index) => ({ name: `Org ${index + 1}` }));
    expect(pageOrganisations(organisations, 2, "").items).toHaveLength(GSOC_PAGE_SIZE);
    expect(pageOrganisations(organisations, 2, "").items[0]?.name).toBe("Org 13");
    expect(pageOrganisations(organisations, 99, "").page).toBe(3);
    expect(pageOrganisations(organisations, 1, "org 2").total).toBe(11);
  });

  it("rejects a year file that does not match the requested year", () => {
    expect(parseGsocYear(yearPayload, 2025)).toBeNull();
  });
});

describe("GSoC organisation fetch", () => {
  it("reads the repository directory and downloads only the latest year file", async () => {
    const urls: string[] = [];
    const fetchImpl = async (input: RequestInfo | URL) => {
      const url = String(input);
      urls.push(url);
      if (url.endsWith("/contents/api/data")) {
        return Response.json([
          { name: "2025.json", type: "file", download_url: rawUrl.replace("2026", "2025") },
          { name: "2026.json", type: "file", download_url: rawUrl },
        ]);
      }
      if (url === rawUrl) {
        return Response.json(yearPayload);
      }
      return new Response("missing", { status: 404 });
    };

    const catalog = await loadGsocCatalog(fetchImpl);
    expect(catalog.ok).toBe(true);
    if (catalog.ok) {
      expect(catalog.data.year).toBe(2026);
      expect(catalog.data.organisations).toHaveLength(3);
    }
    expect(urls.some((url) => url.includes("2025.json"))).toBe(false);
    expect(urls.filter((url) => url === rawUrl)).toHaveLength(1);
  });

  it("reports a GitHub failure without reading a year file", async () => {
    const fetchImpl = async () => Response.json({ message: "Not Found" }, { status: 404 });
    const catalog = await loadGsocCatalog(fetchImpl);
    expect(catalog).toMatchObject({ ok: false, message: "GitHub could not find that resource." });
  });
});
