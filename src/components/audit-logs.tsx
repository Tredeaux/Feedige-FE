"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import {
  type AuditLogItem,
  type PaginatedAudit,
  getAuditActions,
  listAuditLogs,
} from "@/lib/audit";

const PAGE_SIZE = 20;

export function AuditLogs() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [actions, setActions] = useState<string[]>([]);
  const [result, setResult] = useState<PaginatedAudit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Populate the action filter once.
  useEffect(() => {
    void getAuditActions()
      .then(setActions)
      .catch(() => setActions([]));
  }, []);

  // Debounce the free-text search; reset to first page on change.
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
        const res = await listAuditLogs({
          page,
          pageSize: PAGE_SIZE,
          action: action || undefined,
          search: debouncedSearch || undefined,
          from: from ? new Date(from).toISOString() : undefined,
          to: to ? new Date(to).toISOString() : undefined,
        });
        if (active) setResult(res);
      } catch (err) {
        if (active) {
          setError(
            err instanceof ApiError
              ? `Couldn't load logs (${err.status}).`
              : "Couldn't load logs. Please try again.",
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
  }, [page, action, debouncedSearch, from, to]);

  const rows = result?.data ?? [];
  const totalPages = result?.totalPages ?? 1;

  function resetFilters(): void {
    setAction("");
    setSearch("");
    setFrom("");
    setTo("");
    setPage(1);
  }

  const hasFilters = Boolean(action || search || from || to);

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search action, notes, or actor…"
          aria-label="Search audit logs"
          className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none placeholder:text-zinc-400 focus:border-black/30 sm:max-w-xs dark:border-white/15 dark:bg-zinc-900 dark:focus:border-white/40"
        />
        <select
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by action"
          className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/15 dark:bg-zinc-900 dark:focus:border-white/40"
        >
          <option value="">All actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>
              {humanize(a)}
            </option>
          ))}
        </select>
        <DateField label="From" value={from} onChange={setFrom} />
        <DateField label="To" value={to} onChange={setTo} />
        {hasFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="self-start rounded-full border border-black/10 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-white/15 dark:hover:bg-white/[.06]"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/15">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/10 bg-zinc-50 text-xs tracking-wide text-zinc-500 uppercase dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Actor</th>
              <th className="px-4 py-3 font-medium">Target</th>
              <th className="px-4 py-3 font-medium">Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/10">
            {loading ? (
              <StateRow text="Loading…" />
            ) : error ? (
              <StateRow text={error} />
            ) : rows.length === 0 ? (
              <StateRow text="No log entries found." />
            ) : (
              rows.map((item) => <LogRow key={item.id} item={item} />)
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
        <span>
          {result && result.total > 0
            ? `Page ${result.page} of ${totalPages} · ${result.total} entries`
            : "0 entries"}
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

function LogRow({ item }: { item: AuditLogItem }) {
  return (
    <tr className="align-top transition-colors hover:bg-black/[.02] dark:hover:bg-white/[.03]">
      <td className="px-4 py-3 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
        {formatDateTime(item.createdAt)}
      </td>
      <td className="px-4 py-3">
        <Tag className={actionClass(item.action)}>{humanize(item.action)}</Tag>
      </td>
      <td className="px-4 py-3">
        {item.user ? (
          <div className="flex flex-col">
            <span className="text-black dark:text-white">
              {item.user.name ?? "—"}
            </span>
            <span className="text-xs text-zinc-400">{item.user.email}</span>
          </div>
        ) : (
          <span className="text-zinc-400">System</span>
        )}
      </td>
      <td className="max-w-xs px-4 py-3">
        {item.feedback ? (
          <span className="line-clamp-2 text-zinc-600 dark:text-zinc-300">
            {item.feedback.excerpt}
          </span>
        ) : (
          <span className="text-zinc-400">—</span>
        )}
      </td>
      <td className="max-w-sm px-4 py-3">
        <Change oldValue={item.oldValue} newValue={item.newValue} />
        {item.notes && (
          <p className="mt-1 text-xs text-zinc-400">{item.notes}</p>
        )}
      </td>
    </tr>
  );
}

function Change({
  oldValue,
  newValue,
}: {
  oldValue: unknown;
  newValue: unknown;
}) {
  const before = formatValue(oldValue);
  const after = formatValue(newValue);
  if (!before && !after) return <span className="text-zinc-400">—</span>;
  return (
    <span className="font-mono text-xs">
      {before && <span className="text-zinc-400 line-through">{before}</span>}
      {before && after && <span className="text-zinc-400"> → </span>}
      {after && <span className="text-black dark:text-white">{after}</span>}
    </span>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-zinc-400">
      {label}
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`${label} date`}
        className="rounded-md border border-black/10 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-black/30 dark:border-white/15 dark:bg-zinc-900 dark:text-white dark:focus:border-white/40"
      />
    </label>
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
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${className}`}
    >
      {children}
    </span>
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

function humanize(action: string): string {
  return action
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Render a JSON audit value compactly as `key=value` pairs (or a scalar). */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${k}=${String(v)}`)
      .join(", ");
  }
  return String(value);
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function actionClass(action: string): string {
  if (action.includes("created") || action.includes("registered")) {
    return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300";
  }
  if (action.includes("changed") || action.includes("re_analyzed")) {
    return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";
  }
  if (action.includes("deleted") || action.includes("failed")) {
    return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
  }
  return "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
}
