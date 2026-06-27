export default function AdminPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-6 py-16">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Admin panel</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Triage submitted feedback and review AI analysis.
        </p>
      </header>

      <div className="rounded-lg border border-dashed border-black/15 p-8 text-center text-sm text-zinc-500 dark:border-white/20 dark:text-zinc-400">
        The triage view is coming soon — it will list submitted feedback with
        its status and analysis once the backend list endpoint is available.
      </div>
    </main>
  );
}
