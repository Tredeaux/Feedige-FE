import { FeedbackForm } from "@/components/feedback-form";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-8 px-6 py-16">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Share your feedback
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Tell us what&apos;s working, what isn&apos;t, or what you&apos;d love
          to see. We read every word.
        </p>
      </header>
      <FeedbackForm />
    </main>
  );
}
