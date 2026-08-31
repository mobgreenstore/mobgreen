"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
  IconButton,
} from "@/components/ui";
import { AdminNavigation } from "@/components/shared/admin-navigation";
import { BrandMark } from "@/components/shared/brand-mark";
import { cn } from "@/lib/utils";

export function AdminMenu() {
  const pathname = usePathname();

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <IconButton
          aria-label="Open admin menu"
          title="Open admin menu"
          className="grid size-11 place-items-center rounded-md hover:bg-surface-subtle"
        >
          <Menu aria-hidden="true" className="size-5" />
        </IconButton>
      </DrawerTrigger>

      <DrawerContent
        side="left"
        aria-describedby="admin-menu-description"
        className="safe-bottom w-[min(22rem,calc(100%-0.75rem))] p-0 sm:p-0"
      >
        <div className="safe-top">
          <div className="px-5 pt-5 pr-14 pb-4 sm:px-6 sm:pt-6">
            <DrawerTitle className="text-xl font-semibold tracking-[-0.035em]">
              Admin Menu
            </DrawerTitle>
            <DrawerDescription
              id="admin-menu-description"
              className="sr-only"
            >
              Admin workspace navigation.
            </DrawerDescription>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-3 pb-4 sm:px-4">
          <BrandMark className="mb-4 px-2" />
          <AdminNavigation mobile />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
