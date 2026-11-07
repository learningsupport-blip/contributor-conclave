import { z } from "zod";

import { nameSchema, passwordSchema } from "@/lib/auth/validation";
import { isApplicationScreen } from "@/lib/superadmin/screens";

export const applicationRoleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "Enter a role name." })
    .max(80, { error: "Role name must be 80 characters or fewer." }),
  screens: z
    .array(z.string())
    .min(1, { error: "Choose at least one screen." })
    .refine((screens) => screens.every(isApplicationScreen), { error: "Choose a screen from the list." }),
});

const applicationEmail = z
  .string()
  .trim()
  .max(254, { error: "Email must be 254 characters or fewer." })
  .pipe(z.email({ error: "Enter a valid email address." }))
  .transform((email) => email.toLowerCase());

export const applicationUserSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: applicationEmail,
  password: passwordSchema,
  roleId: z.uuid({ error: "Choose a role." }),
});

export const applicationUserUpdateSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: applicationEmail,
  password: z.string().trim().refine((value) => value === "" || passwordSchema.safeParse(value).success, {
    error: "Use at least 8 characters with a letter, a number, and a symbol.",
  }),
  roleId: z.union([z.literal(""), z.uuid({ error: "Choose a role." })]),
});

export type ApplicationRoleInput = z.infer<typeof applicationRoleSchema>;
export type ApplicationUserInput = z.infer<typeof applicationUserSchema>;
export type ApplicationUserUpdate = z.infer<typeof applicationUserUpdateSchema>;
