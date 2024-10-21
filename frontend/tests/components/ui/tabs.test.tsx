import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../src/components/ui/tabs";

afterEach(() => {
  cleanup();
});

// Unit tests for the Tabs component
describe("Tabs Component", () => {
  it("renders the Tabs root component", () => {
    const { unmount } = render(
      <Tabs>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );
    const tabList = screen.getByRole("tablist");
    expect(tabList).toBeInTheDocument();
    unmount();
  });

  it("renders a TabsTrigger with appropriate styles", () => {
    const { unmount } = render(
      <Tabs>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
      </Tabs>
    );
    const trigger = screen.getByRole("tab", { name: /tab 1/i });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveClass("inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-2xl font-medium");
    unmount();
  });

  it("renders TabsContent correctly", () => {
    const { unmount }  = render(
      <Tabs value="tab1">
        <TabsContent value="tab1">Content 1</TabsContent>
      </Tabs>
    );
    const content = screen.getByText(/content 1/i);
    expect(content).toBeInTheDocument();
    expect(content).toHaveClass("mt-2 ring-offset-white");
    unmount();
  });

  it("switches tabs correctly", () => {
    const { unmount } = render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    const tab1 = screen.getByRole("tab", { name: /tab 1/i });
    const tab2 = screen.getByRole("tab", { name: /tab 2/i });
    expect(tab1).toBeInTheDocument();
    expect(tab2).toBeInTheDocument();

    tab2.click();
    const contents = screen.getAllByText(/content/i);
    const content2 = contents.find((content) => content.getAttribute("data-state") == "active");
    expect(content2).toBeInTheDocument();
    unmount();
  });
});
