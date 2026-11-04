import { describe, expect, it } from "vitest";

import { batchSchema, universitySchema } from "@/lib/superadmin/catalog-validation";

describe("university and batch validation", () => {
  it("accepts a university name and location", () => {
    const parsed = universitySchema.safeParse({ name: "  NIAT  ", location: " Hyderabad " });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual({ name: "NIAT", location: "Hyderabad" });
    }
    expect(universitySchema.safeParse({ name: "", location: "Hyderabad" }).success).toBe(false);
  });

  it("accepts a four-digit year and a student total", () => {
    const parsed = batchSchema.safeParse({ year: "2026", totalStudents: "120" });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual({ year: "2026", totalStudents: 120 });
    }
    expect(batchSchema.safeParse({ year: "26", totalStudents: "120" }).success).toBe(false);
    expect(batchSchema.safeParse({ year: "2026", totalStudents: "0" }).success).toBe(false);
  });
});
