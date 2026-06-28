import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PaginatedFeedback } from "@/lib/feedback";
import { listFeedback } from "@/lib/feedback";
import { FeedbackTable } from "./feedback-table";

vi.mock("@/lib/feedback", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/feedback")>();
  return { ...actual, listFeedback: vi.fn() };
});

const mockedList = vi.mocked(listFeedback);

const page: PaginatedFeedback = {
  data: [
    {
      id: "f1",
      rawText: "The export keeps timing out on large reports.",
      source: "web",
      status: "pending",
      submittedBy: { id: "u1", name: "Sam Customer", email: "sam@example.com" },
      latestAnalysis: {
        sentiment: "negative",
        priority: "high",
        summary: "Exports time out on large reports.",
        confidence: 0.9,
        keyThemes: ["export", "performance"],
        recommendedActions: ["Fix the export timeout"],
        modelUsed: "gpt-4o-mini",
        version: 1,
        analyzedAt: "2026-01-01T00:00:00.000Z",
      },
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ],
  page: 1,
  pageSize: 20,
  total: 1,
  totalPages: 1,
};

describe("FeedbackTable", () => {
  beforeEach(() => mockedList.mockReset());

  it("renders rows with separate sentiment/priority columns and status", async () => {
    mockedList.mockResolvedValue(page);
    render(<FeedbackTable />);

    expect(
      await screen.findByText(/export keeps timing out/i),
    ).toBeInTheDocument();
    expect(screen.getByText("sam@example.com")).toBeInTheDocument();
    const statusSelect = screen.getByLabelText(
      "Status for f1",
    ) as HTMLSelectElement;
    expect(statusSelect.value).toBe("pending");
    // Scope to the row tags (spans) — these labels also appear in filter options.
    expect(
      screen.getByText("Negative", { selector: "span" }),
    ).toBeInTheDocument();
    expect(screen.getByText("High", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByText(/Page 1 of 1 · 1 total/)).toBeInTheDocument();
  });

  it("opens the AI analysis modal with summary, themes, and actions", async () => {
    const user = userEvent.setup();
    mockedList.mockResolvedValue(page);
    render(<FeedbackTable />);

    await screen.findByText(/export keeps timing out/i);
    await user.click(screen.getByRole("button", { name: "View AI analysis" }));

    expect(
      await screen.findByText("Exports time out on large reports."),
    ).toBeInTheDocument();
    expect(screen.getByText("Fix the export timeout")).toBeInTheDocument();
    expect(screen.getByText("performance")).toBeInTheDocument();
  });

  it("shows an empty state when there is no feedback", async () => {
    mockedList.mockResolvedValue({ ...page, data: [], total: 0 });
    render(<FeedbackTable />);

    expect(await screen.findByText("No feedback found.")).toBeInTheDocument();
  });
});
