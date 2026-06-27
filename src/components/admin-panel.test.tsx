import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AuthUser } from "@/lib/auth";
import { AdminPanel } from "./admin-panel";

const mockUseAuth = vi.fn();

vi.mock("@/components/auth-provider", () => ({
  useAuth: () => mockUseAuth(),
}));

function asUser(role: string): AuthUser {
  return { id: "u1", name: "Test User", email: "test@feedige.dev", role };
}

afterEach(() => mockUseAuth.mockReset());

describe("AdminPanel", () => {
  it("denies access to an authenticated non-triage user", () => {
    mockUseAuth.mockReturnValue({
      user: asUser("member"),
      status: "authenticated",
      logout: vi.fn(),
    });

    render(<AdminPanel />);
    expect(screen.getByText(/doesn't have triage access/i)).toBeInTheDocument();
  });

  it("shows the panel for an admin", () => {
    mockUseAuth.mockReturnValue({
      user: asUser("admin"),
      status: "authenticated",
      logout: vi.fn(),
    });

    render(<AdminPanel />);
    expect(screen.getByText(/signed in as/i)).toBeInTheDocument();
    expect(screen.getByText(/triage view is coming soon/i)).toBeInTheDocument();
  });
});
