import type { Role } from "@/generated/prisma/client";

import { primaryLinks } from "@/components/shell/primary-links";

export type NavLink = { href: string; label: string; section?: boolean };

export type NavItem = NavLink | { label: string; children: NavLink[] };

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
  SUPERADMIN: [
    { href: "/superadmin", label: "Overview" },
    { href: "/superadmin/resources", label: "Resource Management", section: true },
    {
      label: "General Management",
      children: [
        { href: "/superadmin/universities", label: "University Management", section: true },
        { href: "/superadmin/batches", label: "Batch Management", section: true },
      ],
    },
    {
      label: "Application Access",
      children: [
        { href: "/superadmin/roles", label: "Application Managed Roles", section: true },
        { href: "/superadmin/users", label: "Application Managed Users", section: true },
        { href: "/superadmin/logs", label: "Application Logs", section: true },
      ],
    },
  ],
};

export function signedInNavItems(role: Role): NavItem[] {
  const workspace = workspaceItems[role];
  if (role === "SUPERADMIN") {
    return workspace;
  }
  if (role === "STUDENT") {
    const [overview, ...rest] = workspace;
    return [overview, ...primaryLinks.filter((link) => link.href !== "/mentorship"), ...rest];
  }
  return [...primaryLinks, ...workspace];
}
