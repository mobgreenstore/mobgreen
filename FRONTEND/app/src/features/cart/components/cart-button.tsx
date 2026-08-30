"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useCart } from "@/features/cart/cart-provider";
import { cn } from "@/lib/utils";

export function CartButton({ className }: { className?: string }) {
  const { itemCount } = useCart();
  const label = itemCount === 1 ? "Cart, 1 item" : `Cart, ${itemCount} items`;

  return (
    <Link
      href="/cart"
      aria-label={label}
      title="Cart"
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon" }),
        "relative",
        className,
      )}
    >
      <ShoppingBag aria-hidden="true" className="size-[1.125rem]" />
      {itemCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute top-1 right-0.5 grid min-w-4.5 place-items-center rounded-full bg-inverse px-1 font-mono text-[0.625rem] leading-[1.125rem] font-bold text-inverse-foreground"
        >
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </Link>
  );
}
