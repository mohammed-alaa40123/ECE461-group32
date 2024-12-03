import React from "react";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";
import AddGroup from "../../src/components/AddGroup";
import "@testing-library/jest-dom/vitest";
import { addGroup } from "../../src/api";

vi.mock("../../src/api", () => ({
  addGroup: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AddGroup Component Suite", () => {
  it("renders the AddGroup component", () => {
    const { unmount } = render(<AddGroup />);
    expect(screen.getByText(/add a group/i)).toBeInTheDocument();
    expect(screen.getByTestId("add-group-form")).toBeInTheDocument();
    unmount();
  });

  it("allows user to input group name", () => {
    const { unmount } = render(<AddGroup />);
    const input = screen.getByLabelText(/group name/i);
    fireEvent.change(input, { target: { value: "Test Group" } });
    expect(input).toHaveValue("Test Group");
    unmount();
  });

  it("renders the loading spinner while submitting", async () => {
  addGroup.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)));
  const { unmount } = render(<AddGroup />);
  const groupName = screen.getByLabelText(/^group name$/i);
  const button = screen.getByRole("button", { name: /add group/i });

  fireEvent.change(groupName, { target: { value: "TestGroup" } });
  fireEvent.click(button);

  // Wait for the spinner to appear
  await waitFor(() => {
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  // Wait for the spinner to disappear
  await waitFor(() => {
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  unmount();
});


  it("toggles Admin User checkbox", () => {
    const { unmount } = render(<AddGroup />);
    const adminCheckbox = screen.getByLabelText(/admin user/i);
    expect(adminCheckbox).not.toBeChecked();

    fireEvent.click(adminCheckbox);
    expect(adminCheckbox).toBeChecked();
    unmount();
  });

  it("renders permissions checkboxes when not an administrator", () => {
    const { unmount } = render(<AddGroup />);
    const adminCheckbox = screen.getByLabelText(/admin user/i);

    fireEvent.click(adminCheckbox); // Toggle admin on
    fireEvent.click(adminCheckbox); // Toggle admin off

    expect(screen.getByLabelText(/upload/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/download/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/search/i)).toBeInTheDocument();
    unmount();
  });

  it("calls addGroup API when the form is submitted", async () => {
    addGroup.mockResolvedValueOnce(true);
    const { unmount } = render(<AddGroup />);
    const input = screen.getByLabelText(/group name/i);
    const button = screen.getByRole("button", { name: /add group/i });

    fireEvent.change(input, { target: { value: "Test Group" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(addGroup).toHaveBeenCalledTimes(1);
      expect(addGroup).toHaveBeenCalledWith("Test Group", []);
    });

    unmount();
  });

  it("shows success message on successful submission", async () => {
    addGroup.mockResolvedValueOnce(true);
    const { unmount } = render(<AddGroup />);
    const input = screen.getByLabelText(/group name/i);
    const button = screen.getByRole("button", { name: /add group/i });

    fireEvent.change(input, { target: { value: "Test Group" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/group added successfully/i)).toBeInTheDocument();
    });

    unmount();
  });

  it("shows error message on failed submission", async () => {
    addGroup.mockRejectedValueOnce(new Error("Failed to add group"));
    const { unmount } = render(<AddGroup />);
    const input = screen.getByLabelText(/group name/i);
    const button = screen.getByRole("button", { name: /add group/i });

    fireEvent.change(input, { target: { value: "Test Group" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/failed to add group/i)).toBeInTheDocument();
    });

    unmount();
  });

  it("handles permissions correctly when checkboxes are clicked", () => {
    const { unmount } = render(<AddGroup />);
    const adminCheckbox = screen.getByLabelText(/admin user/i);
    fireEvent.click(adminCheckbox); // Make sure it is not admin
    fireEvent.click(adminCheckbox); // Toggle off admin to see permissions

    const uploadCheckbox = screen.getByLabelText(/upload/i);
    fireEvent.click(uploadCheckbox);
    expect(uploadCheckbox).toBeChecked();

    fireEvent.click(uploadCheckbox);
    expect(uploadCheckbox).not.toBeChecked();

    unmount();
  });
});
