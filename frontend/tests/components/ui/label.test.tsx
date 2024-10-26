import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import "@testing-library/jest-dom/vitest";
import { Label } from "../../../src/components/ui/label";

// Unit tests for the Label component
describe("Label Component", () => {
  it("renders a default label", () => {
    render(<Label htmlFor="input-id">Default Label Text</Label>);
    const label = screen.getByText(/default label text/i);
    expect(label).toBeInTheDocument();
    expect(label).toHaveClass("text-sm font-medium leading-none");
  });

  it("renders a label with a custom class name", () => {
    render(<Label htmlFor="input-id" className="custom-class">Custom Label Text</Label>);
    const label = screen.getByText(/custom label text/i);
    expect(label).toBeInTheDocument();
    expect(label).toHaveClass("text-sm font-medium leading-none custom-class");
  });

  it("renders a label associated with an input element", () => {
    render(
      <>
        <Label htmlFor="input-id">Associated Label Text</Label>
        <input id="input-id" />
      </>
    );
    const label = screen.getByText(/associated label text/i);
    const input = screen.getByLabelText(/associated label text/i);
    expect(label).toBeInTheDocument();
    expect(input).toBeInTheDocument();
  });
});
