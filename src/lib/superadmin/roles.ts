import type { Role } from "@/generated/prisma/client";

export const applicationRoles: { id: Role; name: string; screens: string }[] = [
  {
    id: "ADMIN",
    name: "Admin",
    screens: "Every admin screen except Application Access",
  },
  {
    id: "STUDENT",
    name: "Student",
    screens: "Student portal",
  },
  {
    id: "MENTOR",
    name: "Mentor",
    screens: "Assigned students, assigned pull requests, reviews, and chat",
  },
  {
    id: "SUPERADMIN",
    name: "Super admin",
    screens: "Application Access: roles, users, and application logs",
  },
];

export function roleName(role: Role): string {
  return applicationRoles.find((item) => item.id === role)?.name ?? role;
}
