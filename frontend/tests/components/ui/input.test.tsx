import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import "@testing-library/jest-dom/vitest";
import { Input } from "../../../src/components/ui/input";

// Unit tests for the Input component
describe("Input Component", () => {
  it("renders a default input", () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText(/enter text/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass("flex h-9 w-full rounded-md border border-gray-200 bg-transparent");
  });

  it("renders an input with a custom class name", () => {
    render(<Input placeholder="Custom Class" className="custom-class" />);
    const input = screen.getByPlaceholderText(/custom class/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass("custom-class");
  });

  it("renders a disabled input", () => {
    render(<Input placeholder="Disabled Input" disabled />);
    const input = screen.getByPlaceholderText(/disabled input/i);
    expect(input).toBeInTheDocument();
    expect(input).toBeDisabled();
  });

  it("renders an input with a specific type", () => {
    render(<Input type="password" placeholder="Password" />);
    const input = screen.getByPlaceholderText(/password/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "password");
  });
});
