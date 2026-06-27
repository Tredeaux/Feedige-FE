import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { type FeedbackStats, getFeedbackStats } from "@/lib/feedback";
import { Dashboard } from "./dashboard";

vi.mock("@/lib/feedback", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/feedback")>();
  return { ...actual, getFeedbackStats: vi.fn() };
});

const mocked = vi.mocked(getFeedbackStats);

const stats: FeedbackStats = {
  totalFeedback: 10,
  analyzedFeedback: 6,
  unanalyzedFeedback: 4,
  averageConfidence: 0.8,
  byStatus: [
    { label: "pending", count: 4 },
    { label: "reviewed", count: 6 },
  ],
  bySentiment: [
    { label: "positive", count: 2 },
    { label: "negative", count: 4 },
  ],
  byPriority: [{ label: "high", count: 3 }],
  topThemes: [{ theme: "performance", count: 5 }],
  volumeByDay: [
    { date: "2026-06-26", count: 2 },
    { date: "2026-06-27", count: 8 },
  ],
};

describe("Dashboard", () => {
  beforeEach(() => mocked.mockReset());

  it("renders the stat cards and charts", async () => {
    mocked.mockResolvedValue(stats);
    render(<Dashboard />);

    expect(await screen.findByText("Total feedback")).toBeInTheDocument();
    expect(screen.getByText("Sentiment")).toBeInTheDocument();
    expect(screen.getByText("Priority")).toBeInTheDocument();
    expect(screen.getByText("Top themes")).toBeInTheDocument();
    expect(screen.getByText("performance")).toBeInTheDocument();
    expect(screen.getByText("Feedback volume")).toBeInTheDocument();
  });
});
