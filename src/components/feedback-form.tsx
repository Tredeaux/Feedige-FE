"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { ApiError } from "@/lib/api";
import {
  emailSchema,
  feedbackSchema,
  messageSchema,
  nameSchema,
  submitFeedback,
  type FeedbackInput,
} from "@/lib/feedback";

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success" }
  | { status: "error"; message: string };

const MAX_MESSAGE = 2000;

export function FeedbackForm() {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, touchedFields },
  } = useForm<FeedbackInput>({
    resolver: zodResolver(feedbackSchema),
    mode: "onTouched",
    defaultValues: { name: "", email: "", message: "" },
  });

  const [submit, setSubmit] = useState<SubmitState>({ status: "idle" });

  // Live per-field validity drives the sequential unlock (independent of when
  // react-hook-form surfaces error messages, which is on blur). useWatch is the
  // React-Compiler-friendly subscription API.
  const name = useWatch({ control, name: "name" });
  const email = useWatch({ control, name: "email" });
  const message = useWatch({ control, name: "message" });
  const isNameValid = nameSchema.safeParse(name).success;
  const isEmailValid = emailSchema.safeParse(email).success;
  const isMessageValid = messageSchema.safeParse(message).success;

  const emailUnlocked = isNameValid;
  const messageUnlocked = isNameValid && isEmailValid;
  const canSubmit =
    isNameValid &&
    isEmailValid &&
    isMessageValid &&
    submit.status !== "submitting";

  const onSubmit = handleSubmit(async (data) => {
    setSubmit({ status: "submitting" });
    try {
      await submitFeedback(data);
      setSubmit({ status: "success" });
      reset();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? `Submission failed (${err.status}). Please try again.`
          : "Couldn't reach the server. Please try again.";
      setSubmit({ status: "error", message: msg });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <Field
        step={1}
        unlocked
        complete={isNameValid}
        htmlFor="name"
        label="Your name"
        error={touchedFields.name ? errors.name?.message : undefined}
      >
        <input
          id="name"
          type="text"
          autoComplete="name"
          placeholder="Jane Doe"
          aria-invalid={Boolean(touchedFields.name && errors.name)}
          className={inputClass}
          {...register("name")}
        />
      </Field>

      <Field
        step={2}
        unlocked={emailUnlocked}
        complete={isEmailValid}
        htmlFor="email"
        label="Email address"
        hint={!emailUnlocked ? "Fill in your name to continue" : undefined}
        error={touchedFields.email ? errors.email?.message : undefined}
      >
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="jane@example.com"
          disabled={!emailUnlocked}
          aria-invalid={Boolean(touchedFields.email && errors.email)}
          className={inputClass}
          {...register("email")}
        />
      </Field>

      <Field
        step={3}
        unlocked={messageUnlocked}
        complete={isMessageValid}
        htmlFor="message"
        label="Your feedback"
        hint={!messageUnlocked ? "Add your email to continue" : undefined}
        error={touchedFields.message ? errors.message?.message : undefined}
        meta={
          messageUnlocked
            ? `${(message ?? "").length}/${MAX_MESSAGE}`
            : undefined
        }
      >
        <textarea
          id="message"
          rows={5}
          maxLength={MAX_MESSAGE}
          placeholder="Tell us what's working, what isn't, or what you'd love to see…"
          disabled={!messageUnlocked}
          aria-invalid={Boolean(touchedFields.message && errors.message)}
          className={`${inputClass} resize-y`}
          {...register("message")}
        />
      </Field>

      {submit.status === "success" && (
        <p
          role="status"
          className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-300"
        >
          Thanks! Your feedback has been submitted.
        </p>
      )}
      {submit.status === "error" && (
        <p
          role="alert"
          className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-300"
        >
          {submit.message}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="bg-foreground text-background inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submit.status === "submitting" ? "Submitting…" : "Submit feedback"}
      </button>
    </form>
  );
}

const inputClass =
  "w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-black outline-none transition-colors placeholder:text-zinc-400 focus:border-black/30 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400 dark:border-white/15 dark:bg-zinc-900 dark:text-white dark:focus:border-white/40 dark:disabled:bg-zinc-900/50";

interface FieldProps {
  step: number;
  unlocked: boolean;
  complete: boolean;
  htmlFor: string;
  label: string;
  hint?: string;
  error?: string;
  meta?: string;
  children: React.ReactNode;
}

function Field({
  step,
  unlocked,
  complete,
  htmlFor,
  label,
  hint,
  error,
  meta,
  children,
}: FieldProps) {
  return (
    <div
      className={`flex flex-col gap-1.5 transition-opacity ${unlocked ? "opacity-100" : "opacity-50"}`}
    >
      <div className="flex items-center justify-between">
        <label
          htmlFor={htmlFor}
          className="flex items-center gap-2 text-sm font-medium"
        >
          <span
            aria-hidden
            className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
              complete
                ? "bg-green-600 text-white"
                : "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
            }`}
          >
            {complete ? "✓" : step}
          </span>
          {label}
        </label>
        {meta && <span className="text-xs text-zinc-400">{meta}</span>}
      </div>
      {children}
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : (
        hint && <p className="text-xs text-zinc-400">{hint}</p>
      )}
    </div>
  );
}
