"use server";

import { redirect } from "next/navigation";

import { authenticate, registerMentor, registerStudent } from "@/lib/auth/accounts";
import { homeForRole, landingPath } from "@/lib/auth/authorization";
import { createSession, destroySession, getCurrentUser } from "@/lib/auth/session";
import { recordObservedRequest } from "@/lib/superadmin/request-log";
import {
  loginSchema,
  mentorRegistrationSchema,
  studentRegistrationSchema,
  toFieldErrors,
} from "@/lib/auth/validation";

export type AuthFormState = {
  formError?: string;
  fieldErrors?: Record<string, string[]>;
  notice?: string;
};

function readForm(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function registerStudentAction(
  _state: AuthFormState | undefined,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = studentRegistrationSchema.safeParse(readForm(formData));

  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error) };
  }

  const startedAt = Date.now();
  const result = await registerStudent(parsed.data);

  if (!result.ok) {
    await recordObservedRequest({
      path: "/signup",
      method: "POST",
      startedAt,
      statusCode: result.status,
      user: null,
      actorName: "Unknown",
      actorEmail: parsed.data.email,
      operation: "Registration failed",
      area: "AUTH",
    });
    return { formError: result.formError, fieldErrors: result.fieldErrors };
  }

  await createSession(result.user.id);
  await recordObservedRequest({
    path: "/signup",
    method: "POST",
    startedAt,
    statusCode: 200,
    user: result.user,
    operation: "Registered as a student",
    area: "AUTH",
  });
  redirect(homeForRole(result.user.role));
}

export async function registerMentorAction(
  _state: AuthFormState | undefined,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = mentorRegistrationSchema.safeParse(readForm(formData));

  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error) };
  }

  const startedAt = Date.now();
  const result = await registerMentor(parsed.data);

  if (!result.ok) {
    await recordObservedRequest({
      path: "/signup",
      method: "POST",
      startedAt,
      statusCode: result.status,
      user: null,
      actorName: "Unknown",
      actorEmail: parsed.data.email,
      operation: "Registration failed",
      area: "AUTH",
    });
    return { formError: result.formError, fieldErrors: result.fieldErrors };
  }

  await recordObservedRequest({
    path: "/signup",
    method: "POST",
    startedAt,
    statusCode: 200,
    user: result.user,
    operation: "Registered as a mentor",
    area: "AUTH",
  });
  return {
    notice: "Your account was created. A super admin must approve it before you can log in.",
  };
}

export async function loginAction(
  _state: AuthFormState | undefined,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse(readForm(formData));

  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error) };
  }

  const startedAt = Date.now();
  const result = await authenticate(parsed.data.email, parsed.data.password);

  if (!result.ok) {
    await recordObservedRequest({
      path: "/login",
      method: "POST",
      startedAt,
      statusCode: result.status,
      user: null,
      actorName: "Unknown",
      actorEmail: parsed.data.email,
      operation: "Sign-in failed",
      area: "AUTH",
    });
    return { formError: result.formError };
  }

  await createSession(result.user.id);
  await recordObservedRequest({
    path: "/login",
    method: "POST",
    startedAt,
    statusCode: 200,
    user: result.user,
    operation: "Signed in",
    area: "AUTH",
  });
  redirect(await landingPath(result.user));
}

export async function logoutAction() {
  const startedAt = Date.now();
  const user = await getCurrentUser();
  await destroySession();
  await recordObservedRequest({
    path: "/login",
    method: "POST",
    startedAt,
    statusCode: 200,
    user,
    operation: "Signed out",
    area: "AUTH",
  });
  redirect("/login");
}
