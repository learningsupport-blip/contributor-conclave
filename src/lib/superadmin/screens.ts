export const APPLICATION_SCREENS = [
  { id: "overview", label: "Overview", href: "/superadmin", group: "top" },
  { id: "resources", label: "Resource Management", href: "/superadmin/resources", group: "top" },
  { id: "prs", label: "PR Management", href: "/superadmin/pull-requests", group: "top" },
  { id: "services", label: "Services", href: "/superadmin/services", group: "top" },
  { id: "universities", label: "University Management", href: "/superadmin/universities", group: "general" },
  { id: "batches", label: "Batch Management", href: "/superadmin/batches", group: "general" },
  { id: "mentors", label: "Mentor Management", href: "/superadmin/mentors", group: "general" },
  { id: "students", label: "Student Management", href: "/superadmin/students", group: "general" },
  { id: "roles", label: "Application Managed Roles", href: "/superadmin/roles", group: "access" },
  { id: "users", label: "Application Managed Users", href: "/superadmin/users", group: "access" },
  { id: "logs", label: "Application Logs", href: "/superadmin/logs", group: "access" },
] as const;

export type ApplicationScreenId = (typeof APPLICATION_SCREENS)[number]["id"];

const SCREEN_IDS = new Set<string>(APPLICATION_SCREENS.map((screen) => screen.id));

export function isApplicationScreen(value: string): value is ApplicationScreenId {
  return SCREEN_IDS.has(value);
}

export function screenLabel(id: string): string {
  return APPLICATION_SCREENS.find((screen) => screen.id === id)?.label ?? id;
}

export function firstScreenHref(screens: readonly string[]): string | null {
  return APPLICATION_SCREENS.find((screen) => screens.includes(screen.id))?.href ?? null;
}
