"use client";

import {
  ChevronDown,
  LoaderCircle,
  LogOut,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useTransition } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";
import { signOutAction } from "@/server/auth/actions";
import type { AuthenticatedAdmin } from "@/server/auth/session";

const roleLabels = {
  OWNER: "Owner",
  MANAGER: "Manager",
  EDITOR: "Editor",
  VIEWER: "Viewer",
} as const;

export function AdminAccountMenu({ admin }: { admin: AuthenticatedAdmin }) {
  const [signingOut, startSignOut] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-2 rounded-md px-2.5 text-sm font-semibold transition-colors hover:bg-surface-subtle focus-visible:ring-3 focus-visible:ring-foreground/10 focus-visible:outline-none"
          aria-label="Open admin account menu"
        >
          <span className="grid size-8 place-items-center rounded-full bg-inverse text-inverse-foreground">
            <UserRound aria-hidden="true" className="size-4" />
          </span>
          <span className="hidden max-w-32 truncate sm:inline">
            {admin.name}
          </span>
          <ChevronDown
            aria-hidden="true"
            className="size-4 text-foreground-muted"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <span className="block truncate text-sm text-foreground">
            {admin.name}
          </span>
          <span className="mt-0.5 block truncate font-normal text-foreground-muted">
            {admin.email}
          </span>
        </DropdownMenuLabel>
        <div className="mx-2.5 mb-2 flex items-center gap-2 text-xs font-medium text-foreground-muted">
          <ShieldCheck aria-hidden="true" className="size-3.5" />
          {roleLabels[admin.role]}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={signingOut}
          onSelect={(event) => {
            event.preventDefault();
            startSignOut(async () => {
              await signOutAction();
            });
          }}
        >
          {signingOut ? (
            <LoaderCircle
              aria-hidden="true"
              className="size-4 animate-spin motion-reduce:animate-none"
            />
          ) : (
            <LogOut aria-hidden="true" className="size-4" />
          )}
          {signingOut ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
