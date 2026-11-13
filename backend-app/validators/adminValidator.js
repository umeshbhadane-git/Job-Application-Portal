import { z } from "zod";

export const adminUsersQuerySchema = z
  .object({
    role: z.enum(["jobSeeker", "recruiter", "admin"]).optional(),
    status: z.enum(["active", "deactivated", "suspended"]).optional(),
    search: z.string().trim().min(1).max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();

export const accountStatusSchema = z
  .object({
    status: z.enum(["active", "deactivated", "suspended"]),
  })
  .strict();

export const adminJobsQuerySchema = z
  .object({
    status: z.enum(["draft", "published", "closed", "archived"]).optional(),
    search: z.string().trim().min(1).max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();

export const adminJobStatusSchema = z
  .object({ status: z.enum(["closed", "archived"]) })
  .strict();

export const jobReportSchema = z
  .object({ reason: z.string().trim().min(5).max(1000) })
  .strict();

export const reportStatusSchema = z
  .object({ status: z.enum(["reviewed", "dismissed"]) })
  .strict();
