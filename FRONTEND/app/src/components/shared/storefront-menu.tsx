"use client";

import Link from "next/link";
import { ChevronDown, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
  IconButton,
} from "@/components/ui";
import { cn } from "@/lib/utils";

const navigationClassName =
  "flex min-h-12 items-center rounded-md px-4 text-[0.9375rem] font-semibold tracking-[-0.015em] text-foreground transition-colors hover:bg-surface-subtle focus-visible:ring-2 focus-visible:ring-foreground/20 focus-visible:outline-none motion-reduce:transition-none";

export function StorefrontMenu({
  triggerClassName,
}: {
  triggerClassName?: string;
}) {
  const pathname = usePathname();
  const rechargeRegionId = useId();
  const rechargeRouteActive = pathname === "/recharge-online";
  const ordersRouteActive =
    pathname === "/orders" || pathname.startsWith("/orders/");
  const verificationRouteActive = pathname === "/allverification";
  const howToOrderRouteActive = pathname === "/how-to-order";
  const [rechargeOpen, setRechargeOpen] = useState(rechargeRouteActive);

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <IconButton
          aria-label="Open menu"
          title="Open menu"
          className={triggerClassName}
        >
          <Menu aria-hidden="true" className="size-5" strokeWidth={2} />
        </IconButton>
      </DrawerTrigger>

      <DrawerContent
        side="left"
        aria-describedby="storefront-menu-description"
        className="safe-bottom w-[min(22rem,calc(100%-0.75rem))] p-0 sm:p-0"
      >
        <div className="safe-top">
          <div className="px-5 pt-5 pr-14 pb-4 sm:px-6 sm:pt-6">
            <DrawerTitle className="text-xl font-semibold tracking-[-0.035em]">
              Menu
            </DrawerTitle>
            <DrawerDescription
              id="storefront-menu-description"
              className="sr-only"
            >
              Storefront navigation and recharge options.
            </DrawerDescription>
          </div>
        </div>

        <nav
          aria-label="Storefront menu"
          className="flex min-h-0 flex-1 flex-col px-3 pb-4 sm:px-4"
        >
          <button
            type="button"
            aria-expanded={rechargeOpen}
            aria-controls={rechargeRegionId}
            onClick={() => setRechargeOpen((current) => !current)}
            className={cn(
              navigationClassName,
              "w-full justify-between text-left",
              rechargeRouteActive && "bg-surface-subtle",
            )}
          >
            <span>Get Recharge</span>
            <ChevronDown
              aria-hidden="true"
              className={cn(
                "size-4 shrink-0 text-foreground-muted transition-transform duration-200 motion-reduce:transition-none",
                rechargeOpen && "rotate-180",
              )}
              strokeWidth={1.8}
            />
          </button>

          {rechargeOpen && (
            <div
              id={rechargeRegionId}
              className="mt-1 grid gap-1 border-l border-border py-1 pl-3"
            >
              <div
                aria-disabled="true"
                className="flex min-h-11 cursor-not-allowed items-center rounded-md px-4 text-sm font-medium text-foreground-subtle opacity-55"
              >
                <span>Recharge from store</span>
                <span className="sr-only">Unavailable</span>
              </div>
              <DrawerClose asChild>
                <Link
                  href="/recharge-online"
                  aria-current={rechargeRouteActive ? "page" : undefined}
                  className={cn(
                    navigationClassName,
                    "min-h-11 text-sm",
                    rechargeRouteActive && "bg-surface-subtle",
                  )}
                >
                  Recharge online
                </Link>
              </DrawerClose>
            </div>
          )}

          <DrawerClose asChild>
            <Link
              href="/orders"
              aria-current={ordersRouteActive ? "page" : undefined}
              className={cn(
                navigationClassName,
                "mt-1",
                ordersRouteActive && "bg-surface-subtle",
              )}
            >
              Track orders
            </Link>
          </DrawerClose>

          <DrawerClose asChild>
            <Link
              href="/allverification"
              aria-current={verificationRouteActive ? "page" : undefined}
              className={cn(
                navigationClassName,
                "mt-1",
                verificationRouteActive && "bg-surface-subtle",
              )}
            >
              Verification
            </Link>
          </DrawerClose>

          <DrawerClose asChild>
            <Link
              href="/how-to-order"
              aria-current={howToOrderRouteActive ? "page" : undefined}
              className={cn(
                navigationClassName,
                "mt-1",
                howToOrderRouteActive && "bg-surface-subtle",
              )}
            >
              How to order
            </Link>
          </DrawerClose>
        </nav>
      </DrawerContent>
    </Drawer>
  );
}
