"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/modal";
import { ApiError } from "@/lib/api";
import {
  FEEDBACK_PRIORITIES,
  FEEDBACK_SENTIMENTS,
  FEEDBACK_STATUSES,
  type FeedbackListItem,
  type FeedbackSortField,
  type PaginatedFeedback,
  analyzeFeedback,
  listFeedback,
  updateFeedbackStatus,
} from "@/lib/feedback";

const PAGE_SIZE = 20;
const SOURCES = ["web", "email"] as const;

export function FeedbackTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [sentiment, setSentiment] = useState("");
  const [priority, setPriority] = useState("");
  const [analyzed, setAnalyzed] = useState(""); // "", "true", "false"
  const [sortBy, setSortBy] = useState<FeedbackSortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [result, setResult] = useState<PaginatedFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal targets
  const [messageItem, setMessageItem] = useState<FeedbackListItem | null>(null);
  const [analysisItem, setAnalysisItem] = useState<FeedbackListItem | null>(
    null,
  );

  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    let active = true;
    async function load(): Promise<void> {
      setLoading(true);
      setError(null);
      try {
        const res = await listFeedback({
          page,
          pageSize: PAGE_SIZE,
          status: status || undefined,
          source: source || undefined,
          sentiment: sentiment || undefined,
          priority: priority || undefined,
          analyzed: analyzed === "" ? undefined : analyzed === "true",
          search: debouncedSearch || undefined,
          sortBy,
          sortOrder,
        });
        if (active) setResult(res);
      } catch (err) {
        if (active) {
          setError(
            err instanceof ApiError
              ? `Couldn't load feedback (${err.status}).`
              : "Couldn't load feedback. Please try again.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [
    page,
    debouncedSearch,
    status,
    source,
    sentiment,
    priority,
    analyzed,
    sortBy,
    sortOrder,
    refreshKey,
  ]);

  async function runAction(
    id: string,
    fn: () => Promise<void>,
    failMsg: string,
  ): Promise<void> {
    setActionError(null);
    setBusyId(id);
    try {
      await fn();
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setActionError(
        err instanceof ApiError && err.status === 503
          ? "AI analysis isn't configured (set OPENAI_API_KEY on the backend)."
          : failMsg,
      );
    } finally {
      setBusyId(null);
    }
  }

  function resetTo(setter: (v: string) => void) {
    return (value: string) => {
      setter(value);
      setPage(1);
    };
  }

  function toggleSort(field: FeedbackSortField): void {
    if (sortBy === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  }

  const rows = result?.data ?? [];
  const total = result?.total ?? 0;
  const totalPages = result?.totalPages ?? 1;

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search feedback or submitter…"
          aria-label="Search feedback"
          className={`${controlClass} w-full sm:w-64`}
        />
        <FilterSelect
          label="Status"
          value={status}
          onChange={resetTo(setStatus)}
          options={FEEDBACK_STATUSES}
        />
        <FilterSelect
          label="Sentiment"
          value={sentiment}
          onChange={resetTo(setSentiment)}
          options={FEEDBACK_SENTIMENTS}
        />
        <FilterSelect
          label="Priority"
          value={priority}
          onChange={resetTo(setPriority)}
          options={FEEDBACK_PRIORITIES}
        />
        <FilterSelect
          label="Source"
          value={source}
          onChange={resetTo(setSource)}
          options={SOURCES}
        />
        <select
          value={analyzed}
          onChange={(e) => resetTo(setAnalyzed)(e.target.value)}
          aria-label="Filter by analysis state"
          className={controlClass}
        >
          <option value="">Any analysis</option>
          <option value="true">Analyzed</option>
          <option value="false">Not analyzed</option>
        </select>
      </div>

      {actionError && (
        <p
          role="alert"
          className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-300"
        >
          {actionError}
        </p>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/15">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/10 bg-zinc-50 text-xs tracking-wide text-zinc-500 uppercase dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Feedback</th>
              <th className="px-4 py-3 font-medium">Submitter</th>
              <th className="px-4 py-3 font-medium">Sentiment</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <SortableHeader
                label="Status"
                active={sortBy === "status"}
                order={sortOrder}
                onClick={() => toggleSort("status")}
              />
              <SortableHeader
                label="Submitted"
                active={sortBy === "createdAt"}
                order={sortOrder}
                onClick={() => toggleSort("createdAt")}
              />
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/10">
            {loading ? (
              <StateRow text="Loading…" />
            ) : error ? (
              <StateRow text={error} />
            ) : rows.length === 0 ? (
              <StateRow text="No feedback found." />
            ) : (
              rows.map((item) => (
                <Row
                  key={item.id}
                  item={item}
                  busy={busyId === item.id}
                  onViewMessage={() => setMessageItem(item)}
                  onViewAnalysis={() => setAnalysisItem(item)}
                  onChangeStatus={(next) =>
                    void runAction(
                      item.id,
                      () => updateFeedbackStatus(item.id, next),
                      "Couldn't update status. Please try again.",
                    )
                  }
                  onAnalyze={() =>
                    void runAction(
                      item.id,
                      () => analyzeFeedback(item.id),
                      "Analysis failed. Please try again.",
                    )
                  }
                  onArchive={() =>
                    void runAction(
                      item.id,
                      () => updateFeedbackStatus(item.id, "archived"),
                      "Couldn't archive. Please try again.",
                    )
                  }
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
        <span>
          {total === 0
            ? "0 results"
            : `Page ${result?.page ?? page} of ${totalPages} · ${total} total`}
        </span>
        <div className="flex gap-2">
          <PagerButton
            label="Previous"
            disabled={loading || (result?.page ?? page) <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          />
          <PagerButton
            label="Next"
            disabled={loading || (result?.page ?? page) >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          />
        </div>
      </div>

      <MessageModal item={messageItem} onClose={() => setMessageItem(null)} />
      <AnalysisModal
        item={analysisItem}
        onClose={() => setAnalysisItem(null)}
      />
    </div>
  );
}

function Row({
  item,
  busy,
  onViewMessage,
  onViewAnalysis,
  onChangeStatus,
  onAnalyze,
  onArchive,
}: {
  item: FeedbackListItem;
  busy: boolean;
  onViewMessage: () => void;
  onViewAnalysis: () => void;
  onChangeStatus: (next: string) => void;
  onAnalyze: () => void;
  onArchive: () => void;
}) {
  const a = item.latestAnalysis;
  return (
    <tr className="align-top transition-colors hover:bg-black/[.02] dark:hover:bg-white/[.03]">
      <td className="max-w-xs px-4 py-3">
        <div className="flex items-start gap-2">
          <p className="truncate text-black dark:text-white">{item.rawText}</p>
          <IconButton label="View full message" onClick={onViewMessage}>
            <EyeIcon />
          </IconButton>
        </div>
        <span className="text-xs text-zinc-400">{item.source}</span>
      </td>
      <td className="px-4 py-3">
        {item.submittedBy ? (
          <div className="flex flex-col">
            <span className="text-black dark:text-white">
              {item.submittedBy.name ?? "—"}
            </span>
            <span className="text-xs text-zinc-400">
              {item.submittedBy.email}
            </span>
          </div>
        ) : (
          <span className="text-zinc-400">Anonymous</span>
        )}
      </td>
      <td className="px-4 py-3">
        {a ? (
          <Tag className={sentimentClass(a.sentiment)}>
            {titleCase(a.sentiment)}
          </Tag>
        ) : (
          <span className="text-zinc-400">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        {a ? (
          <Tag className={priorityClass(a.priority)}>
            {titleCase(a.priority)}
          </Tag>
        ) : (
          <span className="text-zinc-400">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <select
          value={item.status}
          disabled={busy}
          onChange={(e) => onChangeStatus(e.target.value)}
          aria-label={`Status for ${item.id}`}
          className={`rounded-full border-0 px-2 py-1 text-xs font-medium outline-none disabled:opacity-50 ${statusClass(item.status)}`}
        >
          {FEEDBACK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {titleCase(s)}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
        {formatDate(item.createdAt)}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <IconButton
            label="View AI analysis"
            onClick={onViewAnalysis}
            disabled={!a}
          >
            <EyeIcon />
          </IconButton>
          <button
            type="button"
            onClick={onAnalyze}
            disabled={busy}
            className="rounded-md px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-zinc-400 dark:text-blue-400 dark:hover:bg-blue-950/40"
          >
            {busy ? "…" : a ? "Re-analyse" : "Analyse"}
          </button>
          {item.status !== "archived" && (
            <button
              type="button"
              onClick={onArchive}
              disabled={busy}
              className="rounded-md px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-white/10"
            >
              Archive
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function MessageModal({
  item,
  onClose,
}: {
  item: FeedbackListItem | null;
  onClose: () => void;
}) {
  return (
    <Modal open={item !== null} title="Feedback" onClose={onClose}>
      {item && (
        <div className="flex flex-col gap-4">
          <p className="text-sm whitespace-pre-wrap text-black dark:text-white">
            {item.rawText}
          </p>
          <dl className="grid grid-cols-2 gap-2 border-t border-black/10 pt-4 text-sm dark:border-white/15">
            <Meta label="Submitter">
              {item.submittedBy?.name ?? item.submittedBy?.email ?? "Anonymous"}
            </Meta>
            <Meta label="Source">{item.source}</Meta>
            <Meta label="Status">{titleCase(item.status)}</Meta>
            <Meta label="Submitted">{formatDate(item.createdAt)}</Meta>
          </dl>
        </div>
      )}
    </Modal>
  );
}

function AnalysisModal({
  item,
  onClose,
}: {
  item: FeedbackListItem | null;
  onClose: () => void;
}) {
  const a = item?.latestAnalysis ?? null;
  return (
    <Modal
      open={item !== null && a !== null}
      title="AI analysis"
      onClose={onClose}
    >
      {a && (
        <div className="flex flex-col gap-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Tag className={sentimentClass(a.sentiment)}>
              {titleCase(a.sentiment)}
            </Tag>
            <Tag className={priorityClass(a.priority)}>
              {titleCase(a.priority)} priority
            </Tag>
            <span className="text-xs text-zinc-400">
              {Math.round(a.confidence * 100)}% confidence
            </span>
          </div>

          {a.summary && (
            <div>
              <h3 className="mb-1 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                Summary
              </h3>
              <p className="text-black dark:text-white">{a.summary}</p>
            </div>
          )}

          {a.keyThemes.length > 0 && (
            <div>
              <h3 className="mb-1.5 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                Key themes
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {a.keyThemes.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs dark:bg-zinc-800"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {a.recommendedActions.length > 0 && (
            <div>
              <h3 className="mb-1.5 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                Recommended actions
              </h3>
              <ul className="list-disc space-y-1 pl-5 text-black dark:text-white">
                {a.recommendedActions.map((action, i) => (
                  <li key={i}>{action}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="border-t border-black/10 pt-3 text-xs text-zinc-400 dark:border-white/15">
            Model {a.modelUsed} · version {a.version} ·{" "}
            {formatDate(a.analyzedAt)}
          </div>
        </div>
      )}
    </Modal>
  );
}

function Meta({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs text-zinc-400">{label}</dt>
      <dd className="text-black dark:text-white">{children}</dd>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={`Filter by ${label.toLowerCase()}`}
      className={controlClass}
    >
      <option value="">All {label.toLowerCase()}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {titleCase(o)}
        </option>
      ))}
    </select>
  );
}

function SortableHeader({
  label,
  active,
  order,
  onClick,
}: {
  label: string;
  active: boolean;
  order: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <th
      className="px-4 py-3 font-medium"
      aria-sort={
        active ? (order === "asc" ? "ascending" : "descending") : "none"
      }
    >
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 tracking-wide uppercase hover:text-black dark:hover:text-white"
      >
        {label}
        <span aria-hidden className="text-[0.65rem]">
          {active ? (order === "asc" ? "▲" : "▼") : "↕"}
        </span>
      </button>
    </th>
  );
}

function StateRow({ text }: { text: string }) {
  return (
    <tr>
      <td
        colSpan={7}
        className="px-4 py-10 text-center text-zinc-500 dark:text-zinc-400"
      >
        {text}
      </td>
    </tr>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-black/5 hover:text-black disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-white/10 dark:hover:text-white"
    >
      {children}
    </button>
  );
}

function EyeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function Tag({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {children}
    </span>
  );
}

function PagerButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-full border border-black/10 px-4 py-1.5 font-medium transition-colors hover:bg-black/[.04] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15 dark:hover:bg-white/[.06]"
    >
      {label}
    </button>
  );
}

const controlClass =
  "rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none placeholder:text-zinc-400 focus:border-black/30 dark:border-white/15 dark:bg-zinc-900 dark:focus:border-white/40";

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusClass(status: string): string {
  switch (status) {
    case "reviewed":
      return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";
    case "actioned":
      return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300";
    case "archived":
      return "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
    default: // pending
      return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
  }
}

function sentimentClass(sentiment: string): string {
  switch (sentiment) {
    case "positive":
      return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300";
    case "negative":
      return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
    default:
      return "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
  }
}

function priorityClass(priority: string): string {
  switch (priority) {
    case "high":
      return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
    case "medium":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
    default:
      return "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
  }
}
