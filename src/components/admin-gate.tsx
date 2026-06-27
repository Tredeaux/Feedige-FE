"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { AuthForms } from "@/components/auth-forms";
import { PANEL_ROLES } from "@/lib/auth";

const subTabs = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/feedback", label: "All feedback" },
];

/**
 * Auth gate + shared chrome for the admin area. Renders the sign-in form when
 * unauthenticated, a no-access notice for non-triage users, and otherwise the
 * header, sub-navigation (Dashboard / All feedback), and the page content.
 */
export function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, status, logout } = useAuth();
  const pathname = usePathname();

  if (status === "loading") {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
      </main>
    );
  }

  if (status !== "authenticated" || !user) {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-6 py-16">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Admin panel</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Sign in to triage submitted feedback and review AI analysis.
          </p>
        </header>
        <AuthForms />
      </main>
    );
  }

  if (!PANEL_ROLES.includes(user.role)) {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-6 py-16">
        <div className="flex flex-col gap-4 rounded-lg border border-black/10 p-6 dark:border-white/15">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            You&apos;re signed in as{" "}
            <span className="font-medium text-black dark:text-white">
              {user.name ?? user.email}
            </span>
            , but your account doesn&apos;t have triage access. Ask an
            administrator to grant it.
          </p>
          <button
            type="button"
            onClick={logout}
            className="self-start rounded-full border border-black/10 px-4 py-1.5 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-white/15 dark:hover:bg-white/[.06]"
          >
            Sign out
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
          <span>
            Signed in as{" "}
            <span className="font-medium text-black dark:text-white">
              {user.name ?? user.email}
            </span>
          </span>
          <button
            type="button"
            onClick={logout}
            className="rounded-full border border-black/10 px-3 py-1 font-medium transition-colors hover:bg-black/[.04] dark:border-white/15 dark:hover:bg-white/[.06]"
          >
            Sign out
          </button>
        </div>
      </div>

      <nav className="flex gap-1 border-b border-black/10 dark:border-white/15">
        {subTabs.map((tab) => {
          const active =
            tab.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? "border-foreground text-foreground"
                  : "hover:text-foreground border-transparent text-zinc-500 dark:text-zinc-400"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </main>
  );
}
