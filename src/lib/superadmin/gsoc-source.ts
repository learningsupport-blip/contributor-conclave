import "server-only";

import { createGitHubClient, type GitHubFetcher } from "@/lib/github/client";
import { readGitHubToken } from "@/lib/github/env";
import { logError } from "@/lib/log";
import type { AdminError, AdminSuccess } from "@/lib/admin/access";
import {
  GSOC_DATA_DIRECTORY,
  gsocDataFiles,
  parseGsocYear,
  type GsocCatalog,
  type GsocDataFile,
} from "@/lib/superadmin/gsoc-catalog";

const CACHE_TTL_MS = 10 * 60 * 1000;

let cache: { expiresAt: number; value: AdminSuccess<GsocCatalog> | AdminError } | null = null;

export function clearGsocCatalogCache() {
  cache = null;
}

async function readYearFile(fetchImpl: GitHubFetcher, file: GsocDataFile): Promise<unknown | null> {
  try {
    const response = await fetchImpl(file.downloadUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "contributor-conclave",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) {
      logError("gsoc_catalog_fetch_failed", { status: response.status, year: file.year });
      return null;
    }
    return await response.json();
  } catch (error) {
    logError("gsoc_catalog_fetch_failed", { name: error instanceof Error ? error.name : "Error", year: file.year });
    return null;
  }
}

export async function loadGsocCatalog(fetchImpl: GitHubFetcher): Promise<AdminSuccess<GsocCatalog> | AdminError> {
  const client = createGitHubClient({
    fetchImpl,
    token: readGitHubToken(),
    now: () => Date.now(),
  });
  const listed = await client.request(GSOC_DATA_DIRECTORY);
  if (!listed.ok) {
    return { ok: false, code: "invalid", message: listed.message };
  }

  const latest = gsocDataFiles(listed.data)[0];
  if (!latest) {
    return { ok: false, code: "invalid", message: "The GSoC organisation list could not be read." };
  }

  const body = await readYearFile(fetchImpl, latest);
  const catalog = body ? parseGsocYear(body, latest.year) : null;
  if (!catalog) {
    return { ok: false, code: "invalid", message: "The GSoC organisation list could not be read." };
  }
  return { ok: true, data: catalog };
}

export async function listGsocOrganisations(): Promise<AdminSuccess<GsocCatalog> | AdminError> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) {
    return cache.value;
  }

  const value = await loadGsocCatalog(fetch);
  cache = { expiresAt: now + (value.ok ? CACHE_TTL_MS : 60_000), value };
  return value;
}
