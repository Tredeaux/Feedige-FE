import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AuthProvider } from "./auth-provider";
import { AuthForms } from "./auth-forms";

function renderForms() {
  return render(
    <AuthProvider>
      <AuthForms />
    </AuthProvider>,
  );
}

describe("AuthForms", () => {
  it("shows the sign-in form by default and toggles to sign-up", async () => {
    const user = userEvent.setup();
    renderForms();

    // Sign in mode: email + password, no name.
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();

    // Toggle to sign up: a Name field appears.
    await user.click(screen.getByRole("button", { name: "Sign up" }));
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create account" }),
    ).toBeInTheDocument();
  });
});
