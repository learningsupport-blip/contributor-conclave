import type { Role } from "@/generated/prisma/client";

import { APPLICATION_SCREENS } from "@/lib/superadmin/screens";

export type NavLink = { href: string; label: string; section?: boolean; screen?: string };

export type NavItem = NavLink | { label: string; children: NavLink[] };

function superadminNav(): NavItem[] {
  const link = (screen: (typeof APPLICATION_SCREENS)[number]): NavLink => ({
    href: screen.href,
    label: screen.label,
    section: screen.id !== "overview",
    screen: screen.id,
  });
  const general = APPLICATION_SCREENS.filter((screen) => screen.group === "general").map(link);
  const access = APPLICATION_SCREENS.filter((screen) => screen.group === "access").map(link);
  return [
    ...APPLICATION_SCREENS.filter((screen) => screen.group === "top").map(link),
    { label: "General Management", children: general },
    { label: "Application Access", children: access },
  ];
}

function filterNav(items: NavItem[], screens: ReadonlySet<string>): NavItem[] {
  return items.flatMap((item): NavItem[] => {
    if ("children" in item) {
      const children = item.children.filter((child) => child.screen !== undefined && screens.has(child.screen));
      return children.length > 0 ? [{ ...item, children }] : [];
    }
    return item.screen !== undefined && screens.has(item.screen) ? [item] : [];
  });
}

const workspaceItems: Record<Role, NavItem[]> = {
  STUDENT: [
    { href: "/student/overview", label: "Overview" },
    { href: "/student/organisations", label: "Organisations" },
    { href: "/student/activity", label: "GitHub Activity" },
    { href: "/student/repositories", label: "Repositories" },
    { href: "/student/pull-requests", label: "Pull Requests" },
    { href: "/student/submissions", label: "PR Submission" },
    { href: "/student/mentor", label: "Mentor" },
    { href: "/student/chat", label: "Chat" },
    { href: "/student/profile", label: "Profile" },
  ],
  MENTOR: [
    { href: "/mentor", label: "Overview" },
    { href: "/mentor/organisations", label: "Organisations", section: true },
    { href: "/mentor/raised-prs", label: "My Raised PRs", section: true },
    { href: "/mentor/students", label: "Assigned Students", section: true },
    { href: "/mentor/pull-requests", label: "Assigned PRs", section: true },
    { href: "/mentor/reviews", label: "Pending Reviews", section: true },
    { href: "/mentor/history", label: "Review History", section: true },
    { href: "/mentor/tech-stack", label: "Tech Stack", section: true },
    { href: "/mentor/chat", label: "Chat", section: true },
    { href: "/mentor/profile", label: "Profile", section: true },
  ],
  ADMIN: [
    { href: "/admin", label: "Overview" },
    { href: "/admin/students", label: "Students", section: true },
    { href: "/admin/mentors", label: "Mentors", section: true },
    { href: "/admin/submissions", label: "PR Submissions", section: true },
    { href: "/admin/assignments", label: "Assignments", section: true },
    { href: "/admin/tech-stacks", label: "Tech Stacks", section: true },
    { href: "/admin/approvals", label: "Mentor Approvals", section: true },
    { href: "/admin/audit", label: "Audit Logs", section: true },
  ],
  SUPERADMIN: superadminNav(),
};

const workspacePrefix: Record<Role, string> = {
  STUDENT: "/student",
  MENTOR: "/mentor",
  ADMIN: "/admin",
  SUPERADMIN: "/superadmin",
};

export function showsWorkspaceSidebar(
  role: Role,
  pathname: string,
  screens?: readonly string[] | null,
): boolean {
  if (role !== "SUPERADMIN" && screens && screens.length > 0) {
    return pathname === "/superadmin" || pathname.startsWith("/superadmin/");
  }
  const prefix = workspacePrefix[role];
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function navForSignedInUser(role: Role, screens?: readonly string[] | null): NavItem[] {
  if (role !== "SUPERADMIN" && screens && screens.length > 0) {
    return filterNav(superadminNav(), new Set(screens));
  }
  return signedInNavItems(role);
}

export function signedInNavItems(role: Role): NavItem[] {
  return workspaceItems[role];
}
