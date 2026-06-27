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

// Response shape returned by the backend (validated at the boundary, not trusted).
const feedbackResponseSchema = z.object({
  id: z.string(),
  rawText: z.string(),
  source: z.string(),
  status: z.string(),
  submittedBy: z
    .object({
      id: z.string(),
      name: z.string().nullable(),
      email: z.string(),
    })
    .nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Feedback = z.infer<typeof feedbackResponseSchema>;

/** POST the feedback to the backend API. */
export async function submitFeedback(input: FeedbackInput): Promise<Feedback> {
  const data = await apiFetch<unknown>("/feedback", {
    method: "POST",
    body: input,
  });
  return feedbackResponseSchema.parse(data);
}

// ---- Triage list (GET /feedback) ----

export const FEEDBACK_STATUSES = [
  "pending",
  "reviewed",
  "actioned",
  "archived",
] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export const FEEDBACK_SORT_FIELDS = [
  "createdAt",
  "updatedAt",
  "status",
] as const;
export type FeedbackSortField = (typeof FEEDBACK_SORT_FIELDS)[number];

export interface ListFeedbackQuery {
  page: number;
  pageSize: number;
  status?: string;
  search?: string;
  sortBy: FeedbackSortField;
  sortOrder: "asc" | "desc";
}

const feedbackListItemSchema = z.object({
  id: z.string(),
  rawText: z.string(),
  source: z.string(),
  status: z.string(),
  submittedBy: z
    .object({ id: z.string(), name: z.string().nullable(), email: z.string() })
    .nullable(),
  latestAnalysis: z
    .object({ sentiment: z.string(), priority: z.string() })
    .nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const paginatedFeedbackSchema = z.object({
  data: z.array(feedbackListItemSchema),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export type FeedbackListItem = z.infer<typeof feedbackListItemSchema>;
export type PaginatedFeedback = z.infer<typeof paginatedFeedbackSchema>;

/** Trigger AI analysis for a feedback item (requires a triage/admin token). */
export async function analyzeFeedback(id: string): Promise<void> {
  await apiFetch<unknown>(`/feedback/${id}/analyze`, { method: "POST" });
}

/** Change a feedback item's triage status (requires a triage/admin token). */
export async function updateFeedbackStatus(
  id: string,
  status: string,
): Promise<void> {
  await apiFetch<unknown>(`/feedback/${id}/status`, {
    method: "PATCH",
    body: { status },
  });
}

// ---- Dashboard stats (GET /feedback/stats) ----

const countBucketSchema = z.object({ label: z.string(), count: z.number() });

const feedbackStatsSchema = z.object({
  totalFeedback: z.number(),
  analyzedFeedback: z.number(),
  unanalyzedFeedback: z.number(),
  averageConfidence: z.number().nullable(),
  byStatus: z.array(countBucketSchema),
  bySentiment: z.array(countBucketSchema),
  byPriority: z.array(countBucketSchema),
  topThemes: z.array(z.object({ theme: z.string(), count: z.number() })),
  volumeByDay: z.array(z.object({ date: z.string(), count: z.number() })),
});

export type FeedbackStats = z.infer<typeof feedbackStatsSchema>;

/** Fetch dashboard analytics (requires a triage/admin token). */
export async function getFeedbackStats(): Promise<FeedbackStats> {
  return feedbackStatsSchema.parse(await apiFetch<unknown>("/feedback/stats"));
}

/** Fetch the paginated triage list (requires a triage/admin token). */
export async function listFeedback(
  query: ListFeedbackQuery,
): Promise<PaginatedFeedback> {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });
  if (query.status) params.set("status", query.status);
  if (query.search) params.set("search", query.search);

  const data = await apiFetch<unknown>(`/feedback?${params.toString()}`);
  return paginatedFeedbackSchema.parse(data);
}
