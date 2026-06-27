"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import {
  FEEDBACK_STATUSES,
  type FeedbackListItem,
  type FeedbackSortField,
  type PaginatedFeedback,
  listFeedback,
} from "@/lib/feedback";

const PAGE_SIZE = 20;

export function FeedbackTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState<FeedbackSortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [result, setResult] = useState<PaginatedFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce the search input; reset to the first page when it changes.
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
  }, [page, debouncedSearch, status, sortBy, sortOrder]);

  function changeStatus(value: string): void {
    setStatus(value);
    setPage(1);
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
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search feedback or submitter…"
          aria-label="Search feedback"
          className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none placeholder:text-zinc-400 focus:border-black/30 sm:max-w-xs dark:border-white/15 dark:bg-zinc-900 dark:focus:border-white/40"
        />
        <select
          value={status}
          onChange={(e) => changeStatus(e.target.value)}
          aria-label="Filter by status"
          className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/15 dark:bg-zinc-900 dark:focus:border-white/40"
        >
          <option value="">All statuses</option>
          {FEEDBACK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {titleCase(s)}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/15">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/10 bg-zinc-50 text-xs tracking-wide text-zinc-500 uppercase dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Feedback</th>
              <th className="px-4 py-3 font-medium">Submitter</th>
              <SortableHeader
                label="Status"
                active={sortBy === "status"}
                order={sortOrder}
                onClick={() => toggleSort("status")}
              />
              <th className="px-4 py-3 font-medium">Analysis</th>
              <SortableHeader
                label="Submitted"
                active={sortBy === "createdAt"}
                order={sortOrder}
                onClick={() => toggleSort("createdAt")}
              />
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
              rows.map((item) => <Row key={item.id} item={item} />)
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
    </div>
  );
}

function Row({ item }: { item: FeedbackListItem }) {
  return (
    <tr className="align-top transition-colors hover:bg-black/[.02] dark:hover:bg-white/[.03]">
      <td className="max-w-md px-4 py-3">
        <p className="line-clamp-2 text-black dark:text-white">
          {item.rawText}
        </p>
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
        <Tag className={statusClass(item.status)}>{titleCase(item.status)}</Tag>
      </td>
      <td className="px-4 py-3">
        {item.latestAnalysis ? (
          <div className="flex flex-wrap gap-1">
            <Tag className={sentimentClass(item.latestAnalysis.sentiment)}>
              {titleCase(item.latestAnalysis.sentiment)}
            </Tag>
            <Tag className={priorityClass(item.latestAnalysis.priority)}>
              {titleCase(item.latestAnalysis.priority)}
            </Tag>
          </div>
        ) : (
          <span className="text-zinc-400">Not analysed</span>
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
        {formatDate(item.createdAt)}
      </td>
    </tr>
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
        colSpan={5}
        className="px-4 py-10 text-center text-zinc-500 dark:text-zinc-400"
      >
        {text}
      </td>
    </tr>
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
