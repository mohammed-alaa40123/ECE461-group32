import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import "@testing-library/jest-dom/vitest";
import { Separator, LabeledSeparator } from "../../../src/components/ui/separator";

// Unit tests for the Separator component
describe("Separator Component", () => {
  it("renders a default horizontal separator", () => {
    render(<Separator />);
    const separator = screen.getByRole("separator");
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveClass("shrink-0 bg-gray-200 h-[1px] w-full");
  });

  it("renders a vertical separator", () => {
    render(<Separator orientation="vertical" />);
    const separators = screen.getAllByRole("separator");
    const verticalSeparator = separators.find((separator) =>
      separator.getAttribute("aria-orientation") === "vertical"
    );
    expect(verticalSeparator).toBeInTheDocument();
    expect(verticalSeparator).toHaveClass("shrink-0 bg-gray-200 dark:bg-gray-800 h-full w-[1px]");
  });

  it("renders a separator with a custom class name", () => {
    render(<Separator className="custom-class" />);
    const separators = screen.getAllByRole("separator");
    const separatorWithClass = separators.find((separator) =>
      separator.classList.contains("custom-class")
    );
    expect(separatorWithClass).toBeInTheDocument();
    expect(separatorWithClass).toHaveClass("custom-class");
  });
});

// Unit tests for the LabeledSeparator component
describe("LabeledSeparator Component", () => {
  it("renders a labeled horizontal separator", () => {
    render(<LabeledSeparator label="Label Text" />);
    const label = screen.getByText(/label text/i);
    expect(label).toBeInTheDocument();
    const separators = screen.getAllByRole("separator");
    expect(separators.length).toBe(5);
  });

  it("renders a labeled vertical separator", () => {
    render(<LabeledSeparator label="Label Text" orientation="vertical" />);
    const labels = screen.getAllByText(/label text/i);
    const verticalSeparator = labels.find((label) =>
      label.nextElementSibling?.getAttribute("aria-orientation") === "vertical"
    );
    expect(verticalSeparator).toBeInTheDocument();
    const separators = screen.getAllByRole("separator");
    expect(separators.length).toBe(7);
    expect(verticalSeparator).toHaveClass("mx-4 text-white");
  });
  
  it("renders a labeled separator with a custom class name", () => {
    render(<LabeledSeparator label="Label Text" className="custom-class" />);
    const labels = screen.getAllByText(/label text/i);
    const customLabel = labels.find((label) => label.parentElement?.classList.contains("custom-class"));
    expect(customLabel).toBeInTheDocument();
    expect(customLabel?.parentElement).toHaveClass("custom-class");
  });
});
