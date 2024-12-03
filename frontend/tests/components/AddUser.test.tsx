import React from "react";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";
import AddUser from "../../src/components/AddUser";
import "@testing-library/jest-dom/vitest";
import * as api from "../../src/api";
// import userEvent from "@testing-library/user-event";

vi.mock("../../src/api", () => ({
  registerUser: vi.fn(),
  getGroupsAndPermissions: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AddUser Component Suite", () => {
  it("renders the AddUser component", () => {
    const { unmount } = render(<AddUser />);
    expect(screen.getByText(/sign up/i)).toBeInTheDocument();
    unmount();
  });

  it("allows user to input username, password, and confirm password", () => {
    const { unmount } = render(<AddUser />);
    
    // Username input
    const usernameInput = screen.getByLabelText(/username/i);
    fireEvent.change(usernameInput, { target: { value: "TestUser" } });
    expect(usernameInput).toHaveValue("TestUser");

    // Password input
    const passwordInput = screen.getByLabelText(/^password$/i);
    fireEvent.change(passwordInput, { target: { value: "TestPassword" } });
    expect(passwordInput).toHaveValue("TestPassword");

    // Confirm Password input
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    fireEvent.change(confirmPasswordInput, { target: { value: "TestPassword" } });
    expect(confirmPasswordInput).toHaveValue("TestPassword");

    unmount();
  });

    it("shows error message if passwords do not match", async () => {
        const { unmount } = render(<AddUser />);
        const usernameInput = screen.getByLabelText(/username/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
        const button = screen.getByRole("button", { name: /add user/i });

        fireEvent.change(usernameInput, { target: { value: "TestUser" } });
        fireEvent.change(passwordInput, { target: { value: "Password1" } });
        fireEvent.change(confirmPasswordInput, { target: { value: "Password2" } });
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
        });

        unmount();
    });


  it("renders the loading spinner while submitting", async () => {
    api.registerUser.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)));
    const { unmount } = render(<AddUser />);
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const button = screen.getByRole("button", { name: /add user/i });

    // Fill out form
    fireEvent.change(usernameInput, { target: { value: "TestUser" } });
    fireEvent.change(passwordInput, { target: { value: "TestPassword" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "TestPassword" } });

    fireEvent.click(button);

    // Expect loading spinner
    await waitFor(() => {
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    // Wait for spinner to disappear
    await waitFor(() => {
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    unmount();
  });

  it("renders permissions when Grant Permission button is clicked", () => {
    const { unmount } = render(<AddUser />);
    const grantPermissionsButton = screen.getByRole("button", { name: /grant permission/i });

    fireEvent.click(grantPermissionsButton);
    expect(screen.getByLabelText(/admin user/i)).toBeInTheDocument();
    unmount();
  });

  it("renders group selection when Assign to Group button is clicked", async () => {
    api.getGroupsAndPermissions.mockResolvedValueOnce(["Group1", "Group2"]);
    const { unmount } = render(<AddUser />);
    const assignToGroupButton = screen.getByRole("button", { name: /assign to group/i });

    fireEvent.click(assignToGroupButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/group/i)).toBeInTheDocument();
    });

    unmount();
  });

  it("calls registerUser API when form is submitted successfully", async () => {
    api.registerUser.mockResolvedValueOnce(true);
    const { unmount } = render(<AddUser />);
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const button = screen.getByRole("button", { name: /add user/i });

    // Fill out form
    fireEvent.change(usernameInput, { target: { value: "TestUser" } });
    fireEvent.change(passwordInput, { target: { value: "TestPassword" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "TestPassword" } });

    fireEvent.click(button);

    await waitFor(() => {
      expect(api.registerUser).toHaveBeenCalledTimes(1);
      expect(api.registerUser).toHaveBeenCalledWith("TestUser", "TestPassword", false, [], []);
    });

    unmount();
  });

  it("shows success message on successful submission", async () => {
    api.registerUser.mockResolvedValueOnce(true);
    const { unmount } = render(<AddUser />);
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const button = screen.getByRole("button", { name: /add user/i });

    // Fill out form
    fireEvent.change(usernameInput, { target: { value: "TestUser" } });
    fireEvent.change(passwordInput, { target: { value: "TestPassword" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "TestPassword" } });

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/user added successfully/i)).toBeInTheDocument();
    });

    unmount();
  });

  it("shows error message on failed submission", async () => {
    api.registerUser.mockRejectedValueOnce(new Error("Failed to add user"));
    const { unmount } = render(<AddUser />);
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const button = screen.getByRole("button", { name: /add user/i });

    // Fill out form
    fireEvent.change(usernameInput, { target: { value: "TestUser" } });
    fireEvent.change(passwordInput, { target: { value: "TestPassword" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "TestPassword" } });

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/failed to add user/i)).toBeInTheDocument();
    });

    unmount();
  });
});
