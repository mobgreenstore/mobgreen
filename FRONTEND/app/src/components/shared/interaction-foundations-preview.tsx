"use client";

import { Ellipsis, Info, Menu, SlidersHorizontal } from "lucide-react";
import {
  BottomSheet,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetTitle,
  BottomSheetTrigger,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  useToast,
} from "@/components/ui";

export function InteractionFoundationsPreview() {
  const { toast } = useToast();

  return (
    <section
      aria-labelledby="interaction-heading"
      className="mt-10 border-t border-border pt-10"
    >
      <div>
        <h2 id="interaction-heading" className="heading-section">
          Interaction primitives
        </h2>
        <p className="mt-2 text-sm leading-6 text-foreground-muted">
          Keyboard-safe menus, overlays, mobile panels, contextual help, and
          notifications.
        </p>
      </div>

      <Tabs defaultValue="actions" className="mt-6">
        <TabsList aria-label="Interaction examples">
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="overlays">Overlays</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="actions">
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface-subtle p-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <IconButton aria-label="More information">
                  <Info className="size-4" />
                </IconButton>
              </TooltipTrigger>
              <TooltipContent>
                Helpful context without hiding essential information.
              </TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary">
                  <Ellipsis className="size-4" /> Open menu
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Available actions</DropdownMenuLabel>
                <DropdownMenuItem>View details</DropdownMenuItem>
                <DropdownMenuItem>Duplicate</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive>Archive</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TabsContent>

        <TabsContent value="overlays">
          <div className="flex flex-wrap gap-3 rounded-lg border border-border bg-surface-subtle p-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary">Open dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm an important action</DialogTitle>
                  <DialogDescription>
                    Focus remains inside this dialog until it is closed. Escape
                    closes it and returns focus to its trigger.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="secondary">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button>Confirm</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="secondary">
                  <Menu className="size-4" /> Open drawer
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerTitle className="pr-10 text-xl font-semibold">
                  Navigation drawer
                </DrawerTitle>
                <DrawerDescription className="mt-2 text-sm leading-6 text-foreground-muted">
                  A focused side panel for navigation, filters, or supporting
                  workflows.
                </DrawerDescription>
                <div className="mt-auto">
                  <DrawerClose asChild>
                    <Button className="w-full">Done</Button>
                  </DrawerClose>
                </div>
              </DrawerContent>
            </Drawer>

            <BottomSheet>
              <BottomSheetTrigger asChild>
                <Button variant="secondary">
                  <SlidersHorizontal className="size-4" /> Open bottom sheet
                </Button>
              </BottomSheetTrigger>
              <BottomSheetContent>
                <BottomSheetTitle className="text-xl font-semibold">
                  Mobile actions
                </BottomSheetTitle>
                <BottomSheetDescription className="mt-2 text-sm leading-6 text-foreground-muted">
                  A thumb-friendly panel for mobile filters and short decisions.
                </BottomSheetDescription>
                <BottomSheetClose asChild>
                  <Button className="mt-6 w-full">Apply</Button>
                </BottomSheetClose>
              </BottomSheetContent>
            </BottomSheet>
          </div>
        </TabsContent>

        <TabsContent value="feedback">
          <div className="flex flex-wrap gap-3 rounded-lg border border-border bg-surface-subtle p-4">
            <Button
              onClick={() =>
                toast({
                  title: "Changes saved",
                  description: "The update was completed successfully.",
                  tone: "success",
                })
              }
            >
              Success toast
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                toast({
                  title: "Action needs attention",
                  description:
                    "Review the highlighted information before continuing.",
                  tone: "danger",
                })
              }
            >
              Error toast
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}
