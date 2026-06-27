import { z } from "zod";
import { apiFetch } from "@/lib/api";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter at least 2 characters.")
    .max(80, "Name must be 80 characters or fewer."),
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Enter a valid email."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(100, "Password must be 100 characters or fewer."),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export interface AuthUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export function login(input: LoginInput): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/login", { method: "POST", body: input });
}

export function register(input: RegisterInput): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: input,
  });
}

export function fetchMe(): Promise<AuthUser> {
  return apiFetch<AuthUser>("/auth/me");
}
