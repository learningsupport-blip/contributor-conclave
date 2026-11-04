"use server";

import { revalidatePath } from "next/cache";

import { requireStudent } from "@/lib/auth/authorization";
import { toFieldErrors } from "@/lib/auth/validation";
import { saveStudentInterests, startStudentProject } from "@/lib/student/opportunities";
import { isOrganisationTechnology } from "@/lib/superadmin/organisation-options";
import { z } from "zod";

export type InterestFormState = {
  formError?: string;
  fieldErrors?: Record<string, string[]>;
  saved?: boolean;
};

const postedInterests = z.object({
  technologies: z
    .array(z.string().refine((value) => isOrganisationTechnology(value), { error: "Choose a listed technology." }))
    .min(1, { error: "Choose at least one technology." }),
});

export async function saveStudentInterestsAction(
  _state: InterestFormState | undefined,
  formData: FormData,
): Promise<InterestFormState> {
  const user = await requireStudent();
  const parsed = postedInterests.safeParse({
    technologies: formData.getAll("technologies").filter((value): value is string => typeof value === "string"),
  });
  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error) };
  }

  const result = await saveStudentInterests(user.id, parsed.data.technologies);
  if (!result.ok) {
    return { formError: result.message };
  }

  revalidatePath("/student/overview");
  revalidatePath("/student/organisations");
  return { saved: true };
}

export async function startWorkingAction(
  _state: { formError?: string } | undefined,
  formData: FormData,
): Promise<{ formError?: string }> {
  const user = await requireStudent();
  const result = await startStudentProject(user.id, String(formData.get("projectId") ?? ""));
  if (!result.ok) {
    return { formError: result.message };
  }

  revalidatePath("/student/overview");
  revalidatePath("/student/organisations");
  revalidatePath(`/student/organisations/${result.data.organisationId}`);
  return {};
}
