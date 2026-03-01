import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import HomePage from "./page";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/components/theme-toggle", () => ({
  ThemeToggle: () => <button>Theme</button>,
}));

describe("HomePage", () => {
  it("renders the hero heading", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/stored once/i)).toBeInTheDocument();
  });

  it("renders sign in and get started links", () => {
    render(<HomePage />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/login");
    expect(hrefs).toContain("/register");
  });

  it("renders three feature cards", () => {
    render(<HomePage />);
    expect(screen.getByText("Encrypted Vault")).toBeInTheDocument();
    expect(screen.getByText("Selective Sharing")).toBeInTheDocument();
    expect(screen.getByText("Expiring Links")).toBeInTheDocument();
  });

  it("renders the Vaultr brand", () => {
    render(<HomePage />);
    expect(screen.getAllByText("Vaultr").length).toBeGreaterThanOrEqual(1);
  });
});
