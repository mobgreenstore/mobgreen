"use client";

import Link from "next/link";
import { Archive, Pencil, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArchiveDialog, ConfirmationDialog } from "@/components/admin";
import { Button, InlineAlert, buttonVariants } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  activateCategoryAction,
  archiveCategoryAction,
} from "@/features/categories/server/actions";
import type { CategoryViewModel } from "@/features/categories/server/queries";

export function CategoryRowActions({
  category,
}: {
  category: CategoryViewModel;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  function run(
    action: (id: string) => Promise<{ status: string; message?: string }>,
  ) {
    setError(undefined);
    startTransition(async () => {
      const result = await action(category.id);
      if (result.status === "error") setError(result.message);
      else router.refresh();
    });
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        <Link
          href={`/admin/categories/${category.id}/edit`}
          className={cn(
            buttonVariants({ variant: "secondary", size: "small" }),
          )}
        >
          <Pencil aria-hidden="true" className="size-3.5" /> Edit
        </Link>
        {category.isArchived || !category.isActive ? (
          <ConfirmationDialog
            trigger={
              <Button size="small" variant="secondary">
                <RotateCcw aria-hidden="true" className="size-3.5" /> Activate
              </Button>
            }
            title={`Activate ${category.name}?`}
            description="The category becomes available for active catalog use again."
            confirmLabel="Activate"
            pending={pending}
            onConfirm={() => run(activateCategoryAction)}
          />
        ) : (
          <ArchiveDialog
            trigger={
              <Button size="small" variant="secondary">
                <Archive aria-hidden="true" className="size-3.5" /> Archive
              </Button>
            }
            itemName={category.name}
            pending={pending}
            onArchive={() => run(archiveCategoryAction)}
          />
        )}
      </div>
      {error && (
        <InlineAlert
          tone="danger"
          title="Action failed"
          description={error}
          className="text-left"
        />
      )}
    </div>
  );
}
