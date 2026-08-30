"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Button, InlineAlert } from "@/components/ui";
import { CourierCandidateGrid } from "@/features/delivery-matching/components/courier-candidate-grid";
import type { SimulatedCourierCandidate } from "@/features/delivery-matching/types";
import { initialCourierAssignmentActionState } from "@/features/delivery-operations/server/action-state";
import { reassignCourierAction } from "@/features/delivery-operations/server/actions";
import { useToast } from "@/components/ui/toast";

export function AdminCourierAssignment({
  orderId,
  candidates,
  currentCandidateId,
  locked,
}: {
  orderId: string;
  candidates: SimulatedCourierCandidate[];
  currentCandidateId: string | null;
  locked: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [selected, setSelected] = useState(currentCandidateId);
  const [state, action, pending] = useActionState(
    reassignCourierAction,
    initialCourierAssignmentActionState,
  );
  useEffect(() => {
    if (state.status === "idle") return;
    toast({
      title:
        state.status === "success"
          ? "Courier assignment updated"
          : "Assignment failed",
      ...(state.message ? { description: state.message } : {}),
      tone: state.status === "success" ? "success" : "danger",
    });
    if (state.status === "success") router.refresh();
  }, [router, state, toast]);

  if (!candidates.length) {
    return (
      <InlineAlert
        tone="info"
        title="Candidate history unavailable"
        description="This order has no preserved server-generated candidate set. Existing assignment details remain unchanged."
      />
    );
  }

  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="candidateId" value={selected ?? ""} />
      {locked && (
        <InlineAlert
          tone="info"
          title="Assignment locked"
          description="Courier reassignment closes when delivery is dispatched, completed, or cancelled."
        />
      )}
      <CourierCandidateGrid
        candidates={candidates}
        selectedCandidateId={selected}
        disabled={pending || locked}
        onSelect={(candidate) => setSelected(candidate.candidateId)}
      />
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={
            pending || locked || !selected || selected === currentCandidateId
          }
        >
          <ShieldCheck aria-hidden="true" className="size-4" />
          {pending ? "Saving assignment…" : "Save courier assignment"}
        </Button>
      </div>
      <p className="text-xs leading-5 text-foreground-subtle">
        Only the server-generated candidates preserved for this checkout can be
        selected. Every administrator change is written to the order timeline.
      </p>
    </form>
  );
}
