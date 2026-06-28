import { z } from "zod";
import { apiFetch } from "@/lib/api";

const auditLogItemSchema = z.object({
  id: z.string(),
  action: z.string(),
  user: z
    .object({ id: z.string(), name: z.string().nullable(), email: z.string() })
    .nullable(),
  feedbackId: z.string().nullable(),
  feedback: z.object({ id: z.string(), excerpt: z.string() }).nullable(),
  oldValue: z.unknown(),
  newValue: z.unknown(),
  notes: z.string().nullable(),
  createdAt: z.string(),
});
export type AuditLogItem = z.infer<typeof auditLogItemSchema>;

const paginatedAuditSchema = z.object({
  data: z.array(auditLogItemSchema),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  totalPages: z.number(),
});
export type PaginatedAudit = z.infer<typeof paginatedAuditSchema>;

export interface ListAuditQuery {
  page: number;
  pageSize: number;
  action?: string;
  search?: string;
  from?: string;
  to?: string;
}

/** Paginated, filtered audit log (requires triage/admin token). */
export async function listAuditLogs(
  query: ListAuditQuery,
): Promise<PaginatedAudit> {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
  if (query.action) params.set("action", query.action);
  if (query.search) params.set("search", query.search);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);

  const data = await apiFetch<unknown>(`/audit-logs?${params.toString()}`);
  return paginatedAuditSchema.parse(data);
}

/** Distinct action names for the filter dropdown. */
export async function getAuditActions(): Promise<string[]> {
  return z
    .array(z.string())
    .parse(await apiFetch<unknown>("/audit-logs/actions"));
}
