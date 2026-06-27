import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TabNav } from "./tab-nav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("TabNav", () => {
  it("renders both tabs and marks the active route", () => {
    render(<TabNav />);

    const feedback = screen.getByRole("link", { name: "Feedback" });
    const admin = screen.getByRole("link", { name: "Admin" });

    expect(feedback).toHaveAttribute("href", "/");
    expect(admin).toHaveAttribute("href", "/admin");

    // On "/", the Feedback tab is active.
    expect(feedback).toHaveAttribute("aria-current", "page");
    expect(admin).not.toHaveAttribute("aria-current");
  });
});
