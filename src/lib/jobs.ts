import { z } from "zod";
import { apiFetch } from "@/lib/api";

/** Outcome of a single job run. */
export const JOB_RUN_STATUSES = ["success", "noop", "failed"] as const;
export type JobRunStatus = (typeof JOB_RUN_STATUSES)[number];

const jobRunSchema = z.object({
  id: z.string(),
  jobName: z.string(),
  status: z.string(),
  startedAt: z.string(),
  finishedAt: z.string().nullable(),
  durationMs: z.number().nullable(),
  itemsProcessed: z.number(),
  detail: z.string().nullable(),
  error: z.string().nullable(),
});
export type JobRun = z.infer<typeof jobRunSchema>;

const jobTotalsSchema = z.object({
  total: z.number(),
  success: z.number(),
  noop: z.number(),
  failed: z.number(),
  itemsProcessed: z.number(),
});

const jobSummarySchema = z.object({
  name: z.string(),
  displayName: z.string(),
  description: z.string(),
  schedule: z.string(),
  cronExpression: z.string(),
  enabled: z.boolean(),
  aiConfigured: z.boolean(),
  health: z.string(),
  nextRunAt: z.string().nullable(),
  lastRun: jobRunSchema.nullable(),
  totals: jobTotalsSchema,
});
export type JobSummary = z.infer<typeof jobSummarySchema>;

const paginatedJobRunsSchema = z.object({
  data: z.array(jobRunSchema),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  totalPages: z.number(),
});
export type PaginatedJobRuns = z.infer<typeof paginatedJobRunsSchema>;

export interface ListJobRunsQuery {
  name: string;
  page: number;
  pageSize: number;
  status?: string;
}

/** Live status of every monitored background job (requires triage/admin token). */
export async function listJobs(): Promise<JobSummary[]> {
  return z.array(jobSummarySchema).parse(await apiFetch<unknown>("/jobs"));
}

/** Paginated run history for a single job (newest first). */
export async function listJobRuns(
  query: ListJobRunsQuery,
): Promise<PaginatedJobRuns> {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
  if (query.status) params.set("status", query.status);

  const data = await apiFetch<unknown>(
    `/jobs/${encodeURIComponent(query.name)}/runs?${params.toString()}`,
  );
  return paginatedJobRunsSchema.parse(data);
}
