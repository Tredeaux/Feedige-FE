import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AuthUser } from "@/lib/auth";
import { AdminPanel } from "./admin-panel";

const mockUseAuth = vi.fn();

vi.mock("@/components/auth-provider", () => ({
  useAuth: () => mockUseAuth(),
}));

// Keep the embedded FeedbackTable from hitting the network.
vi.mock("@/lib/feedback", () => ({
  FEEDBACK_STATUSES: ["pending", "reviewed", "actioned", "archived"],
  listFeedback: vi.fn().mockResolvedValue({
    data: [],
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  }),
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

  it("shows the panel (with the feedback table) for an admin", () => {
    mockUseAuth.mockReturnValue({
      user: asUser("admin"),
      status: "authenticated",
      logout: vi.fn(),
    });

    render(<AdminPanel />);
    expect(screen.getByText(/signed in as/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Search feedback")).toBeInTheDocument();
  });
});
