"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/components/auth-provider";
import { ApiError } from "@/lib/api";
import {
  type LoginInput,
  type RegisterInput,
  loginSchema,
  registerSchema,
} from "@/lib/auth";

const inputClass =
  "w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-black outline-none transition-colors placeholder:text-zinc-400 focus:border-black/30 dark:border-white/15 dark:bg-zinc-900 dark:text-white dark:focus:border-white/40";

const buttonClass =
  "inline-flex h-11 w-full items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-opacity disabled:cursor-not-allowed disabled:opacity-40";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-600 dark:text-red-400">{message}</p>;
}

export function AuthForms() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  return (
    <div className="rounded-lg border border-black/10 p-6 dark:border-white/15">
      <div className="mb-6 flex gap-1 rounded-full bg-zinc-100 p-1 text-sm dark:bg-zinc-800">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`flex-1 rounded-full px-4 py-1.5 font-medium transition-colors ${
            mode === "signin"
              ? "bg-white shadow-sm dark:bg-zinc-700"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 rounded-full px-4 py-1.5 font-medium transition-colors ${
            mode === "signup"
              ? "bg-white shadow-sm dark:bg-zinc-700"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          Sign up
        </button>
      </div>

      {mode === "signin" ? <SignInForm /> : <SignUpForm />}
    </div>
  );
}

function SignInForm() {
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const [error, setError] = useState<string | null>(null);

  const onSubmit = handleSubmit(async (data) => {
    setError(null);
    try {
      await login(data);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? "Invalid email or password."
          : "Couldn't sign in. Please try again.",
      );
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="signin-email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="signin-email"
          type="email"
          autoComplete="email"
          className={inputClass}
          {...register("email")}
        />
        <FieldError message={errors.email?.message} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="signin-password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="signin-password"
          type="password"
          autoComplete="current-password"
          className={inputClass}
          {...register("password")}
        />
        <FieldError message={errors.password?.message} />
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <button type="submit" disabled={isSubmitting} className={buttonClass}>
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

function SignUpForm() {
  const { register: registerUser } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });
  const [error, setError] = useState<string | null>(null);

  const onSubmit = handleSubmit(async (data) => {
    setError(null);
    try {
      await registerUser(data);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 409
          ? "An account with this email already exists."
          : "Couldn't create your account. Please try again.",
      );
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="signup-name" className="text-sm font-medium">
          Name
        </label>
        <input
          id="signup-name"
          type="text"
          autoComplete="name"
          className={inputClass}
          {...register("name")}
        />
        <FieldError message={errors.name?.message} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="signup-email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="signup-email"
          type="email"
          autoComplete="email"
          className={inputClass}
          {...register("email")}
        />
        <FieldError message={errors.email?.message} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="signup-password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          className={inputClass}
          {...register("password")}
        />
        <FieldError message={errors.password?.message} />
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <button type="submit" disabled={isSubmitting} className={buttonClass}>
        {isSubmitting ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
