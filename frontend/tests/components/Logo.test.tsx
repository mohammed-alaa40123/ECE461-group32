import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import Logo from "../../src/components/Logo";

afterEach(() => {
  cleanup();
});

// Unit tests for the Logo component
describe("Logo Component", () => {
  it("renders the logo component", () => {
    const { unmount } = render(<Logo />);
    const logoElement = screen.getByAltText(/logo/i);
    expect(logoElement).toBeInTheDocument();
    expect(logoElement).toHaveClass("w-12 h-12");
    unmount();
  });

  it("renders the container with the correct class name", () => {
    const { unmount } = render(<Logo />);
    const container = screen.getByRole("img").parentElement;
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass("flex items-center");
    unmount();
  });
});
