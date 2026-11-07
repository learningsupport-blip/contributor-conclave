"use server";

import { revalidatePath } from "next/cache";

import { requireScreen } from "@/lib/auth/authorization";
import type { ApplicationScreenId } from "@/lib/superadmin/screens";
import { toFieldErrors } from "@/lib/auth/validation";
import { batchSchema, universitySchema } from "@/lib/superadmin/catalog-validation";
import {
  assignApplicationRole,
  createApplicationRole,
  createApplicationUser,
  deleteApplicationUser,
  updateApplicationUser,
} from "@/lib/superadmin/application-roles";
import { applicationRoleSchema, applicationUserSchema, applicationUserUpdateSchema } from "@/lib/superadmin/access-validation";
import {
  createBatch,
  createUniversity,
  deleteBatch,
  deleteUniversity,
  updateBatch,
  updateUniversity,
} from "@/lib/superadmin/catalog";
import { gsocApprovalInput } from "@/lib/superadmin/gsoc-catalog";
import { listGsocOrganisations } from "@/lib/superadmin/gsoc-source";
import { organisationSchema } from "@/lib/superadmin/organisation-validation";
import { approveOrganisation, createOrganisation, disapproveOrganisation } from "@/lib/superadmin/organisations";
import { projectSchema } from "@/lib/superadmin/project-validation";
import { createProject } from "@/lib/superadmin/projects";
import {
  approveMentor,
  assignMentorOrganisation,
  deleteMentor,
  setMentorActive,
  unassignMentorOrganisation,
} from "@/lib/superadmin/mentors";
import { recordObservedRequest } from "@/lib/superadmin/request-log";
import { deleteManagedStudent } from "@/lib/superadmin/students";
import {
  refreshRaisedPullRequestDetails,
  scoreRaisedPullRequest,
} from "@/lib/superadmin/raised-pull-requests";
import { changeUserRole, isAssignableRole, setManagedAccountActive } from "@/lib/superadmin/users";

export type SuperAdminFormState = { formError?: string };

export type OrganisationFormState = {
  formError?: string;
  fieldErrors?: Record<string, string[]>;
  created?: boolean;
  saved?: boolean;
};

function actorFor(screen: ApplicationScreenId) {
  return requireScreen(screen);
}

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function changeRoleAction(
  _state: SuperAdminFormState | undefined,
  formData: FormData,
): Promise<SuperAdminFormState> {
  const actor = await actorFor("users");
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
  const actor = await actorFor("users");
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
  const actor = await actorFor("resources");
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

export async function approveGsocOrganisationAction(
  _state: OrganisationFormState | undefined,
  formData: FormData,
): Promise<OrganisationFormState> {
  const actor = await actorFor("resources");
  const startedAt = Date.now();
  const catalog = await listGsocOrganisations();
  if (!catalog.ok) {
    return { formError: catalog.message };
  }

  const name = text(formData, "name");
  const match = catalog.data.organisations.find((organisation) => organisation.name === name);
  const input = match ? gsocApprovalInput(match) : null;
  if (!input) {
    return { formError: "That organisation cannot be approved." };
  }

  const result = await approveOrganisation(actor.id, input);
  await recordObservedRequest({
    path: "/superadmin/resources",
    method: "POST",
    startedAt,
    statusCode: result.ok ? 200 : 400,
    user: actor,
    operation: result.ok ? "Approved an organisation" : "Organisation approval failed",
    area: "OTHER",
  });
  if (!result.ok) {
    return { formError: result.message };
  }

  revalidatePath("/superadmin/resources");
  revalidatePath("/student/organisations");
  return { created: true };
}

export async function disapproveGsocOrganisationAction(
  _state: OrganisationFormState | undefined,
  formData: FormData,
): Promise<OrganisationFormState> {
  const actor = await actorFor("resources");
  const startedAt = Date.now();
  const result = await disapproveOrganisation(actor.id, text(formData, "name"));
  await recordObservedRequest({
    path: "/superadmin/resources",
    method: "POST",
    startedAt,
    statusCode: result.ok ? 200 : 400,
    user: actor,
    operation: result.ok ? "Disapproved an organisation" : "Organisation disapproval failed",
    area: "OTHER",
  });
  if (!result.ok) {
    return { formError: result.message };
  }

  revalidatePath("/superadmin/resources");
  revalidatePath("/student/organisations");
  return { created: true };
}

export async function createProjectAction(
  _state: OrganisationFormState | undefined,
  formData: FormData,
): Promise<OrganisationFormState> {
  const actor = await actorFor("resources");
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
  const actor = await actorFor("universities");
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

function universityId(formData: FormData) {
  const value = formData.get("universityId");
  return typeof value === "string" ? value : "";
}

export async function updateUniversityAction(
  _state: OrganisationFormState | undefined,
  formData: FormData,
): Promise<OrganisationFormState> {
  const actor = await actorFor("universities");
  const startedAt = Date.now();
  const parsed = universitySchema.safeParse({
    name: text(formData, "name"),
    location: text(formData, "location"),
  });

  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error) };
  }

  const result = await updateUniversity(actor.id, universityId(formData), parsed.data);
  await recordObservedRequest({
    path: "/superadmin/universities",
    method: "POST",
    startedAt,
    statusCode: result.ok ? 200 : 400,
    user: actor,
    operation: result.ok ? "Updated a university" : "University update failed",
    area: "OTHER",
  });

  if (!result.ok) {
    return { formError: result.message, fieldErrors: result.fieldErrors };
  }

  revalidatePath("/superadmin/universities");
  revalidatePath("/register/student");
  revalidatePath("/superadmin/batches");
  return { saved: true };
}

export async function deleteUniversityAction(
  _state: OrganisationFormState | undefined,
  formData: FormData,
): Promise<OrganisationFormState> {
  const actor = await actorFor("universities");
  const startedAt = Date.now();
  const result = await deleteUniversity(actor.id, universityId(formData));
  await recordObservedRequest({
    path: "/superadmin/universities",
    method: "POST",
    startedAt,
    statusCode: result.ok ? 200 : 400,
    user: actor,
    operation: result.ok ? "Deleted a university" : "University delete failed",
    area: "OTHER",
  });

  if (!result.ok) {
    return { formError: result.message };
  }

  revalidatePath("/superadmin/universities");
  revalidatePath("/register/student");
  revalidatePath("/superadmin/batches");
  return { saved: true };
}

export async function createBatchAction(
  _state: OrganisationFormState | undefined,
  formData: FormData,
): Promise<OrganisationFormState> {
  const actor = await actorFor("batches");
  const startedAt = Date.now();
  const parsed = batchSchema.safeParse({
    universityId: text(formData, "universityId"),
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

function batchId(formData: FormData) {
  const value = formData.get("batchId");
  return typeof value === "string" ? value : "";
}

export async function updateBatchAction(
  _state: OrganisationFormState | undefined,
  formData: FormData,
): Promise<OrganisationFormState> {
  const actor = await actorFor("batches");
  const startedAt = Date.now();
  const parsed = batchSchema.safeParse({
    universityId: text(formData, "universityId"),
    year: text(formData, "year"),
    totalStudents: text(formData, "totalStudents"),
  });

  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error) };
  }

  const result = await updateBatch(actor.id, batchId(formData), parsed.data);
  await recordObservedRequest({
    path: "/superadmin/batches",
    method: "POST",
    startedAt,
    statusCode: result.ok ? 200 : 400,
    user: actor,
    operation: result.ok ? "Updated a batch" : "Batch update failed",
    area: "OTHER",
  });

  if (!result.ok) {
    return { formError: result.message, fieldErrors: result.fieldErrors };
  }

  revalidatePath("/superadmin/batches");
  revalidatePath("/register/student");
  return { saved: true };
}

export async function deleteBatchAction(
  _state: OrganisationFormState | undefined,
  formData: FormData,
): Promise<OrganisationFormState> {
  const actor = await actorFor("batches");
  const startedAt = Date.now();
  const result = await deleteBatch(actor.id, batchId(formData));
  await recordObservedRequest({
    path: "/superadmin/batches",
    method: "POST",
    startedAt,
    statusCode: result.ok ? 200 : 400,
    user: actor,
    operation: result.ok ? "Deleted a batch" : "Batch delete failed",
    area: "OTHER",
  });

  if (!result.ok) {
    return { formError: result.message };
  }

  revalidatePath("/superadmin/batches");
  revalidatePath("/register/student");
  return { saved: true };
}

function selectedScreens(formData: FormData) {
  return formData.getAll("screens").filter((value): value is string => typeof value === "string");
}

export async function createApplicationRoleAction(
  _state: OrganisationFormState | undefined,
  formData: FormData,
): Promise<OrganisationFormState> {
  const actor = await actorFor("roles");
  const startedAt = Date.now();
  const parsed = applicationRoleSchema.safeParse({
    name: text(formData, "name"),
    screens: selectedScreens(formData),
  });

  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error) };
  }

  const result = await createApplicationRole(actor.id, parsed.data);
  await recordObservedRequest({
    path: "/superadmin/roles",
    method: "POST",
    startedAt,
    statusCode: result.ok ? 200 : 400,
    user: actor,
    operation: result.ok ? "Created an application role" : "Application role create failed",
    area: "ACCESS",
  });

  if (!result.ok) {
    return { formError: result.message, fieldErrors: result.fieldErrors };
  }

  revalidatePath("/superadmin/roles");
  revalidatePath("/superadmin/users");
  return { created: true };
}

export async function createApplicationUserAction(
  _state: OrganisationFormState | undefined,
  formData: FormData,
): Promise<OrganisationFormState> {
  const actor = await actorFor("users");
  const startedAt = Date.now();
  const parsed = applicationUserSchema.safeParse({
    firstName: text(formData, "firstName"),
    lastName: text(formData, "lastName"),
    email: text(formData, "email"),
    password: text(formData, "password"),
    roleId: text(formData, "roleId"),
  });

  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error) };
  }

  const result = await createApplicationUser(actor.id, parsed.data);
  await recordObservedRequest({
    path: "/superadmin/users",
    method: "POST",
    startedAt,
    statusCode: result.ok ? 200 : 400,
    user: actor,
    operation: result.ok ? "Created an application user" : "Application user create failed",
    area: "ACCESS",
  });

  if (!result.ok) {
    return { formError: result.message, fieldErrors: result.fieldErrors };
  }

  revalidatePath("/superadmin/users");
  return { created: true };
}

export async function updateApplicationUserAction(
  _state: OrganisationFormState | undefined,
  formData: FormData,
): Promise<OrganisationFormState> {
  const actor = await actorFor("users");
  const startedAt = Date.now();
  const parsed = applicationUserUpdateSchema.safeParse({
    firstName: text(formData, "firstName"),
    lastName: text(formData, "lastName"),
    email: text(formData, "email"),
    password: text(formData, "password"),
    roleId: text(formData, "roleId"),
  });

  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error) };
  }

  const result = await updateApplicationUser(actor.id, text(formData, "userId"), parsed.data);
  await recordObservedRequest({
    path: "/superadmin/users",
    method: "POST",
    startedAt,
    statusCode: result.ok ? 200 : 400,
    user: actor,
    operation: result.ok ? "Updated an application user" : "Application user update failed",
    area: "ACCESS",
  });

  if (!result.ok) {
    return { formError: result.message, fieldErrors: result.fieldErrors };
  }

  revalidatePath("/superadmin/users");
  return { saved: true };
}

export async function deleteApplicationUserAction(
  _state: OrganisationFormState | undefined,
  formData: FormData,
): Promise<OrganisationFormState> {
  const actor = await actorFor("users");
  const startedAt = Date.now();
  const result = await deleteApplicationUser(actor.id, text(formData, "userId"));
  await recordObservedRequest({
    path: "/superadmin/users",
    method: "POST",
    startedAt,
    statusCode: result.ok ? 200 : 400,
    user: actor,
    operation: result.ok ? "Deleted an application user" : "Application user delete failed",
    area: "ACCESS",
  });

  if (!result.ok) {
    return { formError: result.message };
  }

  revalidatePath("/superadmin/users");
  return { saved: true };
}

export async function assignApplicationRoleAction(
  _state: SuperAdminFormState | undefined,
  formData: FormData,
): Promise<SuperAdminFormState> {
  const actor = await actorFor("users");
  const startedAt = Date.now();
  const result = await assignApplicationRole(actor.id, text(formData, "userId"), text(formData, "roleId"));
  await recordObservedRequest({
    path: "/superadmin/users",
    method: "POST",
    startedAt,
    statusCode: result.ok ? 200 : 400,
    user: actor,
    operation: result.ok ? "Assigned an application role" : "Application role assignment failed",
    area: "ACCESS",
  });

  if (!result.ok) {
    return { formError: result.message };
  }

  revalidatePath("/superadmin/users");
  return {};
}

export async function setStudentAccessAction(
  _state: SuperAdminFormState | undefined,
  formData: FormData,
): Promise<SuperAdminFormState> {
  const actor = await actorFor("students");
  const startedAt = Date.now();
  const active = text(formData, "active") === "true";
  const result = await setManagedAccountActive(actor.id, text(formData, "userId"), active, "students");
  await recordObservedRequest({
    path: "/superadmin/students",
    method: "POST",
    startedAt,
    statusCode: result.ok ? 200 : 400,
    user: actor,
    operation: result.ok ? (active ? "Reactivated a student" : "Deactivated a student") : "Student access change failed",
    area: "STUDENT",
  });

  if (!result.ok) {
    return { formError: result.message };
  }

  revalidatePath("/superadmin/students");
  return {};
}

export async function deleteStudentAction(
  _state: OrganisationFormState | undefined,
  formData: FormData,
): Promise<OrganisationFormState> {
  const actor = await actorFor("students");
  const startedAt = Date.now();
  const result = await deleteManagedStudent(actor.id, text(formData, "userId"));
  await recordObservedRequest({
    path: "/superadmin/students",
    method: "POST",
    startedAt,
    statusCode: result.ok ? 200 : 400,
    user: actor,
    operation: result.ok ? "Deleted a student" : "Student delete failed",
    area: "STUDENT",
  });

  if (!result.ok) {
    return { formError: result.message };
  }

  revalidatePath("/superadmin/students");
  return { saved: true };
}

function mentorUserId(formData: FormData) {
  const value = formData.get("userId");
  return typeof value === "string" ? value : "";
}

export async function approveMentorAction(
  _state: SuperAdminFormState | undefined,
  formData: FormData,
): Promise<SuperAdminFormState> {
  const actor = await actorFor("mentors");
  const startedAt = Date.now();
  const result = await approveMentor(actor.id, mentorUserId(formData));
  await recordObservedRequest({
    path: "/superadmin/mentors",
    method: "POST",
    startedAt,
    statusCode: result.ok ? 200 : 400,
    user: actor,
    operation: result.ok ? "Approved a mentor" : "Mentor approval failed",
    area: "MENTOR",
  });

  if (!result.ok) {
    return { formError: result.message };
  }

  revalidatePath("/superadmin/mentors");
  return {};
}

export async function setMentorActiveAction(
  _state: SuperAdminFormState | undefined,
  formData: FormData,
): Promise<SuperAdminFormState> {
  const actor = await actorFor("mentors");
  const startedAt = Date.now();
  const active = formData.get("active") === "true";
  const result = await setMentorActive(actor.id, mentorUserId(formData), active);
  await recordObservedRequest({
    path: "/superadmin/mentors",
    method: "POST",
    startedAt,
    statusCode: result.ok ? 200 : 400,
    user: actor,
    operation: result.ok ? (active ? "Enabled a mentor" : "Disabled a mentor") : "Mentor access change failed",
    area: "MENTOR",
  });

  if (!result.ok) {
    return { formError: result.message };
  }

  revalidatePath("/superadmin/mentors");
  return {};
}

export async function deleteMentorAction(
  _state: SuperAdminFormState | undefined,
  formData: FormData,
): Promise<SuperAdminFormState> {
  const actor = await actorFor("mentors");
  const startedAt = Date.now();
  const result = await deleteMentor(actor.id, mentorUserId(formData));
  await recordObservedRequest({
    path: "/superadmin/mentors",
    method: "POST",
    startedAt,
    statusCode: result.ok ? 200 : 400,
    user: actor,
    operation: result.ok ? "Deleted a mentor" : "Mentor delete failed",
    area: "MENTOR",
  });

  if (!result.ok) {
    return { formError: result.message };
  }

  revalidatePath("/superadmin/mentors");
  return {};
}

function organisationId(formData: FormData) {
  const value = formData.get("organisationId");
  return typeof value === "string" ? value : "";
}

export async function assignMentorOrganisationAction(
  _state: SuperAdminFormState | undefined,
  formData: FormData,
): Promise<SuperAdminFormState> {
  const actor = await actorFor("mentors");
  const startedAt = Date.now();
  const result = await assignMentorOrganisation(actor.id, mentorUserId(formData), organisationId(formData));
  await recordObservedRequest({
    path: "/superadmin/mentors",
    method: "POST",
    startedAt,
    statusCode: result.ok ? 200 : 400,
    user: actor,
    operation: result.ok ? "Assigned an organisation to a mentor" : "Mentor organisation assignment failed",
    area: "MENTOR",
  });

  if (!result.ok) {
    return { formError: result.message };
  }

  revalidatePath("/superadmin/mentors");
  revalidatePath("/mentor");
  revalidatePath("/mentor/organisations");
  return {};
}

export async function unassignMentorOrganisationAction(
  _state: SuperAdminFormState | undefined,
  formData: FormData,
): Promise<SuperAdminFormState> {
  const actor = await actorFor("mentors");
  const startedAt = Date.now();
  const result = await unassignMentorOrganisation(actor.id, mentorUserId(formData), organisationId(formData));
  await recordObservedRequest({
    path: "/superadmin/mentors",
    method: "POST",
    startedAt,
    statusCode: result.ok ? 200 : 400,
    user: actor,
    operation: result.ok ? "Removed an organisation from a mentor" : "Mentor organisation removal failed",
    area: "MENTOR",
  });

  if (!result.ok) {
    return { formError: result.message };
  }

  revalidatePath("/superadmin/mentors");
  revalidatePath("/mentor");
  revalidatePath("/mentor/organisations");
  return {};
}

export async function refreshRaisedPullRequestAction(
  _state: OrganisationFormState | undefined,
  formData: FormData,
): Promise<OrganisationFormState> {
  const actor = await actorFor("raised-prs");
  const startedAt = Date.now();
  const result = await refreshRaisedPullRequestDetails(actor.id, text(formData, "pullRequestId"));
  await recordObservedRequest({
    path: "/superadmin/raised-prs",
    method: "POST",
    startedAt,
    statusCode: result.ok ? 200 : 400,
    user: actor,
    operation: result.ok ? "Refreshed a mentor pull request" : "Mentor pull request refresh failed",
    area: "MENTOR",
  });

  if (!result.ok) {
    return { formError: result.message };
  }

  revalidatePath("/superadmin/raised-prs");
  revalidatePath("/mentor/raised-prs");
  return { saved: true };
}

export async function scoreRaisedPullRequestAction(
  _state: OrganisationFormState | undefined,
  formData: FormData,
): Promise<OrganisationFormState> {
  const actor = await actorFor("raised-prs");
  const startedAt = Date.now();
  const result = await scoreRaisedPullRequest(actor.id, text(formData, "pullRequestId"), {
    clarity: text(formData, "clarity"),
    scope: text(formData, "scope"),
    evidence: text(formData, "evidence"),
    outcome: text(formData, "outcome"),
    note: text(formData, "note"),
  });
  await recordObservedRequest({
    path: "/superadmin/raised-prs",
    method: "POST",
    startedAt,
    statusCode: result.ok ? 200 : 400,
    user: actor,
    operation: result.ok ? "Scored a mentor pull request" : "Mentor pull request score failed",
    area: "MENTOR",
  });

  if (!result.ok) {
    return { formError: result.message };
  }

  revalidatePath("/superadmin/raised-prs");
  revalidatePath("/mentor/raised-prs");
  return { saved: true };
}
