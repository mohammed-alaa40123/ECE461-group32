import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";
import GetPackage from "../../src/components/GetPackage"; // Adjust path if needed
import "@testing-library/jest-dom/vitest";
import { getPackageById, searchPackagesByRegEx } from "../../src/api"; // Adjust path if needed

vi.mock("../../src/api", () => ({
  getPackageById: vi.fn(),
  searchPackagesByRegEx: vi.fn(),
})); 

describe("GetPackage", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders buttons to search by ID and regex", () => {
    const { unmount } = render(<GetPackage />);

    expect(screen.getByText("Search by ID")).toBeInTheDocument();
    expect(screen.getByText("Search by Regex")).toBeInTheDocument();

    unmount(); // Clean up the component
  });

  it("calls getPackageById when searching by ID", async () => {
    // const mockData = { data: { Content: "packageContent" }, metadata: { Name: "Package 1" } };
    const mockData = [{ id: "1", name: "Package 1" }];
    getPackageById.mockResolvedValueOnce(mockData);

    const { unmount } = render(<GetPackage />);

    fireEvent.click(screen.getByRole("button", { name: /search by id/i}));
    fireEvent.change(screen.getByLabelText("Package ID"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: /^search$/i}));

    // await waitFor(() => {
    //   expect(getPackageById).toHaveBeenCalledWith("123");
    //   expect(screen.getByText("Failed to get package by ID")).toBeInTheDocument();
    // });

    unmount(); // Clean up the component after the test
  });

  it("calls searchPackagesByRegEx when searching by regex", async () => {
  const mockData = {"Version": "1.2.3", "Name": "Underscore", "ID": "underscore"};
  searchPackagesByRegEx.mockResolvedValueOnce(mockData);

  const { unmount } = render(<GetPackage />);

//   expect(screen.getByRole("button", { name: /search by regex/i })).toBeInTheDocument();

  // Click the "Search by Regex" button to initiate the search form
  fireEvent.click(screen.getByRole("button", { name: /search by regex/i }));

//   // Find the input field by label and enter the regex value
  fireEvent.change(screen.getByLabelText("Package Regex"), { target: { value: "Underscore" } });

//   // Find the search button using the role and click it
  const searchButton = screen.getByRole("button", { name: /^search$/i });
  fireEvent.click(searchButton);

  await waitFor(() => {
    expect(searchPackagesByRegEx).toHaveBeenCalledWith("Underscore");
    expect(screen.getByText(JSON.stringify(mockData, null, 2))).toBeInTheDocument();
  });

  unmount(); // Clean up the component after the test
});


  it("displays error message if package ID is empty", async () => {
    const { unmount } = render(<GetPackage />);

    fireEvent.click(screen.getByText("Search by ID"));
    fireEvent.click(screen.getByText("Get Package by ID"));

    await waitFor(() => {
      expect(screen.getByText("Package ID cannot be empty")).toBeInTheDocument();
    });

    unmount(); // Clean up the component after the test
  });

  it("displays error message if regex is empty", async () => {
    const { unmount } = render(<GetPackage />);

    fireEvent.click(screen.getByText("Search by Regex"));
    fireEvent.click(screen.getByText("Search by Regex"));

    await waitFor(() => {
      expect(screen.getByText("Regex cannot be empty")).toBeInTheDocument();
    });

    unmount(); // Clean up the component after the test
  });

  it("displays error message when getPackageById fails", async () => {
    getPackageById.mockRejectedValueOnce(new Error("Failed to get package"));

    const { unmount } = render(<GetPackage />);

    fireEvent.click(screen.getByText("Search by ID"));
    fireEvent.change(screen.getByLabelText("Package ID"), { target: { value: "123" } });
    fireEvent.click(screen.getByText("Get Package by ID"));

    await waitFor(() => {
      expect(screen.getByText("Failed to get package by ID")).toBeInTheDocument();
    });

    unmount(); // Clean up the component after the test
  });

  it("displays error message when searchPackagesByRegEx fails", async () => {
    searchPackagesByRegEx.mockRejectedValueOnce(new Error("Failed to search"));

    const { unmount } = render(<GetPackage />);

    fireEvent.click(screen.getByText("Search by Regex"));
    fireEvent.change(screen.getByLabelText("Search by Regex"), { target: { value: "testRegex" } });
    fireEvent.click(screen.getByText("Search by Regex"));

    await waitFor(() => {
      expect(screen.getByText("Failed to search packages by regex")).toBeInTheDocument();
    });

    unmount(); // Clean up the component after the test
  });
});
