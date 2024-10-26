import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import Form from "../../src/components/Form";

afterEach(() => {
  cleanup();
});

// Unit tests for the Form component
describe("Form Component", () => {
  it("renders the form component", () => {
    const { unmount }  = render(<Form />);
    const form = screen.getByRole("form");
    expect(form).toBeInTheDocument();
    unmount();
  });

  it("renders the Search by ID input field", () => {
    const { unmount }  = render(<Form />);
    const input = screen.getByLabelText(/search by id/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "number");
    unmount();
  });

  it("renders the Search by Name input field", () => {
    const { unmount }  = render(<Form />);
    const input = screen.getByLabelText(/search by name/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "text");
    unmount();
  });

  it("renders the OR labeled separator", () => {
    const { unmount }  = render(<Form />);
    const separator = screen.getByText(/or/i);
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveClass("mx-4 text-white");
    unmount();
  });

  it("renders the submit button", () => {
    const { unmount }  = render(<Form />);
    const button = screen.getByRole("button", { name: /search/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-white text-gray-900 self-end mt-3");
    unmount();
  });

  it("submits the form correctly", () => {
    const { unmount }  = render(<Form />);
    const button = screen.getByRole("button", { name: /search/i });
    fireEvent.click(button);
    // Additional logic can be added here to test form submission behavior
    expect(button).toBeInTheDocument();
    unmount();
  });
});
