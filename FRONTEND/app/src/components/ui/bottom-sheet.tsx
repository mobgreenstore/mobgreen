"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ComponentRef,
} from "react";
import { DialogOverlay } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const BottomSheet = DialogPrimitive.Root;
export const BottomSheetTrigger = DialogPrimitive.Trigger;
export const BottomSheetClose = DialogPrimitive.Close;
export const BottomSheetTitle = DialogPrimitive.Title;
export const BottomSheetDescription = DialogPrimitive.Description;

export const BottomSheetContent = forwardRef<
  ComponentRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogOverlay className="backdrop-blur-[2px]" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "interaction-sheet safe-bottom fixed inset-x-0 bottom-0 z-50 max-h-[88dvh] overflow-y-auto rounded-t-xl border border-b-0 border-border bg-surface px-5 pt-3 shadow-md outline-none sm:px-6",
        className,
      )}
      {...props}
    >
      <div
        aria-hidden="true"
        className="mx-auto mb-5 h-1 w-10 rounded-full bg-border-strong"
      />
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
BottomSheetContent.displayName = "BottomSheetContent";
