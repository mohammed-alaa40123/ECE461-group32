// import React from "react";
// import { render, screen, cleanup } from "@testing-library/react";
// import { Button } from "../../../src/components/ui/button";
// import { describe, it, expect, afterEach } from "vitest";
// import "@testing-library/jest-dom/vitest";

// afterEach(() => {
//   cleanup();
// });

// // Unit tests for the Button component
// describe("Button Component", () => {
//   it("renders a default button", () => {
//     const { unmount } = render(<Button text = "Click Me" type="submit"/>);
//     const button = screen.getByRole("button", { name: /click me/i });
//     expect(button).toBeInTheDocument();
//     unmount();
//   });

//   it("renders a reset button", () => {
//     const { unmount } =   render(<Button text="Delete" type="reset"/>);
//     const button = screen.getByRole("button", { name: /delete/i });
//     expect(button).toBeInTheDocument();
//     unmount();
//   });

//   it("renders a button of type button", () => {
//     const { unmount } = render(<Button text ="Outline" type="button"/>);
//     const button = screen.getByRole("button", { name: /outline/i });
//     expect(button).toBeInTheDocument();
//     unmount();
//   });
// });
import React from "react";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { Button } from "../../../src/components/ui/button";
import { describe, it, expect, afterEach, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

afterEach(() => {
  cleanup();
});

// Unit tests for the Button component
describe("Button Component", () => {
  it("renders a default button", () => {
    const { unmount } = render(<Button text="Click Me" type="submit" />);
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "submit");
    unmount();
  });

  it("renders a reset button", () => {
    const { unmount } = render(<Button text="Delete" type="reset" />);
    const button = screen.getByRole("button", { name: /delete/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "reset");
    unmount();
  });

  it("renders a button of type button", () => {
    const { unmount } = render(<Button text="Outline" type="button" />);
    const button = screen.getByRole("button", { name: /outline/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "button");
    unmount();
  });

  it("applies the given className", () => {
    const { unmount } = render(<Button text="Styled Button" className="my-custom-class" />);
    const button = screen.getByRole("button", { name: /styled button/i });
    expect(button).toHaveClass("my-custom-class");
    unmount();
  });

  it("triggers the onClick handler when clicked", () => {
    const handleClick = vi.fn();
    const { unmount } = render(<Button text="Click Me" onClick={handleClick} />);
    const button = screen.getByRole("button", { name: /click me/i });
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
    unmount();
  });

  it("renders with default type 'button' when no type is provided", () => {
    const { unmount } = render(<Button text="Default Type" />);
    const button = screen.getByRole("button", { name: /default type/i });
    expect(button).toHaveAttribute("type", "button");
    unmount();
  });

  it("passes additional props to the button element", () => {
    const { unmount } = render(<Button text="Extra Props" data-testid="custom-button" />);
    const button = screen.getByTestId("custom-button");
    expect(button).toBeInTheDocument();
    unmount();
  });
});
