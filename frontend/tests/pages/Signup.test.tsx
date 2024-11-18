import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import Signup from "../../src/pages/Signup";

afterEach(() => {
  cleanup();
});

// Unit tests for the Signup component
describe("Signup Component", () => {
  it("renders the Signup component", () => {
    const { unmount } = render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );
    const heading = screen.getByText(/sign up/i);
    expect(heading).toBeInTheDocument();
    unmount();
  });

  it("renders the username input field", () => {
    const { unmount } = render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );
    const usernameInput = screen.getByLabelText(/username/i);
    expect(usernameInput).toBeInTheDocument();
    expect(usernameInput).toHaveAttribute("type", "text");
    unmount();
  });

  it("renders the password input field", () => {
    const { unmount } = render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );
    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute("type", "password");
    unmount();
  });

  it("renders the confirm password input field", () => {
    const { unmount } = render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    expect(confirmPasswordInput).toBeInTheDocument();
    expect(confirmPasswordInput).toHaveAttribute("type", "password");
    unmount();
  });

  it("renders the admin user checkbox", () => {
    const { unmount } = render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );
    const adminCheckbox = screen.getByRole("checkbox", { name: /admin user/i });
    expect(adminCheckbox).toBeInTheDocument();
    expect(adminCheckbox).toHaveAttribute("type", "checkbox");
    unmount();
  });

  it("renders the sign-up button", () => {
    const { unmount } = render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );
    const signUpButton = screen.getByRole("button", { name: /sign up/i });
    expect(signUpButton).toBeInTheDocument();
    expect(signUpButton).toHaveClass(
      "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
    );
    unmount();
  });

  it("shows an error message when passwords do not match", () => {
    const { unmount } = render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );
    const passwordInput = screen.getByLabelText(/password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const signUpButton = screen.getByRole("button", { name: /sign up/i });

    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "password321" } });
    fireEvent.click(signUpButton);

    const errorMessage = screen.getByText(/passwords do not match/i);
    expect(errorMessage).toBeInTheDocument();
    unmount();
  });

  it("navigates to login page after successful signup", async () => {
    const { unmount } = render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const signUpButton = screen.getByRole("button", { name: /sign up/i });

    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "password123" } });
    fireEvent.click(signUpButton);

    // Assuming alert is shown before navigating
    expect(await screen.findByText(/signup successful! please log in./i)).toBeInTheDocument();
    expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument();
    unmount();
  });
});
