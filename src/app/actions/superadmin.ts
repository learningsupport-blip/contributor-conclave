"use server";

import { revalidatePath } from "next/cache";

import { requireSuperAdmin } from "@/lib/auth/authorization";
import { toFieldErrors } from "@/lib/auth/validation";
import { batchSchema, universitySchema } from "@/lib/superadmin/catalog-validation";
import { createBatch, createUniversity } from "@/lib/superadmin/catalog";
import { organisationSchema } from "@/lib/superadmin/organisation-validation";
import { createOrganisation } from "@/lib/superadmin/organisations";
import { projectSchema } from "@/lib/superadmin/project-validation";
import { createProject } from "@/lib/superadmin/projects";
import { recordObservedRequest } from "@/lib/superadmin/request-log";
import { changeUserRole, isAssignableRole, setManagedAccountActive } from "@/lib/superadmin/users";

export type SuperAdminFormState = { formError?: string };

export type OrganisationFormState = {
  formError?: string;
  fieldErrors?: Record<string, string[]>;
  created?: boolean;
};

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function changeRoleAction(
  _state: SuperAdminFormState | undefined,
  formData: FormData,
): Promise<SuperAdminFormState> {
  const actor = await requireSuperAdmin();
  const startedAt = Date.now();
  const role = text(formData, "role");
  if (!isAssignableRole(role)) {
    return { formError: "Choose a student, mentor, or admin role." };
  }

  const result = await changeUserRole(actor.id, text(formData, "userId"), role);
  await recordObservedRequest({
    path: "/superadmin/users",
    method: "POST",
    startedAt,
    statusCode: result.ok ? 200 : 400,
    user: actor,
    operation: result.ok ? "Changed a role" : "Role change failed",
    area: "ACCESS",
  });
  if (!result.ok) {
    return { formError: result.message };
  }

  revalidatePath("/superadmin/users");
  return {};
}

export async function setAccessAction(
  _state: SuperAdminFormState | undefined,
  formData: FormData,
): Promise<SuperAdminFormState> {
  const actor = await requireSuperAdmin();
  const startedAt = Date.now();
  const active = text(formData, "active") === "true";
  const result = await setManagedAccountActive(actor.id, text(formData, "userId"), active);
  await recordObservedRequest({
    path: "/superadmin/users",
    method: "POST",
    startedAt,
    statusCode: result.ok ? 200 : 400,
    user: actor,
    operation: result.ok ? (active ? "Restored an account" : "Deactivated an account") : "Account update failed",
    area: "ACCESS",
  });
  if (!result.ok) {
    return { formError: result.message };
  }

  revalidatePath("/superadmin/users");
  return {};
}

export async function createOrganisationAction(
  _state: OrganisationFormState | undefined,
  formData: FormData,
): Promise<OrganisationFormState> {
  const actor = await requireSuperAdmin();
  const startedAt = Date.now();
  const parsed = organisationSchema.safeParse({
    name: text(formData, "name"),
    program: text(formData, "program"),
    websiteUrl: text(formData, "websiteUrl"),
    repositoryUrl: text(formData, "repositoryUrl"),
    technologies: formData.getAll("technologies").filter((value): value is string => typeof value === "string"),
  });

  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error) };
  }

  const result = await createOrganisation(actor.id, parsed.data);
  await recordObservedRequest({
    path: "/superadmin/resources",
    method: "POST",
    startedAt,
    statusCode: result.ok ? 200 : 400,
    user: actor,
    operation: result.ok ? "Created an organisation" : "Organisation create failed",
    area: "OTHER",
  });

  if (!result.ok) {
    return { formError: result.message };
  }

  revalidatePath("/superadmin/resources");
  return { created: true };
}

export async function createProjectAction(
  _state: OrganisationFormState | undefined,
  formData: FormData,
): Promise<OrganisationFormState> {
  const actor = await requireSuperAdmin();
  const startedAt = Date.now();
  const parsed = projectSchema.safeParse({
    name: text(formData, "name"),
    organisationId: text(formData, "organisationId"),
    program: text(formData, "program"),
    websiteUrl: text(formData, "websiteUrl"),
    repositoryUrl: text(formData, "repositoryUrl"),
    technologies: formData.getAll("technologies").filter((value): value is string => typeof value === "string"),
  });

  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error) };
  }

  const result = await createProject(actor.id, parsed.data);
  await recordObservedRequest({
    path: "/superadmin/resources",
    method: "POST",
    startedAt,
    statusCode: result.ok ? 200 : 400,
    user: actor,
    operation: result.ok ? "Created a project" : "Project create failed",
    area: "OTHER",
  });

  if (!result.ok) {
    return { formError: result.message };
  }

  revalidatePath("/superadmin/resources");
  return { created: true };
}

export async function createUniversityAction(
  _state: OrganisationFormState | undefined,
  formData: FormData,
): Promise<OrganisationFormState> {
  const actor = await requireSuperAdmin();
  const startedAt = Date.now();
  const parsed = universitySchema.safeParse({
    name: text(formData, "name"),
    location: text(formData, "location"),
  });

  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error) };
  }

  const result = await createUniversity(actor.id, parsed.data);
  await recordObservedRequest({
    path: "/superadmin/universities",
    method: "POST",
    startedAt,
    statusCode: result.ok ? 200 : 400,
    user: actor,
    operation: result.ok ? "Created a university" : "University create failed",
    area: "OTHER",
  });

  if (!result.ok) {
    return { formError: result.message, fieldErrors: result.fieldErrors };
  }

  revalidatePath("/superadmin/universities");
  revalidatePath("/register/student");
  return { created: true };
}

export async function createBatchAction(
  _state: OrganisationFormState | undefined,
  formData: FormData,
): Promise<OrganisationFormState> {
  const actor = await requireSuperAdmin();
  const startedAt = Date.now();
  const parsed = batchSchema.safeParse({
    year: text(formData, "year"),
    totalStudents: text(formData, "totalStudents"),
  });

  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error) };
  }

  const result = await createBatch(actor.id, parsed.data);
  await recordObservedRequest({
    path: "/superadmin/batches",
    method: "POST",
    startedAt,
    statusCode: result.ok ? 200 : 400,
    user: actor,
    operation: result.ok ? "Created a batch" : "Batch create failed",
    area: "OTHER",
  });

  if (!result.ok) {
    return { formError: result.message, fieldErrors: result.fieldErrors };
  }

  revalidatePath("/superadmin/batches");
  revalidatePath("/register/student");
  return { created: true };
}
