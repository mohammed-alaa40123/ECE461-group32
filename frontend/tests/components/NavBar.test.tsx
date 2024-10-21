import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import NavBar from "../../src/components/NavBar";

afterEach(() => {
  cleanup();
});


// Unit tests for the NavBar component
describe("NavBar Component", () => {
  it("renders the NavBar component", () => {
    const { unmount } = render(<NavBar />);
    const navBar = screen.getByRole("navigation");
    expect(navBar).toBeInTheDocument();
    unmount();
  });

  it("renders all nav items", () => {
    const { unmount } =render(<NavBar />);
    const navItems = ['Home', 'About', 'Contact', 'Blog', 'Documentation'];
    navItems.forEach((item) => {
      const navLink = screen.getByText(item);
      expect(navLink).toBeInTheDocument();
      expect(navLink).toHaveClass("hover:text-gray-700 transition-all duration-200");
    });
    unmount();
  });

  it("renders the container with the correct class name", () => {
    const { unmount } = render(<NavBar />);
    const container = screen.getByRole("list").parentElement;
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass("flex justify-end");
    unmount();
  });
});
