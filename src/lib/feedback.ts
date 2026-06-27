import { z } from "zod";
import { apiFetch } from "@/lib/api";

/**
 * Per-field schemas. Kept separate so the form can validate each field on its
 * own to drive the sequential "unlock as you go" flow, while `feedbackSchema`
 * validates the whole payload on submit.
 */
export const nameSchema = z
  .string()
  .trim()
  .min(2, "Please enter at least 2 characters.")
  .max(80, "Name must be 80 characters or fewer.");

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .email("Enter a valid email address.");

export const messageSchema = z
  .string()
  .trim()
  .min(10, "Feedback must be at least 10 characters.")
  .max(2000, "Feedback must be 2000 characters or fewer.");

export const feedbackSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  message: messageSchema,
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;

/** Submitted feedback as returned by the backend. */
export interface Feedback extends FeedbackInput {
  id: string;
  createdAt: string;
}

/** POST the feedback to the backend API. */
export function submitFeedback(input: FeedbackInput): Promise<Feedback> {
  return apiFetch<Feedback>("/feedback", { method: "POST", body: input });
}
