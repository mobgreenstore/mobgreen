"use client";

import Link from "next/link";
import { Archive, Pencil, Play, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArchiveDialog, ConfirmationDialog } from "@/components/admin";
import { Button, InlineAlert, buttonVariants } from "@/components/ui";
import {
  activateProductAction,
  archiveProductAction,
  draftProductAction,
} from "@/features/products/server/actions";
import type { ProductViewModel } from "@/features/products/server/queries";
import { cn } from "@/lib/utils";

export function ProductRowActions({ product }: { product: ProductViewModel }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  function run(
    action: (id: string) => Promise<{ status: string; message?: string }>,
  ) {
    setError(undefined);
    startTransition(async () => {
      const result = await action(product.id);
      if (result.status === "error") setError(result.message);
      else router.refresh();
    });
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        <Link
          href={`/admin/products/${product.id}/edit`}
          className={cn(
            buttonVariants({ variant: "secondary", size: "small" }),
          )}
        >
          <Pencil aria-hidden="true" className="size-3.5" />
          Edit
        </Link>

        {product.status === "ACTIVE" ? (
          <ConfirmationDialog
            trigger={
              <Button size="small" variant="secondary">
                <RotateCcw aria-hidden="true" className="size-3.5" />
                Move to draft
              </Button>
            }
            title={`Move ${product.name} to draft?`}
            description="Customers will no longer see this product once the storefront catalog is connected."
            confirmLabel="Move to draft"
            pending={pending}
            onConfirm={() => run(draftProductAction)}
          />
        ) : product.status === "ARCHIVED" ? (
          <ConfirmationDialog
            trigger={
              <Button size="small" variant="secondary">
                <RotateCcw aria-hidden="true" className="size-3.5" />
                Restore draft
              </Button>
            }
            title={`Restore ${product.name} as a draft?`}
            description="The product becomes editable again but remains unavailable to customers."
            confirmLabel="Restore draft"
            pending={pending}
            onConfirm={() => run(draftProductAction)}
          />
        ) : (
          <ConfirmationDialog
            trigger={
              <Button size="small" variant="secondary">
                <Play aria-hidden="true" className="size-3.5" />
                Activate
              </Button>
            }
            title={`Activate ${product.name}?`}
            description="Activation requires an active category and at least one valid price option."
            confirmLabel="Activate"
            pending={pending}
            onConfirm={() => run(activateProductAction)}
          />
        )}

        {product.status !== "ARCHIVED" && (
          <ArchiveDialog
            trigger={
              <Button size="small" variant="secondary">
                <Archive aria-hidden="true" className="size-3.5" />
                Archive
              </Button>
            }
            itemName={product.name}
            pending={pending}
            onArchive={() => run(archiveProductAction)}
          />
        )}
      </div>

      {error && (
        <InlineAlert
          tone="danger"
          title="Product action failed"
          description={error}
          className="text-left"
        />
      )}
    </div>
  );
}
