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

/** Roles allowed to use the admin/triage panel (mirrors the backend). */
export const PANEL_ROLES: readonly string[] = ["admin", "triage"];

// Response schemas — validate what the backend returns at the boundary rather
// than trusting it (the response is a network input like any other).
const authUserSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string(),
  role: z.string(),
});

const authResponseSchema = z.object({
  accessToken: z.string().min(1),
  user: authUserSchema,
});

export type AuthUser = z.infer<typeof authUserSchema>;
type AuthResponse = z.infer<typeof authResponseSchema>;

export async function login(input: LoginInput): Promise<AuthResponse> {
  const data = await apiFetch<unknown>("/auth/login", {
    method: "POST",
    body: input,
  });
  return authResponseSchema.parse(data);
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const data = await apiFetch<unknown>("/auth/register", {
    method: "POST",
    body: input,
  });
  return authResponseSchema.parse(data);
}

export async function fetchMe(): Promise<AuthUser> {
  return authUserSchema.parse(await apiFetch<unknown>("/auth/me"));
}
