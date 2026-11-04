import { z } from "zod";

import {
  isOpenSourceProgram,
  isOrganisationTechnology,
  OPEN_SOURCE_PROGRAMS,
  ORGANISATION_TECHNOLOGIES,
} from "@/lib/superadmin/organisation-options";

const programValues = OPEN_SOURCE_PROGRAMS.map((program) => program.value);
const technologyValues = ORGANISATION_TECHNOLOGIES.map((technology) => technology.value);

export function httpUrl(label: string) {
  return z
    .string()
    .trim()
    .min(1, { error: `Enter ${label}.` })
    .max(300, { error: `${label} must be 300 characters or fewer.` })
    .refine((value) => {
      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    }, { error: `Enter ${label} starting with http:// or https://.` });
}

export function repositoryUrl(label: string) {
  return httpUrl(label).refine((value) => {
    const host = new URL(value).hostname.replace(/^www\./, "");
    return host === "github.com" || host === "gitlab.com";
  }, { error: "Enter a github.com or gitlab.com URL." });
}

export const organisationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "Enter an organisation name." })
    .max(120, { error: "Organisation name must be 120 characters or fewer." }),
  program: z
    .string()
    .refine((value): value is (typeof programValues)[number] => isOpenSourceProgram(value), {
      error: "Choose an open source program.",
    }),
  websiteUrl: httpUrl("an organisation URL"),
  repositoryUrl: repositoryUrl("a GitHub or GitLab URL"),
  technologies: z
    .array(
      z.string().refine((value): value is (typeof technologyValues)[number] => isOrganisationTechnology(value), {
        error: "Choose a listed technology.",
      }),
    )
    .min(1, { error: "Choose at least one technology." }),
});

export type OrganisationInput = z.infer<typeof organisationSchema>;
