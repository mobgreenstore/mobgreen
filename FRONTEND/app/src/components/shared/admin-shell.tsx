import { Boxes, Menu } from "lucide-react";
import type { ReactNode } from "react";
import { AdminNavigation } from "@/components/shared/admin-navigation";
import { BrandMark } from "@/components/shared/brand-mark";
import { AdminAccountMenu } from "@/features/admin-auth/components/admin-account-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { AuthenticatedAdmin } from "@/server/auth/session";

export function AdminShell({
  children,
  admin,
}: {
  children: ReactNode;
  admin: AuthenticatedAdmin;
}) {
  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[var(--admin-sidebar)_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh border-r border-border bg-surface px-4 py-5 lg:flex lg:flex-col">
        <BrandMark className="px-2" />
        <div className="mt-8">
          <AdminNavigation />
        </div>
        <div className="mt-auto rounded-lg border border-border bg-background p-4">
          <div className="flex items-center gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-md bg-surface-subtle">
              <Boxes aria-hidden="true" className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{admin.name}</p>
              <p className="truncate text-xs text-foreground-muted">
                {admin.email}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-border bg-background/92 backdrop-blur-xl lg:bg-background/80">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="lg:hidden">
              <details className="group relative">
                <summary
                  className="grid size-11 list-none place-items-center rounded-md hover:bg-surface-subtle [&::-webkit-details-marker]:hidden"
                  aria-label="Open admin navigation"
                >
                  <Menu aria-hidden="true" className="size-5" />
                </summary>
                <div className="absolute top-13 left-0 z-50 w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-border bg-surface p-3 shadow-md">
                  <BrandMark className="mb-4 px-2" />
                  <AdminNavigation mobile />
                </div>
              </details>
            </div>
            <p className="hidden text-sm font-medium text-foreground-muted lg:block">
              Admin workspace
            </p>
            <BrandMark compact className="lg:hidden" />
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <AdminAccountMenu admin={admin} />
            </div>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
