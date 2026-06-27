import { AdminPanel } from "@/components/admin-panel";

export default function AdminPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-6 py-16">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Admin panel</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Sign in to triage submitted feedback and review AI analysis.
        </p>
      </header>

      <AdminPanel />
    </main>
  );
}
