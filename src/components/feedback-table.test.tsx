import { render, screen } from "@testing-library/react";
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
      latestAnalysis: { sentiment: "negative", priority: "high" },
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

  it("renders feedback rows with status and analysis tags", async () => {
    mockedList.mockResolvedValue(page);
    render(<FeedbackTable />);

    expect(
      await screen.findByText(/export keeps timing out/i),
    ).toBeInTheDocument();
    expect(screen.getByText("sam@example.com")).toBeInTheDocument();
    // Status is an editable <select> reflecting the row's current status.
    const statusSelect = screen.getByLabelText(
      "Status for f1",
    ) as HTMLSelectElement;
    expect(statusSelect.value).toBe("pending");
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText(/Page 1 of 1 · 1 total/)).toBeInTheDocument();
  });

  it("shows an empty state when there is no feedback", async () => {
    mockedList.mockResolvedValue({ ...page, data: [], total: 0 });
    render(<FeedbackTable />);

    expect(await screen.findByText("No feedback found.")).toBeInTheDocument();
  });
});
