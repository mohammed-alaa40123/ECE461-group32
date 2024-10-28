import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import "@testing-library/jest-dom/vitest";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../../src/components/ui/card";

// Unit tests for the Card component
describe("Card Component", () => {
  it("renders a default card", () => {
    render(<Card>Default Card</Card>);
    const card = screen.getByText(/default card/i);
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass("rounded-xl border border-gray-200 bg-white text-gray-950");
  });

  it("renders a card header", () => {
    render(<CardHeader>Card Header</CardHeader>);
    const header = screen.getByText(/card header/i);
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass("flex flex-col space-y-2 p-4");
  });

  it("renders a card title", () => {
    render(<CardTitle>Card Title</CardTitle>);
    const title = screen.getByText(/card title/i);
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass("font-semibold text-lg tracking-tight");
  });

  it("renders a card description", () => {
    render(<CardDescription>Card Description</CardDescription>);
    const description = screen.getByText(/card description/i);
    expect(description).toBeInTheDocument();
    expect(description).toHaveClass("text-sm text-gray-500");
  });

  it("renders card content", () => {
    render(<CardContent>Card Content</CardContent>);
    const content = screen.getByText(/card content/i);
    expect(content).toBeInTheDocument();
    expect(content).toHaveClass("p-4");
  });

  it("renders a card footer", () => {
    render(<CardFooter>Card Footer</CardFooter>);
    const footer = screen.getByText(/card footer/i);
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveClass("flex items-start justify-end p-4 pt-0");
  });
});
