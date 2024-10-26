import React from "react";
import { render, screen, cleanup, fireEvent} from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import App from "../src/App";

afterEach(() => {
  cleanup();
});

// Unit tests for the App component
describe("App Component", () => {
  it("renders the App component", () => {
    const { unmount } = render(<App />);
    const header = screen.getByRole("heading", { name: /ece 461 project/i });
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass("text-3xl font-bold text-white");
    unmount();
  });

  it("renders the tabs correctly", () => {
    const { unmount } = render(<App />);
    const tabs = ["Upload a package", "Download a package", "Rate a package"];
    tabs.forEach((tab) => {
      const tabTrigger = screen.getByRole("tab", { name: new RegExp(tab, "i") });
      expect(tabTrigger).toBeInTheDocument();
      expect(tabTrigger).toHaveClass("bg-white h-fit px-2 py-1 rounded cursor-pointer");
    });
    unmount();
  });

  it("renders the FileUploadModal when 'Upload a package' tab is active", async () => {
  const { unmount } = render(<App />);
  const uploadTab = screen.getByRole("tab", { name: new RegExp("upload a package", "i") });
  fireEvent.click(uploadTab);
  const uploadModal = screen.getByText(/click to browse/i);
  expect(uploadModal).toBeInTheDocument();
  unmount();
});


  it("renders the Form component when 'Download a package' or 'Rate a package' tab is active", () => {
    const { unmount } = render(<App />);
    const downloadTab = screen.getByRole("tab", { name: new RegExp("download a package", "i")});
    fireEvent.click(downloadTab);
    const downloadForm = screen.getByLabelText(/search by id/i);
    expect(downloadForm).toBeInTheDocument();

    const rateTab = screen.getByRole("tab", { name: new RegExp("rate a package", "i") });
    fireEvent.click(rateTab);
    const rateForm = screen.getByLabelText(/search by name/i);
    expect(rateForm).toBeInTheDocument();
    unmount();
  });
});
