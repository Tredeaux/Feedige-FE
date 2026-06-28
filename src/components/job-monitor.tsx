"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import {
  JOB_RUN_STATUSES,
  type JobRun,
  type JobSummary,
  type PaginatedJobRuns,
  listJobRuns,
  listJobs,
} from "@/lib/jobs";

const JOB_NAME = "backlog-screener";
const PAGE_SIZE = 20;
const REFRESH_MS = 15_000;

export function JobMonitor() {
  const [job, setJob] = useState<JobSummary | null>(null);
  const [runs, setRuns] = useState<PaginatedJobRuns | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Initial + dependency-driven load, plus a polling refresh. Loading is only
  // set true initially (state default), so background refreshes don't flicker.
  useEffect(() => {
    let active = true;
    async function load(): Promise<void> {
      try {
        const [jobs, runsResult] = await Promise.all([
          listJobs(),
          listJobRuns({
            name: JOB_NAME,
            page,
            pageSize: PAGE_SIZE,
            status: status || undefined,
          }),
        ]);
        if (!active) return;
        setJob(jobs.find((j) => j.name === JOB_NAME) ?? jobs[0] ?? null);
        setRuns(runsResult);
        setError(null);
      } catch (err) {
        if (active) {
          setError(
            err instanceof ApiError
              ? `Couldn't load job status (${err.status}).`
              : "Couldn't load job status. Please try again.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    const id = setInterval(() => void load(), REFRESH_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [page, status]);

  // Tick once a second so the "next run" countdown stays live.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const rows = runs?.data ?? [];
  const totalPages = runs?.totalPages ?? 1;

  return (
    <div className="flex flex-col gap-6">
      {loading && !job ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
      ) : error && !job ? (
        <p
          role="alert"
          className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-300"
        >
          {error}
        </p>
      ) : job ? (
        <StatusCard job={job} now={now} />
      ) : null}

      {/* Run log */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            Run log
          </h2>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              Live · refreshes every 15s
            </span>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              aria-label="Filter runs by outcome"
              className="rounded-md border border-black/10 bg-white px-3 py-1.5 text-sm outline-none focus:border-black/30 dark:border-white/15 dark:bg-zinc-900 dark:focus:border-white/40"
            >
              <option value="">All outcomes</option>
              {JOB_RUN_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {titleCase(s)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/15">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 bg-zinc-50 text-xs tracking-wide text-zinc-500 uppercase dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Outcome</th>
                <th className="px-4 py-3 font-medium">What it did</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 font-mono text-xs dark:divide-white/10">
              {loading && rows.length === 0 ? (
                <StateRow text="Loading…" />
              ) : error && rows.length === 0 ? (
                <StateRow text={error} />
              ) : rows.length === 0 ? (
                <StateRow text="No runs recorded yet." />
              ) : (
                rows.map((run) => <RunRow key={run.id} run={run} />)
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
          <span>
            {runs && runs.total > 0
              ? `Page ${runs.page} of ${totalPages} · ${runs.total} runs`
              : "0 runs"}
          </span>
          <div className="flex gap-2">
            <PagerButton
              label="Previous"
              disabled={(runs?.page ?? page) <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            />
            <PagerButton
              label="Next"
              disabled={(runs?.page ?? page) >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusCard({ job, now }: { job: JobSummary; now: number }) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-black/10 p-5 dark:border-white/15">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">
              {job.displayName}
            </h2>
            <HealthBadge health={job.health} />
          </div>
          <p className="mt-1 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
            {job.description}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs tracking-wide text-zinc-400 uppercase">
            Next run
          </p>
          <p className="text-sm font-medium">
            {job.enabled ? countdown(job.nextRunAt, now) : "Paused"}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
        <Stat label="Schedule" value={job.schedule} />
        <Stat
          label="Enabled"
          value={job.enabled ? "Yes" : "No"}
          tone={job.enabled ? "ok" : "warn"}
        />
        <Stat
          label="AI configured"
          value={job.aiConfigured ? "Yes" : "No"}
          tone={job.aiConfigured ? "ok" : "warn"}
        />
        <Stat label="Last run" value={lastRunLabel(job.lastRun)} />
        <Stat label="Total runs" value={String(job.totals.total)} />
        <Stat label="Succeeded" value={String(job.totals.success)} tone="ok" />
        <Stat
          label="Failed"
          value={String(job.totals.failed)}
          tone={job.totals.failed > 0 ? "warn" : undefined}
        />
        <Stat
          label="Items analysed"
          value={String(job.totals.itemsProcessed)}
        />
      </dl>
    </div>
  );
}

function RunRow({ run }: { run: JobRun }) {
  return (
    <tr className="align-top transition-colors hover:bg-black/[.02] dark:hover:bg-white/[.03]">
      <td className="px-4 py-2.5 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
        {formatDateTime(run.startedAt)}
      </td>
      <td className="px-4 py-2.5">
        <Tag className={runStatusClass(run.status)}>{run.status}</Tag>
      </td>
      <td className="max-w-md px-4 py-2.5">
        {run.error ? (
          <span className="text-red-600 dark:text-red-400">{run.error}</span>
        ) : (
          <span className="text-black dark:text-white">
            {run.detail ?? "—"}
          </span>
        )}
      </td>
      <td className="px-4 py-2.5 text-zinc-500 dark:text-zinc-400">
        {run.itemsProcessed}
      </td>
      <td className="px-4 py-2.5 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
        {run.durationMs === null ? "—" : `${run.durationMs} ms`}
      </td>
    </tr>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "ok" | "warn";
}) {
  const toneClass =
    tone === "ok"
      ? "text-green-700 dark:text-green-400"
      : tone === "warn"
        ? "text-amber-700 dark:text-amber-400"
        : "text-black dark:text-white";
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs tracking-wide text-zinc-400 uppercase">{label}</dt>
      <dd className={`font-medium ${toneClass}`}>{value}</dd>
    </div>
  );
}

function HealthBadge({ health }: { health: string }) {
  const map: Record<string, string> = {
    healthy:
      "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
    degraded: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
    disabled: "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    idle: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  };
  return <Tag className={map[health] ?? map.idle}>{titleCase(health)}</Tag>;
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

function StateRow({ text }: { text: string }) {
  return (
    <tr>
      <td
        colSpan={5}
        className="px-4 py-10 text-center font-sans text-zinc-500 dark:text-zinc-400"
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

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function runStatusClass(status: string): string {
  switch (status) {
    case "success":
      return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300";
    case "failed":
      return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
    default: // noop
      return "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
  }
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function lastRunLabel(run: JobRun | null): string {
  if (!run) return "Never";
  return `${formatDateTime(run.startedAt)} · ${run.status}`;
}

/** Human countdown to the next run, recomputed each second. */
function countdown(nextRunAt: string | null, now: number): string {
  if (!nextRunAt) return "Unknown";
  const diff = new Date(nextRunAt).getTime() - now;
  if (diff <= 0) return "Imminent…";
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `in ${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `in ${minutes}m ${seconds % 60}s`;
}
