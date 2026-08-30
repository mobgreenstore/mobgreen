import { FeedbackFoundationsPreview } from "@/components/shared/feedback-foundations-preview";
import { FormFoundationsPreview } from "@/components/shared/form-foundations-preview";
import { InteractionFoundationsPreview } from "@/components/shared/interaction-foundations-preview";
import { Badge, Card } from "@/components/ui";
import { requireAdminPermission } from "@/server/auth/authorization";

export const metadata = { title: "Component foundations" };

export default async function FormFoundationsPage() {
  await requireAdminPermission("workspace.read");

  return (
    <div className="mx-auto max-w-4xl">
      <div className="max-w-2xl">
        <Badge tone="success">Task 1.1</Badge>
        <h1 className="heading-page mt-4">Form foundations</h1>
        <p className="mt-3 text-base leading-7 text-foreground-muted">
          The shared controls for future admin and checkout forms. This
          reference page contains component states only—no catalog, customer, or
          order records.
        </p>
      </div>
      <Card className="mt-8 p-5 sm:p-7 lg:p-8">
        <FormFoundationsPreview />
        <InteractionFoundationsPreview />
        <FeedbackFoundationsPreview />
      </Card>
    </div>
  );
}
