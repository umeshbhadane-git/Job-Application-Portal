
import { z } from "zod";

export const updateUserSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(3, "Name must contain at least 3 characters")
      .max(50, "Name cannot exceed 50 characters")
      .optional(),

    email: z
      .string()
      .trim()
      .email("Please provide a valid email address")
      .transform((value) => value.toLowerCase())
      .optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });
