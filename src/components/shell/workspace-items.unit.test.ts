import { describe, expect, it } from "vitest";

import { signedInNavItems, type NavItem } from "@/components/shell/workspace-items";

function labels(items: NavItem[]): string[] {
  return items.flatMap((item) => ("children" in item ? [item.label, ...item.children.map((child) => child.label)] : [item.label]));
}

describe("signed-in navigation", () => {
  it("opens the super admin sidebar on Overview and omits the public sections", () => {
    const items = signedInNavItems("SUPERADMIN");
    expect(items[0]).toEqual({ href: "/superadmin", label: "Overview" });
    expect(items[1]).toEqual({
      href: "/superadmin/resources",
      label: "Resource Management",
      section: true,
    });
    expect(labels(items)).toEqual([
      "Overview",
      "Resource Management",
      "Application Access",
      "Application Managed Roles",
      "Application Managed Users",
      "Application Logs",
    ]);
  });

  it("opens the student sidebar on Overview and keeps Mentorship for the other roles", () => {
    const student = signedInNavItems("STUDENT");
    expect(student[0]).toEqual({ href: "/student/overview", label: "Overview" });
    expect(labels(student).slice(0, 3)).toEqual(["Overview", "Reviews", "Collaborate"]);
    expect(labels(student)).not.toContain("Mentorship");
    expect(labels(signedInNavItems("MENTOR")).slice(0, 3)).toEqual(["Mentorship", "Reviews", "Collaborate"]);
    expect(labels(signedInNavItems("ADMIN")).slice(0, 3)).toEqual(["Mentorship", "Reviews", "Collaborate"]);
  });
});
