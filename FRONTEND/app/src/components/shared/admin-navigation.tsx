"use client";

import Link from "next/link";
import {
  BadgePercent,
  Bike,
  ChevronRight,
  LayoutDashboard,
  Package,
  PanelsTopLeft,
  Settings,
  ShoppingCart,
  Tags,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Deliveries", href: "/admin/deliveries", icon: Bike },
  { label: "Special offers", href: "/admin/offers", icon: BadgePercent },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Categories", href: "/admin/categories", icon: Tags },
  { label: "Components", href: "/admin/components", icon: PanelsTopLeft },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminNavigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin navigation" className="grid gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/admin"
            ? pathname === item.href
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.label}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
              active
                ? "bg-inverse text-inverse-foreground"
                : "text-foreground-muted hover:bg-surface-subtle hover:text-foreground",
            )}
          >
            <Icon
              aria-hidden="true"
              className="size-[1.125rem]"
              strokeWidth={1.8}
            />
            <span>{item.label}</span>
            {mobile && (
              <ChevronRight aria-hidden="true" className="ml-auto size-4" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
