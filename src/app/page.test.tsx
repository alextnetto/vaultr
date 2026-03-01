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

  it("renders all six feature cards", () => {
    render(<HomePage />);
    expect(screen.getByText("Encrypted Vault")).toBeInTheDocument();
    expect(screen.getByText("Selective Sharing")).toBeInTheDocument();
    expect(screen.getByText("Expiring Links")).toBeInTheDocument();
    expect(screen.getByText("Any Data Type")).toBeInTheDocument();
    expect(screen.getByText("Zero Friction")).toBeInTheDocument();
    expect(screen.getByText("Free & Private")).toBeInTheDocument();
  });

  it("renders the Vaultr brand", () => {
    render(<HomePage />);
    expect(screen.getAllByText("Vaultr").length).toBeGreaterThanOrEqual(1);
  });

  it("renders the how-it-works section", () => {
    render(<HomePage />);
    expect(screen.getByText("How it works")).toBeInTheDocument();
    expect(screen.getByText("Create your vault")).toBeInTheDocument();
    expect(screen.getByText("Store your data")).toBeInTheDocument();
    expect(screen.getByText("Share with a link")).toBeInTheDocument();
  });

  it("renders the CTA section", () => {
    render(<HomePage />);
    expect(screen.getByText(/ready to take control/i)).toBeInTheDocument();
  });

  it("renders AES-256 badge", () => {
    render(<HomePage />);
    expect(screen.getByText("AES-256 encrypted")).toBeInTheDocument();
  });
});
