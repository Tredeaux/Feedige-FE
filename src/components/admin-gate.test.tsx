import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AuthUser } from "@/lib/auth";
import { AdminGate } from "./admin-gate";

const mockUseAuth = vi.fn();

vi.mock("@/components/auth-provider", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin",
}));

function asUser(role: string): AuthUser {
  return { id: "u1", name: "Test User", email: "test@feedige.dev", role };
}

afterEach(() => mockUseAuth.mockReset());

describe("AdminGate", () => {
  it("blocks an authenticated non-triage user", () => {
    mockUseAuth.mockReturnValue({
      user: asUser("member"),
      status: "authenticated",
      logout: vi.fn(),
    });

    render(
      <AdminGate>
        <div>PAGE CONTENT</div>
      </AdminGate>,
    );

    expect(screen.getByText(/doesn't have triage access/i)).toBeInTheDocument();
    expect(screen.queryByText("PAGE CONTENT")).not.toBeInTheDocument();
  });

  it("renders sub-nav and page content for a triager", () => {
    mockUseAuth.mockReturnValue({
      user: asUser("triage"),
      status: "authenticated",
      logout: vi.fn(),
    });

    render(
      <AdminGate>
        <div>PAGE CONTENT</div>
      </AdminGate>,
    );

    expect(screen.getByText("PAGE CONTENT")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "All feedback" }),
    ).toBeInTheDocument();
  });
});
