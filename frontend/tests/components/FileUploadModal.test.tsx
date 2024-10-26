import React from "react";
import { render, screen, fireEvent,  cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { FileUploadModal } from "../../src/components/FileUploadModal";

afterEach(() => {
  cleanup();
});

// Unit tests for the FileUploadModal component
describe("FileUploadModal Component", () => {
  it("renders the FileUploadModal component", () => {
    const { unmount } = render(<FileUploadModal />);
    const modal = screen.getByText(/click to browse/i);
    expect(modal).toBeInTheDocument();
    expect(modal).toHaveClass("text-xl font-medium text-gray-500");
    unmount();
  });

  it("renders the input field for file upload", () => {
    const { unmount } = render(<FileUploadModal />);
    const input = screen.getByLabelText(/file/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "file");
    unmount();
  });

  it("renders the upload button", () => {
    const { unmount } = render(<FileUploadModal />);
    const button = screen.getByRole("button", { name: /upload/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("h-12 rounded-lg px-10 text-xl bg-slate-900 text-white hover:bg-opacity-90 shadow-lg");
    unmount();
  });

  it("handles file selection correctly", () => {
    const { unmount } = render(<FileUploadModal />);
    const input = screen.getByLabelText(/file/i) as HTMLInputElement;
    const file = new File(["dummy content"], "example.zip", { type: "application/zip" });
    fireEvent.change(input, { target: { files: [file] } });
    expect((input.files as FileList)[0]).toBe(file);
    expect(input.files).toHaveLength(1);
    unmount();
  });
});
