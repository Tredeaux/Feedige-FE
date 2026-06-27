"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Feedback" },
  { href: "/admin", label: "Admin" },
] as const;

/** Top navigation tabs: Feedback (the submission form) and Admin (triage). */
export function TabNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="border-b border-black/10 dark:border-white/15"
    >
      <div className="mx-auto flex w-full max-w-xl gap-1 px-6">
        {tabs.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`-mb-px border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                active
                  ? "border-foreground text-foreground"
                  : "hover:text-foreground border-transparent text-zinc-500 dark:text-zinc-400"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
