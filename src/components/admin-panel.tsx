"use client";

import { useAuth } from "@/components/auth-provider";
import { AuthForms } from "@/components/auth-forms";

export function AdminPanel() {
  const { user, status, logout } = useAuth();

  if (status === "loading") {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>;
  }

  if (status !== "authenticated" || !user) {
    return <AuthForms />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between rounded-lg border border-black/10 px-4 py-3 dark:border-white/15">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          Signed in as{" "}
          <span className="font-medium text-black dark:text-white">
            {user.name ?? user.email}
          </span>
        </span>
        <button
          type="button"
          onClick={logout}
          className="rounded-full border border-black/10 px-4 py-1.5 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-white/15 dark:hover:bg-white/[.06]"
        >
          Sign out
        </button>
      </div>

      <div className="rounded-lg border border-dashed border-black/15 p-8 text-center text-sm text-zinc-500 dark:border-white/20 dark:text-zinc-400">
        The triage view is coming soon — it will list submitted feedback with
        its status and analysis once the backend list endpoint is available.
      </div>
    </div>
  );
}
