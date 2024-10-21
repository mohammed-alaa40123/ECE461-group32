import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
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
      expect(tabTrigger).toHaveClass("inline-flex items-center justify-center");
    });
    unmount();
  });

  it("renders the FileUploadModal when 'Upload a package' tab is active", () => {
    const { unmount } = render(<App />);
    const uploadTab = screen.getByRole("tab", { name: /upload a package/i });
    screen.debug();
    uploadTab.click();
    const fileUploadModal = screen.getByText((content, element) =>
      /drag and drop a file or click to browse/i.test(content) && element?.tagName.toLowerCase() === "span");
    // const fileUploadModal = screen.getByText(/drag and drop a file or click to browse/i, { exact: false });
    screen.debug();
    expect(fileUploadModal).toBeInTheDocument();
    unmount();
  });

  it("renders the Form component when 'Download a package' or 'Rate a package' tab is active", () => {
    const { unmount } = render(<App />);
    const downloadTab = screen.getByRole("tab", { name: /download a package/i });
    downloadTab.click();
    const downloadForm = screen.getByLabelText(/search by id/i);
    expect(downloadForm).toBeInTheDocument();

    const rateTab = screen.getByRole("tab", { name: /rate a package/i });
    rateTab.click();
    const rateForm = screen.getByLabelText(/search by id/i);
    expect(rateForm).toBeInTheDocument();
    unmount();
  });
});
