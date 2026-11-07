import { httpUrl, organisationSchema, type OrganisationInput } from "@/lib/superadmin/organisation-validation";
import {
  ORGANISATION_TECHNOLOGIES,
  type OrganisationTechnology,
} from "@/lib/superadmin/organisation-options";

export const GSOC_REPOSITORY = "nishantwrp/gsoc-organizations";
export const GSOC_DATA_DIRECTORY = `/repos/${GSOC_REPOSITORY}/contents/api/data`;
export const GSOC_PAGE_SIZE = 12;

const TECHNOLOGY_ALIASES: Record<string, OrganisationTechnology> = {
  javascript: "Javascript",
  js: "Javascript",
  typescript: "Typescript",
  ts: "Typescript",
  react: "React",
  reactjs: "React",
  "react.js": "React",
  "react native": "React-Native",
  "react-native": "React-Native",
};

const looseApprovalSchema = organisationSchema.extend({
  repositoryUrl: httpUrl("a repository URL"),
});

export type GsocDataFile = {
  year: number;
  downloadUrl: string;
};

export type GsocCatalogItem = {
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  imageBackground: string;
  websiteUrl: string;
  codeRepositoryUrl: string;
  projectsUrl: string;
  ideasUrl: string;
  guideUrl: string;
  projectCount: number;
  topics: string[];
  years: number[];
  technologies: OrganisationTechnology[];
  sourceTechnologies: string[];
};

export type GsocYearAppearance = {
  year: number;
  names: string[];
};

export type GsocCatalog = {
  year: number;
  organisations: GsocCatalogItem[];
};

function text(value: unknown, max: number): string {
  if (typeof value !== "string") {
    return "";
  }
  const trimmed = value.trim();
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

export function httpAddress(value: unknown): string | null {
  const candidate = text(value, 300);
  if (!candidate) {
    return null;
  }
  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function isCodeHost(value: string): boolean {
  try {
    const host = new URL(value).hostname.replace(/^www\./, "");
    return host === "github.com" || host === "gitlab.com";
  } catch {
    return false;
  }
}

function codeHostAddress(value: unknown): string | null {
  const address = httpAddress(value);
  return address && isCodeHost(address) ? address : null;
}

export function mapGsocTechnologies(values: unknown): OrganisationTechnology[] {
  if (!Array.isArray(values)) {
    return [];
  }
  const found = new Set<OrganisationTechnology>();
  for (const value of values) {
    if (typeof value !== "string") {
      continue;
    }
    const mapped = TECHNOLOGY_ALIASES[value.trim().toLowerCase()];
    if (mapped) {
      found.add(mapped);
    }
  }
  return ORGANISATION_TECHNOLOGIES.map((technology) => technology.value).filter((technology) => found.has(technology));
}

function allowedDownload(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) {
      return null;
    }
    if (url.hostname !== "raw.githubusercontent.com") {
      return null;
    }
    if (!url.pathname.startsWith(`/${GSOC_REPOSITORY}/`)) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function gsocDataFiles(entries: unknown): GsocDataFile[] {
  if (!Array.isArray(entries)) {
    return [];
  }
  const files = entries.flatMap((entry) => {
    if (typeof entry !== "object" || !entry) {
      return [];
    }
    const record = entry as { name?: unknown; type?: unknown; download_url?: unknown };
    if (record.type !== "file" || typeof record.name !== "string") {
      return [];
    }
    const year = /^(\d{4})\.json$/.exec(record.name);
    const downloadUrl = allowedDownload(record.download_url);
    if (!year || !downloadUrl) {
      return [];
    }
    return [{ year: Number(year[1]), downloadUrl }];
  });
  files.sort((left, right) => right.year - left.year);
  return files;
}

export function latestGsocDataFile(entries: unknown): GsocDataFile | null {
  return gsocDataFiles(entries)[0] ?? null;
}

function hexColor(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }
  const color = value.trim();
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color) ? color : "";
}

function labels(values: unknown, limit: number): string[] {
  if (!Array.isArray(values)) {
    return [];
  }
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const label = text(value, 40);
    const key = label.toLowerCase();
    if (!label || seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(label);
    if (result.length === limit) {
      break;
    }
  }
  return result;
}

function codeRepository(record: { ideas_url?: unknown; guide_url?: unknown; projects?: unknown }): string {
  const direct = codeHostAddress(record.ideas_url) ?? codeHostAddress(record.guide_url);
  if (direct) {
    return direct;
  }
  if (!Array.isArray(record.projects)) {
    return "";
  }
  for (const project of record.projects) {
    if (typeof project !== "object" || !project) {
      continue;
    }
    const address = codeHostAddress((project as { code_url?: unknown }).code_url);
    if (address) {
      return address;
    }
  }
  return "";
}

export function parseGsocYear(payload: unknown, year: number): GsocCatalog | null {
  if (typeof payload !== "object" || !payload || !Array.isArray((payload as { organizations?: unknown }).organizations)) {
    return null;
  }
  const record = payload as { year?: unknown; organizations: unknown[] };
  if (record.year !== undefined && record.year !== year) {
    return null;
  }

  const seen = new Set<string>();
  const organisations: GsocCatalogItem[] = [];
  for (const entry of record.organizations) {
    if (typeof entry !== "object" || !entry) {
      continue;
    }
    const organisation = entry as {
      name?: unknown;
      description?: unknown;
      category?: unknown;
      image_url?: unknown;
      image_background_color?: unknown;
      url?: unknown;
      technologies?: unknown;
      topics?: unknown;
      ideas_url?: unknown;
      guide_url?: unknown;
      projects_url?: unknown;
      projects?: unknown;
      num_projects?: unknown;
    };
    const name = text(organisation.name, 120);
    const websiteUrl = httpAddress(organisation.url);
    const key = name.toLowerCase();
    if (!name || !websiteUrl || seen.has(key)) {
      continue;
    }
    seen.add(key);
    const projectCount = typeof organisation.num_projects === "number" && Number.isFinite(organisation.num_projects)
      ? Math.max(0, Math.trunc(organisation.num_projects))
      : Array.isArray(organisation.projects)
        ? organisation.projects.length
        : 0;
    organisations.push({
      name,
      description: text(organisation.description, 800),
      category: text(organisation.category, 80),
      imageUrl: httpAddress(organisation.image_url) ?? "",
      imageBackground: hexColor(organisation.image_background_color),
      websiteUrl,
      codeRepositoryUrl: codeRepository(organisation),
      projectsUrl: httpAddress(organisation.projects_url) ?? "",
      ideasUrl: httpAddress(organisation.ideas_url) ?? "",
      guideUrl: httpAddress(organisation.guide_url) ?? "",
      projectCount,
      topics: labels(organisation.topics, 16),
      years: [year],
      technologies: mapGsocTechnologies(organisation.technologies),
      sourceTechnologies: labels(organisation.technologies, 40),
    });
  }

  organisations.sort((left, right) => left.name.localeCompare(right.name));
  return { year, organisations };
}

export function gsocOrganisationNames(payload: unknown, year: number): string[] | null {
  if (typeof payload !== "object" || !payload || !Array.isArray((payload as { organizations?: unknown }).organizations)) {
    return null;
  }
  const record = payload as { year?: unknown; organizations: unknown[] };
  if (record.year !== undefined && record.year !== year) {
    return null;
  }
  const seen = new Set<string>();
  const names: string[] = [];
  for (const entry of record.organizations) {
    if (typeof entry !== "object" || !entry) {
      continue;
    }
    const name = text((entry as { name?: unknown }).name, 120);
    const key = name.toLowerCase();
    if (!name || seen.has(key)) {
      continue;
    }
    seen.add(key);
    names.push(name);
  }
  return names;
}

export function withParticipationYears(catalog: GsocCatalog, appearances: GsocYearAppearance[]): GsocCatalog {
  const byName = new Map<string, Set<number>>();
  for (const appearance of appearances) {
    for (const name of appearance.names) {
      const key = name.trim().toLowerCase();
      if (!key) {
        continue;
      }
      const years = byName.get(key) ?? new Set<number>();
      years.add(appearance.year);
      byName.set(key, years);
    }
  }

  return {
    ...catalog,
    organisations: catalog.organisations.map((organisation) => {
      const years = byName.get(organisation.name.toLowerCase()) ?? new Set<number>([catalog.year]);
      years.add(catalog.year);
      return { ...organisation, years: [...years].sort((left, right) => right - left) };
    }),
  };
}

export function pageOrganisations<T extends { name: string }>(
  organisations: T[],
  requestedPage: number,
  query: string,
): { items: T[]; page: number; pageSize: number; total: number } {
  const needle = query.trim().toLowerCase();
  const matched = needle
    ? organisations.filter((organisation) => organisation.name.toLowerCase().includes(needle))
    : organisations;
  const pages = Math.max(1, Math.ceil(matched.length / GSOC_PAGE_SIZE));
  const page = Math.min(Math.max(1, Math.trunc(requestedPage) || 1), pages);
  const start = (page - 1) * GSOC_PAGE_SIZE;
  return {
    items: matched.slice(start, start + GSOC_PAGE_SIZE),
    page,
    pageSize: GSOC_PAGE_SIZE,
    total: matched.length,
  };
}

export function gsocApprovalInput(item: GsocCatalogItem): (Omit<OrganisationInput, "technologies"> & { technologies: string[] }) | null {
  const candidate = {
    name: item.name,
    program: "GSOC",
    websiteUrl: item.websiteUrl,
    repositoryUrl: item.codeRepositoryUrl || item.websiteUrl,
    technologies: item.technologies.length > 0 ? item.technologies : ["React"],
  };
  const parsed = (item.codeRepositoryUrl ? organisationSchema : looseApprovalSchema).safeParse(candidate);
  if (!parsed.success) {
    return null;
  }
  return { ...parsed.data, technologies: item.technologies };
}
