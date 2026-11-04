import { z } from "zod";

export const universitySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "Enter a university name." })
    .max(160, { error: "University name must be 160 characters or fewer." }),
  location: z
    .string()
    .trim()
    .min(1, { error: "Enter a location." })
    .max(160, { error: "Location must be 160 characters or fewer." }),
});

export const batchSchema = z.object({
  universityId: z.uuid({ error: "Choose a university." }),
  year: z
    .string()
    .trim()
    .regex(/^(19|20)\d{2}$/, { error: "Enter a four-digit year." }),
  totalStudents: z
    .string()
    .trim()
    .regex(/^\d+$/, { error: "Enter the total number of students." })
    .transform(Number)
    .refine((value) => value >= 1 && value <= 100000, {
      error: "Enter a total between 1 and 100000.",
    }),
});

export type UniversityInput = z.infer<typeof universitySchema>;
export type BatchInput = z.infer<typeof batchSchema>;
