import type { ReactNode } from "react";
import { AdminShell } from "@/components/shared/admin-shell";
import { requireAdminPermission } from "@/server/auth/authorization";

export default async function AdminWorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  const admin = await requireAdminPermission("workspace.read");
  return <AdminShell admin={admin}>{children}</AdminShell>;
}
