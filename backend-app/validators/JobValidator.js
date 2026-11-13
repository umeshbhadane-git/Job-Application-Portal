
import { z } from "zod";

const salarySchema = z.object({
  min: z.number().min(0).optional(),
  max: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
}).optional().refine(
  (salary) =>
    !salary ||
    salary.min === undefined ||
    salary.max === undefined ||
    salary.min <= salary.max,
  {
    message: "Minimum salary cannot exceed maximum salary",
  }
);

const jobFields = {
  title: z.string().trim().min(3).max(100),
  company: z.string().trim().min(2).max(100),
  description: z.string().trim().min(30),
  location: z.string().trim().min(2).max(150),
  workplaceType: z.enum(["onsite", "remote", "hybrid"]),
  employmentType: z.enum([
    "full-time",
    "part-time",
    "contract",
    "internship",
  ]),
  experienceLevel: z.enum([
    "entry",
    "junior",
    "mid",
    "senior",
    "lead",
  ]),
  minExperience: z.number().min(0).optional(),
  maxExperience: z.number().min(0).nullable().optional(),
  openings: z.number().int().min(1).optional(),
  salary: salarySchema,
  skills: z.array(z.string().trim().min(1)).optional(),
  optionalSkills: z.array(z.string().trim().min(1)).optional(),
  closingDate: z.coerce.date().optional().nullable(),
};

export const createJobSchema = z.object({
  ...jobFields,
}).strict();

export const updateJobSchema = z.object({
  ...Object.fromEntries(
    Object.entries(jobFields).map(([key, schema]) => [
      key,
      schema.optional(),
    ])
  ),
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided" }
);

export const updateJobStatusSchema = z.object({
  status: z.enum(["draft", "published", "closed", "archived"]),
}).strict();

export const publicJobsQuerySchema = z.object({
  search: z.string().trim().min(1).max(100).optional(),
  location: z.string().trim().min(1).max(150).optional(),
  skill: z.string().trim().min(1).max(80).optional(),
  minExperience: z.coerce.number().min(0).optional(),
  maxExperience: z.coerce.number().min(0).optional(),
  workplaceType: z.enum(["onsite", "remote", "hybrid"]).optional(),
  employmentType: z.enum([
    "full-time",
    "part-time",
    "contract",
    "internship",
  ]).optional(),
  sort: z.enum(["newest", "oldest", "salary-asc", "salary-desc"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
}).strict();

export const recruiterJobsQuerySchema = z.object({
  status: z.enum(["draft", "published", "closed", "archived"]).optional(),
  search: z.string().trim().min(1).max(100).optional(),
  sort: z.enum(["newest", "oldest"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
}).strict();
