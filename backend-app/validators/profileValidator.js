
import { z } from "zod";

const optionalUrl = z.union([
  z.string().trim().url("Please provide a valid URL"),
  z.literal(""),
]);

const experienceSchema = z.object({
  company: z.string().trim().min(1, "Company name is required").max(150),
  jobTitle: z.string().trim().min(1, "Job title is required").max(150),

  employmentType: z
    .enum(["full-time", "part-time", "contract", "internship"])
    .optional(),

  startDate: z.coerce.date(),

  endDate: z.coerce.date().nullable().optional(),

  currentlyWorking: z.boolean().optional(),

  description: z.string().trim().max(2000).optional(),
});

const educationSchema = z.object({
  institution: z
    .string()
    .trim()
    .min(1, "Institution name is required")
    .max(200),

  degree: z.string().trim().min(1, "Degree is required").max(150),

  fieldOfStudy: z.string().trim().max(150).optional(),

  startDate: z.coerce.date().optional(),

  endDate: z.coerce.date().optional(),
});

export const updateProfileSchema = z
  .object({
    headline: z.string().trim().max(150).optional(),

    phone: z.string().trim().max(25).optional(),

    location: z.string().trim().max(150).optional(),

    bio: z.string().trim().max(2000).optional(),

    skills: z
      .array(z.string().trim().min(1).max(50))
      .max(50)
      .optional(),

    experience: z.array(experienceSchema).max(30).optional(),

    education: z.array(educationSchema).max(20).optional(),

    portfolioUrl: optionalUrl.optional(),

    linkedInUrl: optionalUrl.optional(),

    githubUrl: optionalUrl.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one profile field to update",
  });
