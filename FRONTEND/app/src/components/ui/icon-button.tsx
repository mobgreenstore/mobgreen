import { forwardRef, type ButtonHTMLAttributes } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label"
> {
  "aria-label": string;
  size?: "small" | "default";
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, size = "default", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon" }),
        size === "small" && "size-9 min-h-9",
        className,
      )}
      {...props}
    />
  ),
);

IconButton.displayName = "IconButton";
