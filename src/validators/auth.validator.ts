import { z } from "zod";

import { USER_ROLES } from "@/types/roles";

export const signInSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export const signUpSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Enter a name of 2 to 80 characters.")
      .max(80, "Enter a name of 2 to 80 characters."),
    email: z.email("Enter a valid email address."),
    password: z.string().min(8, "Use at least 8 characters."),
    role: z.enum(USER_ROLES, "Choose whether you are looking for a job or hiring."),
    company: z.string().trim().max(120, "Enter a company name of 2 to 120 characters.").optional(),
    jobTitle: z.string().trim().max(100, "Enter a job title of up to 100 characters.").optional(),
  })
  .superRefine((value, ctx) => {
    if (value.role !== "recruiter") return;
    if (!value.company || value.company.length < 2) {
      ctx.addIssue({
        code: "custom",
        path: ["company"],
        message: "Enter a company name of 2 to 120 characters.",
      });
    }
    if (!value.jobTitle) {
      ctx.addIssue({ code: "custom", path: ["jobTitle"], message: "Enter your job title." });
    }
  });

export const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email address."),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Use at least 8 characters."),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
