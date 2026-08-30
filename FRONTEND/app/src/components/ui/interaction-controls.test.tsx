// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { Button } from "./button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { IconButton } from "./icon-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { ToastProvider, useToast } from "./toast";

afterEach(cleanup);

describe("interaction primitives", () => {
  it("requires a usable accessible name for icon actions", () => {
    render(<IconButton aria-label="Open filters">F</IconButton>);
    expect(
      screen.getByRole("button", { name: "Open filters" }),
    ).toBeInTheDocument();
  });

  it("switches tabs with keyboard navigation", async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="first">
        <TabsList aria-label="Sections">
          <TabsTrigger value="first">First</TabsTrigger>
          <TabsTrigger value="second">Second</TabsTrigger>
        </TabsList>
        <TabsContent value="first">First panel</TabsContent>
        <TabsContent value="second">Second panel</TabsContent>
      </Tabs>,
    );
    const first = screen.getByRole("tab", { name: "First" });
    first.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Second" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Second panel")).toBeVisible();
  });

  it("closes dialogs with Escape and restores trigger focus", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Review action</DialogTitle>
          <DialogDescription>Review before continuing.</DialogDescription>
          <DialogClose asChild>
            <Button>Cancel</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>,
    );
    const trigger = screen.getByRole("button", { name: "Open dialog" });
    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: "Review action" })).toBeVisible();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("opens and dismisses menus with the keyboard", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Open menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>View details</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const trigger = screen.getByRole("button", { name: "Open menu" });
    trigger.focus();
    await user.keyboard("{Enter}");
    expect(
      screen.getByRole("menuitem", { name: "View details" }),
    ).toBeVisible();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menuitem")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("announces toast feedback", async () => {
    const user = userEvent.setup();
    function Example() {
      const { toast } = useToast();
      return (
        <Button
          onClick={() =>
            toast({ title: "Saved", description: "Changes completed." })
          }
        >
          Save
        </Button>
      );
    }
    render(
      <ToastProvider>
        <Example />
      </ToastProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText("Saved")).toBeVisible();
    expect(screen.getByText("Changes completed.")).toBeVisible();
  });
});
