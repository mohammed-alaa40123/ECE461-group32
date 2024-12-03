// import React from "react";
// import { render, screen } from "@testing-library/react";
// import { describe, it, expect } from "vitest";
// import "@testing-library/jest-dom/vitest";
// import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../../src/components/ui/card";

// // Unit tests for the Card component
// describe("Card Component", () => {
//   it("renders a default card", () => {
//     render(<Card>Default Card</Card>);
//     const card = screen.getByText(/default card/i);
//     expect(card).toBeInTheDocument();
//     expect(card).toHaveClass("rounded-xl border border-gray-200 bg-white text-gray-950");
//   });

//   it("renders a card header", () => {
//     render(<CardHeader>Card Header</CardHeader>);
//     const header = screen.getByText(/card header/i);
//     expect(header).toBeInTheDocument();
//     expect(header).toHaveClass("flex flex-col space-y-2 p-4");
//   });

//   it("renders a card title", () => {
//     render(<CardTitle>Card Title</CardTitle>);
//     const title = screen.getByText(/card title/i);
//     expect(title).toBeInTheDocument();
//     expect(title).toHaveClass("font-semibold text-lg tracking-tight");
//   });

//   it("renders a card description", () => {
//     render(<CardDescription>Card Description</CardDescription>);
//     const description = screen.getByText(/card description/i);
//     expect(description).toBeInTheDocument();
//     expect(description).toHaveClass("text-sm text-gray-500");
//   });

//   it("renders card content", () => {
//     render(<CardContent>Card Content</CardContent>);
//     const content = screen.getByText(/card content/i);
//     expect(content).toBeInTheDocument();
//     expect(content).toHaveClass("p-4");
//   });

//   it("renders a card footer", () => {
//     render(<CardFooter>Card Footer</CardFooter>);
//     const footer = screen.getByText(/card footer/i);
//     expect(footer).toBeInTheDocument();
//     expect(footer).toHaveClass("flex items-start justify-end p-4 pt-0");
//   });
// });
import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "../../../src/components/ui/card";
import "@testing-library/jest-dom/vitest";

afterEach(() => {
  cleanup();
});

describe("Card Component Suite", () => {
  it("renders the Card component", () => {
    const { unmount } = render(<Card data-testid="card-component" />);
    const card = screen.getByTestId("card-component");
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass(
      "rounded-xl border border-gray-200 bg-white text-gray-950 shadow dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50"
    );
    unmount();
  });

  it("renders the CardHeader component", () => {
    const { unmount } = render(<CardHeader data-testid="card-header" />);
    const header = screen.getByTestId("card-header");
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass("flex flex-col space-y-2 p-4");
    unmount();
  });

  it("renders the CardFooter component", () => {
    const { unmount } = render(<CardFooter data-testid="card-footer" />);
    const footer = screen.getByTestId("card-footer");
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveClass("flex items-start justify-end p-4 pt-0");
    unmount();
  });

  it("renders the CardTitle component", () => {
    const { unmount } = render(<CardTitle data-testid="card-title">Title</CardTitle>);
    const title = screen.getByTestId("card-title");
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass("font-semibold text-lg tracking-tight");
    expect(title).toHaveTextContent("Title");
    unmount();
  });

  it("renders the CardDescription component", () => {
    const { unmount } = render(
      <CardDescription data-testid="card-description">
        This is a description.
      </CardDescription>
    );
    const description = screen.getByTestId("card-description");
    expect(description).toBeInTheDocument();
    expect(description).toHaveClass("text-gray-500 dark:text-gray-400");
    expect(description).toHaveTextContent("This is a description.");
    unmount();
  });

  it("renders the CardContent component", () => {
    const { unmount } = render(<CardContent data-testid="card-content" />);
    const content = screen.getByTestId("card-content");
    expect(content).toBeInTheDocument();
    expect(content).toHaveClass("p-4");
    unmount();
  });

  it("applies the given className to each component", () => {
    const { unmount } = render(
      <Card className="custom-class" data-testid="card-component" />
    );
    const card = screen.getByTestId("card-component");
    expect(card).toHaveClass("custom-class");
    unmount();
  });

  it("forwards ref to the Card component", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Card ref={ref} data-testid="card-component" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("forwards ref to the CardHeader component", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<CardHeader ref={ref} data-testid="card-header" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("forwards ref to the CardFooter component", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<CardFooter ref={ref} data-testid="card-footer" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("forwards ref to the CardTitle component", () => {
    const ref = React.createRef<HTMLHeadingElement>();
    render(<CardTitle ref={ref} data-testid="card-title" />);
    expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
  });

  it("forwards ref to the CardDescription component", () => {
    const ref = React.createRef<HTMLParagraphElement>();
    render(<CardDescription ref={ref} data-testid="card-description" />);
    expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
  });

  it("forwards ref to the CardContent component", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<CardContent ref={ref} data-testid="card-content" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
