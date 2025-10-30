/**
 * Authentication validation schemas using Zod
 */
import { z } from "zod";

// Email validation
export const emailSchema = z.string().email("Invalid email address");

// Password requirements configuration
export const PASSWORD_REQUIREMENTS = [
  {
    message: "Minimum 8 characters",
    regex: /.{8,}/,
    test: (password: string) => password.length >= 8,
  },
  {
    message: "At least one letter",
    regex: /[a-zA-Z]/,
    test: (password: string) => /[a-zA-Z]/.test(password),
  },
  {
    message: "At least one number",
    regex: /[0-9]/,
    test: (password: string) => /[0-9]/.test(password),
  },
  {
    message: "At least one special character",
    regex: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
    test: (password: string) =>
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  },
] as const;

// Password validation
export const passwordSchema = z
  .string()
  .min(8, PASSWORD_REQUIREMENTS[0].message)
  .regex(PASSWORD_REQUIREMENTS[1].regex, PASSWORD_REQUIREMENTS[1].message)
  .regex(PASSWORD_REQUIREMENTS[2].regex, PASSWORD_REQUIREMENTS[2].message)
  .regex(PASSWORD_REQUIREMENTS[3].regex, PASSWORD_REQUIREMENTS[3].message);

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

// Register schema
export const registerSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: emailSchema,
  password: passwordSchema,
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
