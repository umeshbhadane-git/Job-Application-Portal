import { z } from "zod";

export const applyForJobSchema = z
  .object({ jobId: z.string().regex(/^[a-f\d]{24}$/i) })
  .strict();

export const applicationStatusSchema = z
  .object({
    status: z.enum([
      "under-review",
      "shortlisted",
      "interview-scheduled",
      "selected",
      "rejected",
    ]),
  })
  .strict();

export const applicationNoteSchema = z
  .object({
    body: z.string().trim().min(1).max(2000),
  })
  .strict();

export const recruiterApplicationsQuerySchema = z
  .object({
    status: z
      .enum([
        "applied",
        "under-review",
        "shortlisted",
        "interview-scheduled",
        "selected",
        "rejected",
        "withdrawn",
      ])
      .optional(),
    skill: z.string().trim().min(1).max(80).optional(),
    sort: z.enum(["newest", "oldest", "experience"]).default("newest"),
  })
  .strict();
