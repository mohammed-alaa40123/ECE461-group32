import React from "react";
import { render, screen } from "@testing-library/react";
import { Button } from "../../../src/components/ui/button";
import { describe, it, expect } from "vitest";
import "@testing-library/jest-dom/vitest";

// Unit tests for the Button component
describe("Button Component", () => {
  it("renders a default button", () => {
    render(<Button>Click Me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-gray-900 text-gray-50");
  });

  it("renders a destructive button", () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole("button", { name: /delete/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-red-500 text-gray-50");
  });

  it("renders an outline button", () => {
    render(<Button variant="outline">Outline</Button>);
    const button = screen.getByRole("button", { name: /outline/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("border-gray-200 bg-white");
  });

  it("renders a secondary button", () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole("button", { name: /secondary/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-gray-100 text-gray-900");
  });

  it("renders a ghost button", () => {
    render(<Button variant="ghost">Ghost</Button>);
    const button = screen.getByRole("button", { name: /ghost/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("hover:bg-gray-100");
  });

  it("renders a link button", () => {
    render(<Button variant="link">Link</Button>);
    const button = screen.getByRole("button", { name: /link/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("text-gray-900 underline-offset-4");
  });

  it("renders a button with different sizes", () => {
    render(<Button size="lg">Large Button</Button>);
    const button = screen.getByRole("button", { name: /large button/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("h-10 px-8");
  });

  it("renders a button as a child component", () => {
    render(<Button asChild={true}><a href="/">Child Link</a></Button>);
    const link = screen.getByRole("link", { name: /child link/i });
    expect(link).toBeInTheDocument();
  });

  it("renders a disabled button", () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole("button", { name: /disabled/i });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });
});
