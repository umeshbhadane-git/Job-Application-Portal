import {z} from "zod";

export const registerSchema = z.object({

    fullName: z.string().trim().min(2).max(50),
    email: z.string().trim().email().max(254),
    password: z.string().min(8).max(40),
    role: z.enum(["jobSeeker", "recruiter"]).optional().default("jobSeeker")

})

export const loginSchema = z.object({

    email: z.string().trim().email().max(254),
    password: z.string().min(8).max(40),

})