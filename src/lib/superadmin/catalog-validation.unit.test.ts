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

  it("accepts a university, a four-digit year, and a student total", () => {
    const universityId = "00000000-0000-4000-8000-000000000101";
    const parsed = batchSchema.safeParse({ universityId, year: "2026", totalStudents: "120" });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual({ universityId, year: "2026", totalStudents: 120 });
    }
    expect(batchSchema.safeParse({ universityId: "", year: "2026", totalStudents: "120" }).success).toBe(false);
    expect(batchSchema.safeParse({ universityId, year: "26", totalStudents: "120" }).success).toBe(false);
    expect(batchSchema.safeParse({ universityId, year: "2026", totalStudents: "0" }).success).toBe(false);
  });
});
