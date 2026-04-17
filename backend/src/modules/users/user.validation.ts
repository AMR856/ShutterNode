import { z } from "zod";

export class AuthValidationSchemas {
  static authSchema = z.object({
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email format")
      .transform((val) => val.toLowerCase()),
    password: z.string().min(6, "Password must be at least 6 characters"),
  });
}

export type AuthInput = z.infer<typeof AuthValidationSchemas.authSchema>;
