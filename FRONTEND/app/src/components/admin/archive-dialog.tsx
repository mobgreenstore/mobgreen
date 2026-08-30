"use client";

import type { ReactElement } from "react";
import { ConfirmationDialog } from "@/components/admin/confirmation-dialog";

export function ArchiveDialog({
  trigger,
  itemName,
  pending = false,
  onArchive,
}: {
  trigger: ReactElement;
  itemName: string;
  pending?: boolean;
  onArchive: () => void | Promise<void>;
}) {
  return (
    <ConfirmationDialog
      trigger={trigger}
      title={`Archive ${itemName}?`}
      description="It will disappear from active views but remain available for historical records."
      confirmLabel="Archive"
      destructive
      pending={pending}
      onConfirm={onArchive}
    />
  );
}
