import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { Button } from "../../../src/components/ui/button";
import { describe, it, expect, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";

afterEach(() => {
  cleanup();
});

// Unit tests for the Button component
describe("Button Component", () => {
  it("renders a default button", () => {
    const { unmount } = render(<Button text = "Click Me" type="submit"/>);
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
    unmount();
  });

  it("renders a reset button", () => {
    const { unmount } =   render(<Button text="Delete" type="reset"/>);
    const button = screen.getByRole("button", { name: /delete/i });
    expect(button).toBeInTheDocument();
    unmount();
  });

  it("renders a button of type button", () => {
    const { unmount } = render(<Button text ="Outline" type="button"/>);
    const button = screen.getByRole("button", { name: /outline/i });
    expect(button).toBeInTheDocument();
    unmount();
  });
});
