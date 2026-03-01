import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "./theme-toggle";
import { ThemeProvider } from "./theme-provider";

function renderThemeToggle() {
  return render(
    <ThemeProvider defaultTheme="dark" storageKey="test-theme">
      <ThemeToggle />
    </ThemeProvider>,
  );
}

describe("ThemeToggle", () => {
  it("renders a button", () => {
    renderThemeToggle();
    expect(screen.getByRole("button", { name: /toggle theme/i })).toBeInTheDocument();
  });

  it("has accessible label", () => {
    renderThemeToggle();
    expect(screen.getByText("Toggle theme")).toBeInTheDocument();
  });
});
