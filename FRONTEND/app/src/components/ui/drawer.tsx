"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ComponentRef,
} from "react";
import { DialogOverlay } from "@/components/ui/dialog";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";

export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerClose = DialogPrimitive.Close;
export const DrawerTitle = DialogPrimitive.Title;
export const DrawerDescription = DialogPrimitive.Description;

interface DrawerContentProps extends ComponentPropsWithoutRef<
  typeof DialogPrimitive.Content
> {
  side?: "left" | "right";
}

export const DrawerContent = forwardRef<
  ComponentRef<typeof DialogPrimitive.Content>,
  DrawerContentProps
>(({ className, children, side = "right", ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogOverlay className="backdrop-blur-[2px]" />
    <DialogPrimitive.Content
      ref={ref}
      data-side={side}
      className={cn(
        "interaction-drawer fixed inset-y-0 z-50 flex w-[min(24rem,calc(100%-2rem))] flex-col border-border bg-surface p-5 shadow-md outline-none sm:p-6",
        side === "right" ? "right-0 border-l" : "left-0 border-r",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close asChild>
        <IconButton
          aria-label="Close drawer"
          size="small"
          className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-3"
        >
          <X aria-hidden="true" className="size-4" />
        </IconButton>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DrawerContent.displayName = "DrawerContent";
