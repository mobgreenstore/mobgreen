"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, FormField, Label, Select, TextField } from "@/components/ui";
import { initialOrderActionState } from "@/features/orders/server/action-state";
import { updateOrderOperationAction } from "@/features/orders/server/actions";
import {
  orderStatusLabel,
  paymentStatusLabel,
} from "@/features/orders/components/status-badges";
import type {
  AdminOrderStatus,
  AdminPaymentStatus,
} from "@/features/orders/types";
import { useToast } from "@/components/ui/toast";

function UpdateForm({
  orderId,
  operation,
  options,
}: {
  orderId: string;
  operation: "order" | "payment";
  options: readonly string[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [state, action, pending] = useActionState(
    updateOrderOperationAction,
    initialOrderActionState,
  );
  useEffect(() => {
    if (state.status === "idle") return;
    toast({
      title: state.status === "success" ? "Order updated" : "Update failed",
      ...(state.message ? { description: state.message } : {}),
      tone: state.status === "success" ? "success" : "danger",
    });
    if (state.status === "success") router.refresh();
  }, [router, state, toast]);

  if (!options.length) {
    return (
      <p className="text-sm text-foreground-muted">
        No further {operation} status changes are available.
      </p>
    );
  }
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="operation" value={operation} />
      <FormField>
        <Label>New {operation} status</Label>
        <Select name="toStatus" required defaultValue="">
          <option value="" disabled>
            Select status
          </option>
          {options.map((status) => (
            <option key={status} value={status}>
              {operation === "order"
                ? orderStatusLabel(status as AdminOrderStatus)
                : paymentStatusLabel(status as AdminPaymentStatus)}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField hasDescription>
        <Label optional>Internal note</Label>
        <TextField name="note" maxLength={1000} />
      </FormField>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : `Update ${operation} status`}
      </Button>
    </form>
  );
}

function TrackingRegenerationForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [state, action, pending] = useActionState(
    updateOrderOperationAction,
    initialOrderActionState,
  );
  useEffect(() => {
    if (state.status === "idle") return;
    toast({
      title:
        state.status === "success"
          ? "Route regenerated"
          : "Route update failed",
      ...(state.message ? { description: state.message } : {}),
      tone: state.status === "success" ? "success" : "danger",
    });
    if (state.status === "success") router.refresh();
  }, [router, state, toast]);
  return (
    <form action={action}>
      <input type="hidden" name="operation" value="tracking" />
      <input type="hidden" name="orderId" value={orderId} />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Restarting simulation..." : "Restart delivery simulation"}
      </Button>
    </form>
  );
}

export function OrderOperationsPanel({
  orderId,
  orderTransitions,
  paymentTransitions,
  trackingAvailable = false,
}: {
  orderId: string;
  orderTransitions: readonly AdminOrderStatus[];
  paymentTransitions: readonly AdminPaymentStatus[];
  trackingAvailable?: boolean;
}) {
  return (
    <div className="grid gap-7">
      <section>
        <h3 className="text-sm font-semibold">Payment verification</h3>
        <p className="mt-1 mb-4 text-xs leading-5 text-foreground-muted">
          Verify or reject the submitted recharge code before confirming the
          order.
        </p>
        <UpdateForm
          orderId={orderId}
          operation="payment"
          options={paymentTransitions}
        />
      </section>
      <section className="border-t border-border pt-6">
        <h3 className="text-sm font-semibold">Order workflow</h3>
        <p className="mt-1 mb-4 text-xs leading-5 text-foreground-muted">
          Only approved forward transitions are available.
        </p>
        <UpdateForm
          orderId={orderId}
          operation="order"
          options={orderTransitions}
        />
      </section>
      {trackingAvailable && (
        <section className="border-t border-border pt-6">
          <h3 className="text-sm font-semibold">Delivery simulation</h3>
          <p className="mt-1 mb-4 text-xs leading-5 text-foreground-muted">
            Restart the simulated route using the selected profile&apos;s saved
            distance and estimated time.
          </p>
          <TrackingRegenerationForm orderId={orderId} />
        </section>
      )}
    </div>
  );
}
