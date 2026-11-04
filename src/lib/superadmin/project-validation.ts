import { z } from "zod";

import {
  isOpenSourceProgram,
  isOrganisationTechnology,
  OPEN_SOURCE_PROGRAMS,
  ORGANISATION_TECHNOLOGIES,
} from "@/lib/superadmin/organisation-options";
import { httpUrl, repositoryUrl } from "@/lib/superadmin/organisation-validation";

const programValues = OPEN_SOURCE_PROGRAMS.map((program) => program.value);
const technologyValues = ORGANISATION_TECHNOLOGIES.map((technology) => technology.value);

export const projectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "Enter a project name." })
    .max(120, { error: "Project name must be 120 characters or fewer." }),
  organisationId: z.uuid({ error: "Choose an organisation." }),
  program: z
    .string()
    .refine((value): value is (typeof programValues)[number] => isOpenSourceProgram(value), {
      error: "Choose an open source program.",
    }),
  websiteUrl: httpUrl("a project URL"),
  repositoryUrl: repositoryUrl("a GitHub or GitLab URL"),
  technologies: z
    .array(
      z.string().refine((value): value is (typeof technologyValues)[number] => isOrganisationTechnology(value), {
        error: "Choose a listed technology.",
      }),
    )
    .min(1, { error: "Choose at least one technology." }),
});

export type ProjectInput = z.infer<typeof projectSchema>;
