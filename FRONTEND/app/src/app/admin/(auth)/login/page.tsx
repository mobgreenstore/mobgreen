import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { BrandMark } from "@/components/shared/brand-mark";
import { Card, ThemeToggle, buttonVariants } from "@/components/ui";
import { AdminLoginForm } from "@/features/admin-auth/components/admin-login-form";
import { cn } from "@/lib/utils";
import { getSafeAdminRedirect } from "@/server/auth/safe-redirect";
import { getAuthenticatedAdmin } from "@/server/auth/session";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  if (await getAuthenticatedAdmin()) redirect("/admin");

  const nextValue = (await searchParams).next;
  const redirectTo = getSafeAdminRedirect(
    Array.isArray(nextValue) ? nextValue[0] : nextValue,
  );

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10 sm:px-6">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <BrandMark />
        <Card className="mt-8 p-6 sm:p-8">
          <div className="grid size-11 place-items-center rounded-md bg-surface-subtle">
            <LockKeyhole
              aria-hidden="true"
              className="size-5"
              strokeWidth={1.8}
            />
          </div>
          <h1 className="heading-section mt-6">Admin access</h1>
          <p className="mt-2 text-sm leading-6 text-foreground-muted">
            Sign in with your MOB GREENS administrator credentials.
          </p>
          <AdminLoginForm redirectTo={redirectTo} />
        </Card>
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "ghost", size: "small" }),
            "mt-4",
          )}
        >
          <ArrowLeft aria-hidden="true" className="size-4" /> Return to
          storefront
        </Link>
      </div>
    </main>
  );
}
