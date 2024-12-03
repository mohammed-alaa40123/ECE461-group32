import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import Loading from "../../../src/components/ui/loading";
import "@testing-library/jest-dom/vitest";

afterEach(() => {
  cleanup();
});

describe("Loading Component Suite", () => {
  it("renders the Loading component", () => {
    const { unmount } = render(<Loading />);
    const loadingDiv = screen.getByRole("status");
    expect(loadingDiv).toBeInTheDocument();
    expect(loadingDiv).toHaveClass("min-h-screen bg-gray-900 flex items-center justify-center");
    unmount();
  });

  it("renders the SVG spinner", () => {
    const { unmount } = render(<Loading />);
    const spinner = screen.getByRole("status").querySelector("svg");
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass("w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600");
    expect(spinner).toHaveAttribute("viewBox", "0 0 100 101");
    unmount();
  });

  it("has the appropriate aria-hidden and accessible span", () => {
    const { unmount } = render(<Loading />);
    const spinner = screen.getByRole("status").querySelector("svg");
    expect(spinner).toHaveAttribute("aria-hidden", "true");

    const accessibleSpan = screen.getByText("Loading...");
    expect(accessibleSpan).toBeInTheDocument();
    expect(accessibleSpan).toHaveClass("sr-only");
    unmount();
  });
});
