import { Card } from "@/components/ui";
import { PageHeader } from "@/components/admin";
import { DispatchLocationEditor } from "@/features/settings/components/dispatch-location-editor";
import { requireAdminPermission } from "@/server/auth/authorization";
import { prisma } from "@/server/db/client";

export default async function AdminSettingsPage() {
  await requireAdminPermission("settings.read");
  const settings = await prisma.storeSettings.findUnique({
    where: { id: "default" },
    select: { dispatchAddress: true },
  });
  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Operations"
        title="Store settings"
        description="Configure private operational information used by delivery workflows."
      />
      <Card className="max-w-2xl p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Dispatch location</h2>
        <p className="mt-2 mb-6 text-sm leading-6 text-foreground-muted">
          Choose the validated origin used for delivery routing and tracking.
        </p>
        <DispatchLocationEditor
          currentAddress={settings?.dispatchAddress ?? null}
        />
      </Card>
    </div>
  );
}
