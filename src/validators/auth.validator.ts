import { z } from "zod";

import { USER_ROLES } from "@/types/roles";

export const signInSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const signUpSchema = z
  .object({
    fullName: z.string().trim().min(1, "Enter your full name"),
    email: z.email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(USER_ROLES, "Choose whether you are looking for a job or hiring"),
    company: z.string().trim().optional(),
    jobTitle: z.string().trim().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.role !== "recruiter") return;
    if (!value.company) {
      ctx.addIssue({ code: "custom", path: ["company"], message: "Enter your company name" });
    }
    if (!value.jobTitle) {
      ctx.addIssue({ code: "custom", path: ["jobTitle"], message: "Enter your job title" });
    }
  });

export const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email"),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
