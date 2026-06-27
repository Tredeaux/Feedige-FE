"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { type FeedbackStats, getFeedbackStats } from "@/lib/feedback";

export function Dashboard() {
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load(): Promise<void> {
      setLoading(true);
      setError(null);
      try {
        const data = await getFeedbackStats();
        if (active) setStats(data);
      } catch (err) {
        if (active) {
          setError(
            err instanceof ApiError
              ? `Couldn't load stats (${err.status}).`
              : "Couldn't load stats. Please try again.",
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
  }, []);

  if (loading) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>;
  }
  if (error || !stats) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        {error ?? "No data."}
      </p>
    );
  }

  const analyzedPct =
    stats.totalFeedback > 0
      ? Math.round((stats.analyzedFeedback / stats.totalFeedback) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total feedback" value={stats.totalFeedback} />
        <StatCard
          label="Analyzed"
          value={stats.analyzedFeedback}
          hint={`${analyzedPct}%`}
        />
        <StatCard label="Backlog" value={stats.unanalyzedFeedback} />
        <StatCard
          label="Avg confidence"
          value={
            stats.averageConfidence === null
              ? "—"
              : `${Math.round(stats.averageConfidence * 100)}%`
          }
        />
      </div>

      {/* Distributions */}
      <div className="grid gap-4 md:grid-cols-3">
        <BarChart
          title="Sentiment"
          buckets={stats.bySentiment}
          colorFor={sentimentColor}
        />
        <BarChart
          title="Priority"
          buckets={stats.byPriority}
          colorFor={priorityColor}
        />
        <BarChart
          title="Status"
          buckets={stats.byStatus}
          colorFor={() => "bg-zinc-400"}
        />
      </div>

      {/* Top themes */}
      <div className="rounded-lg border border-black/10 p-4 dark:border-white/15">
        <h2 className="mb-3 text-sm font-semibold">Top themes</h2>
        {stats.topThemes.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No analysed feedback yet.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {stats.topThemes.map((t) => (
              <span
                key={t.theme}
                className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-sm dark:bg-zinc-800"
              >
                {t.theme}
                <span className="rounded-full bg-black/10 px-1.5 text-xs dark:bg-white/15">
                  {t.count}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-black/10 p-4 dark:border-white/15">
      <div className="text-xs text-zinc-500 dark:text-zinc-400">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-semibold">{value}</span>
        {hint && <span className="text-xs text-zinc-400">{hint}</span>}
      </div>
    </div>
  );
}

function BarChart({
  title,
  buckets,
  colorFor,
}: {
  title: string;
  buckets: { label: string; count: number }[];
  colorFor: (label: string) => string;
}) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return (
    <div className="rounded-lg border border-black/10 p-4 dark:border-white/15">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      <div className="flex flex-col gap-2">
        {buckets.map((b) => (
          <div key={b.label} className="flex items-center gap-2 text-sm">
            <span className="w-20 shrink-0 text-zinc-500 capitalize dark:text-zinc-400">
              {b.label}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
              <div
                className={`h-full rounded-full ${colorFor(b.label)}`}
                style={{ width: `${(b.count / max) * 100}%` }}
              />
            </div>
            <span className="w-6 shrink-0 text-right tabular-nums">
              {b.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function sentimentColor(label: string): string {
  if (label === "positive") return "bg-green-500";
  if (label === "negative") return "bg-red-500";
  return "bg-zinc-400";
}

function priorityColor(label: string): string {
  if (label === "high") return "bg-red-500";
  if (label === "medium") return "bg-amber-500";
  return "bg-zinc-400";
}
