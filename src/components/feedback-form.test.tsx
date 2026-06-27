import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FeedbackForm } from "./feedback-form";

describe("FeedbackForm", () => {
  it("unlocks fields in sequence and enables submit only when all are valid", async () => {
    const user = userEvent.setup();
    render(<FeedbackForm />);

    const name = screen.getByLabelText(/your name/i);
    const email = screen.getByLabelText(/email address/i);
    const message = screen.getByLabelText(/your feedback/i);
    const submit = screen.getByRole("button", { name: /submit feedback/i });

    // Initially only the name field is interactive.
    expect(name).toBeEnabled();
    expect(email).toBeDisabled();
    expect(message).toBeDisabled();
    expect(submit).toBeDisabled();

    // A too-short name does not unlock email.
    await user.type(name, "J");
    expect(email).toBeDisabled();

    // A valid name unlocks email (but not the message yet).
    await user.type(name, "ane Doe");
    expect(email).toBeEnabled();
    expect(message).toBeDisabled();

    // An invalid email keeps the message locked.
    await user.type(email, "not-an-email");
    expect(message).toBeDisabled();

    // A valid email unlocks the message; submit still disabled.
    await user.clear(email);
    await user.type(email, "jane@example.com");
    expect(message).toBeEnabled();
    expect(submit).toBeDisabled();

    // Enough feedback enables submit.
    await user.type(message, "This is genuinely useful feedback.");
    expect(submit).toBeEnabled();
  });

  it("shows a validation error after blurring an invalid field", async () => {
    const user = userEvent.setup();
    render(<FeedbackForm />);

    const name = screen.getByLabelText(/your name/i);
    await user.type(name, "J");
    await user.tab(); // blur

    expect(
      await screen.findByText(/at least 2 characters/i),
    ).toBeInTheDocument();
  });
});
