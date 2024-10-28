// import React from "react";
// import { render, screen, cleanup, fireEvent} from "@testing-library/react";
// import { describe, it, expect, afterEach } from "vitest";
// import "@testing-library/jest-dom/vitest";
// import App from "../src/App";

// afterEach(() => {
//   cleanup();
// });

// // Unit tests for the App component
// describe("App Component", () => {
//   it("renders the App component", () => {
//     const { unmount } = render(<App />);
//     const header = screen.getByRole("heading", { name: /ece 461 project/i });
//     expect(header).toBeInTheDocument();
//     expect(header).toHaveClass("mx-auto text-3xl font-bold text-white");
//     unmount();
//   });

//   it("renders the tabs correctly", () => {
//     const { unmount } = render(<App />);
//     const tabs: string[] = ["Upload a package", "Download a package", "Delete a package", "Update a package", "Package rate", "Package cost"];
//     tabs.forEach((tab) => {
//       const tabTrigger = screen.getByRole("tab", { name: new RegExp(tab, "i") });
//       expect(tabTrigger).toBeInTheDocument();
//       expect(tabTrigger).toHaveClass("bg-white h-fit px-2 py-1 rounded cursor-pointer");
//     });
//     unmount();
//   });

//   it("renders the Upload page when 'Upload a package' tab is active", async () => {
//   const { unmount } = render(<App />);
//   const uploadTab = screen.getByRole("tab", { name: new RegExp("upload a package", "i") });
//   fireEvent.click(uploadTab);
//   const upload = screen.getByText(/click to browse/i);
//   expect(upload).toBeInTheDocument();
//   unmount();
// });


//   it("renders the Download component when 'Download a package' or 'Rate a package' tab is active", () => {
//     const { unmount } = render(<App />);
//     const downloadTab = screen.getByRole("tab", { name: new RegExp("download a package", "i")});
//     fireEvent.click(downloadTab);
//     const downloadForm = screen.getByLabelText(/search by id/i);
//     expect(downloadForm).toBeInTheDocument();

//     const rateTab = screen.getByRole("tab", { name: new RegExp("rate a package", "i") });
//     fireEvent.click(rateTab);
//     const rateForm = screen.getByLabelText(/search by name/i);
//     expect(rateForm).toBeInTheDocument();
//     unmount();
//   });
// });
import React from "react";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
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
    expect(header).toHaveClass("mx-auto text-3xl font-bold text-white");
    unmount();
  });

  it("renders the tabs correctly", () => {
    const { unmount } = render(<App />);
    const tabs: string[] = ["Upload a package", "Download a package", "Delete a package", "Update a package", "Package rate", "Package cost"];
    tabs.forEach((tab) => {
      const tabTrigger = screen.getByRole("tab", { name: new RegExp(tab, "i") });
      expect(tabTrigger).toBeInTheDocument();
      expect(tabTrigger).toHaveClass("bg-white h-fit px-2 py-1 rounded cursor-pointer");
    });
    unmount();
  });

  it("renders the Upload page when 'Upload a package' tab is active", async () => {
    const { unmount } = render(<App />);
    const uploadTab = screen.getByRole("tab", { name: new RegExp("upload a package", "i") });
    fireEvent.click(uploadTab);
    const upload = screen.getByText(/click to browse/i);
    expect(upload).toBeInTheDocument();
    unmount();
  });

  it("renders the Download page when 'Download a package' tab is active", async () => {
    const { unmount } = render(<App />);
    const downloadTab = screen.getByRole("tab", { name: new RegExp("download a package", "i") });
    fireEvent.click(downloadTab);
    const download = screen.getByText(/download package/i);
    expect(download).toBeInTheDocument();
    unmount();
  });

  it("renders the Delete page when 'Delete a package' tab is active", async () => {
    const { unmount } = render(<App />);
    const deleteTab = screen.getByRole("tab", { name: new RegExp("delete a package", "i") });
    fireEvent.click(deleteTab);
    const deleteComponent = screen.getByText(/delete package/i);
    expect(deleteComponent).toBeInTheDocument();
    unmount();
  });

  it("renders the Update page when 'Update a package' tab is active", async () => {
    const { unmount } = render(<App />);
    const updateTab = screen.getByRole("tab", { name: new RegExp("update a package", "i") });
    fireEvent.click(updateTab);
    const updateComponent = screen.getByText(/update package/i);
    expect(updateComponent).toBeInTheDocument();
    unmount();
  });

  it("renders the Rate page when 'Package rate' tab is active", async () => {
    const { unmount } = render(<App />);
    const rateTab = screen.getByRole("tab", { name: new RegExp("package rate", "i") });
    fireEvent.click(rateTab);
    const rateComponent = screen.getByText(/rate package/i);
    expect(rateComponent).toBeInTheDocument();
    unmount();
  });

  it("renders the Cost page when 'Package cost' tab is active", async () => {
    const { unmount } = render(<App />);
    const costTab = screen.getByRole("tab", { name: new RegExp("package cost", "i") });
    fireEvent.click(costTab);
    const costComponent = screen.getByText(/cost package/i);
    expect(costComponent).toBeInTheDocument();
    unmount();
  });
});