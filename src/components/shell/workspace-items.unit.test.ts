import { describe, expect, it } from "vitest";

import { navForSignedInUser, showsWorkspaceSidebar, signedInNavItems, type NavItem } from "@/components/shell/workspace-items";

function labels(items: NavItem[]): string[] {
  return items.flatMap((item) => ("children" in item ? [item.label, ...item.children.map((child) => child.label)] : [item.label]));
}

describe("signed-in navigation", () => {
  it("opens the super admin sidebar on Overview and omits the public sections", () => {
    const items = signedInNavItems("SUPERADMIN");
    expect(items[0]).toEqual({ href: "/superadmin", label: "Overview", section: false, screen: "overview" });
    expect(items[1]).toEqual({
      href: "/superadmin/resources",
      label: "Resource Management",
      section: true,
      screen: "resources",
    });
    expect(labels(items)).toEqual([
      "Overview",
      "Resource Management",
      "PR Management",
      "Services",
      "General Management",
      "University Management",
      "Batch Management",
      "Mentor Management",
      "Student Management",
      "Application Access",
      "Application Managed Roles",
      "Application Managed Users",
      "Application Logs",
    ]);
  });

  it("opens each role on its workspace and omits the public sections", () => {
    const student = signedInNavItems("STUDENT");
    expect(student[0]).toEqual({ href: "/student/overview", label: "Overview" });
    expect(labels(student).slice(0, 3)).toEqual(["Overview", "Organisations", "GitHub Activity"]);
    const mentor = labels(signedInNavItems("MENTOR"));
    expect(mentor.slice(0, 3)).toEqual(["Overview", "Organisations", "My Raised PRs"]);
    expect(mentor).not.toContain("Reviews");
    expect(mentor).not.toContain("Collaborate");
    expect(labels(signedInNavItems("ADMIN")).slice(0, 3)).toEqual(["Overview", "Students", "Mentors"]);
  });

  it("keeps each workspace sidebar on that role's routes", () => {
    expect(showsWorkspaceSidebar("SUPERADMIN", "/superadmin")).toBe(true);
    expect(showsWorkspaceSidebar("SUPERADMIN", "/superadmin/universities")).toBe(true);
    expect(showsWorkspaceSidebar("SUPERADMIN", "/")).toBe(false);
    expect(showsWorkspaceSidebar("SUPERADMIN", "/login")).toBe(false);
    expect(showsWorkspaceSidebar("SUPERADMIN", "/superadmin-public")).toBe(false);
    expect(showsWorkspaceSidebar("STUDENT", "/student/overview")).toBe(true);
    expect(showsWorkspaceSidebar("STUDENT", "/")).toBe(false);
    expect(showsWorkspaceSidebar("MENTOR", "/mentor")).toBe(true);
    expect(showsWorkspaceSidebar("ADMIN", "/admin/students")).toBe(true);
    expect(showsWorkspaceSidebar("ADMIN", "/superadmin")).toBe(false);
    expect(showsWorkspaceSidebar("ADMIN", "/superadmin/universities", ["universities"])).toBe(true);
    expect(showsWorkspaceSidebar("ADMIN", "/", ["universities"])).toBe(false);
    expect(labels(navForSignedInUser("ADMIN", ["universities", "students"]))).toEqual([
      "General Management",
      "University Management",
      "Student Management",
    ]);
  });
});
