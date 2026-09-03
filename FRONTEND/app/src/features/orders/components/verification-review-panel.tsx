"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  KeyRound,
  MailCheck,
  MailWarning,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { ConfirmationDialog } from "@/components/admin/confirmation-dialog";
import { Badge, Button, InlineAlert } from "@/components/ui";
import {
  approveVerificationAction,
  initialVerificationActionState,
  rejectVerificationAction,
  retryOrderNotificationAction,
  revealVerificationCodeAction,
} from "@/features/orders/server/verification-actions";
import type { AdminOrderDetail } from "@/features/orders/types";
import { useToast } from "@/components/ui/toast";

type Notification = AdminOrderDetail["notification"];

export function VerificationReviewPanel({
  orderId,
  codeAvailable,
  canVerify,
  orderStatus,
  paymentStatus,
  notification,
}: {
  orderId: string;
  codeAvailable: boolean;
  canVerify: boolean;
  orderStatus: AdminOrderDetail["status"];
  paymentStatus: AdminOrderDetail["paymentStatus"];
  notification: Notification;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const approveForm = useRef<HTMLFormElement>(null);
  const rejectForm = useRef<HTMLFormElement>(null);
  const [revealState, revealAction, revealing] = useActionState(
    revealVerificationCodeAction,
    initialVerificationActionState,
  );
  const [approveState, approveAction, approving] = useActionState(
    approveVerificationAction,
    initialVerificationActionState,
  );
  const [rejectState, rejectAction, rejecting] = useActionState(
    rejectVerificationAction,
    initialVerificationActionState,
  );
  const [mailState, mailAction, mailing] = useActionState(
    retryOrderNotificationAction,
    initialVerificationActionState,
  );

  useEffect(() => {
    const state =
      approveState.status !== "idle"
        ? approveState
        : rejectState.status !== "idle"
          ? rejectState
          : mailState.status !== "idle"
            ? mailState
            : null;
    if (!state) return;
    toast({
      title:
        state.status === "success" ? "Operation completed" : "Operation failed",
      ...(state.message ? { description: state.message } : {}),
      tone: state.status === "success" ? "success" : "danger",
    });
    if (state.status === "success") router.refresh();
  }, [approveState, mailState, rejectState, router, toast]);

  const pendingReview =
    orderStatus === "PENDING" && paymentStatus === "PENDING";

  return (
    <div className="grid gap-5">
      <div>
        <div className="flex items-center gap-2">
          <KeyRound aria-hidden="true" className="size-5" />
          <h2 className="font-semibold">Recharge verification</h2>
        </div>
        <p className="mt-2 text-xs leading-5 text-foreground-muted">
          Codes are encrypted at rest and masked in email. Revealing a code
          records an audit event.
        </p>
      </div>

      {!codeAvailable ? (
        <InlineAlert
          tone="danger"
          title="Code unavailable"
          description="No submitted verification code is available for this order."
        />
      ) : !canVerify ? (
        <InlineAlert
          title="Restricted information"
          description="Only an Owner or Manager can reveal and verify recharge codes."
        />
      ) : revealState.codes?.length ? (
        <div className="rounded-md border border-border bg-surface-subtle p-4">
          <p className="text-xs font-semibold text-foreground-muted">
            Full verification code
          </p>
          <div className="mt-3 grid gap-2">
            {revealState.codes.map((code, index) => (
              <code
                key={index}
                className="block rounded-lg bg-surface px-3 py-2 font-mono text-base font-semibold break-all"
              >
                {code}
              </code>
            ))}
          </div>
          <p className="mt-2 text-xs text-foreground-subtle">
            {revealState.message}
          </p>
        </div>
      ) : (
        <form action={revealAction}>
          <input type="hidden" name="orderId" value={orderId} />
          <Button type="submit" variant="secondary" disabled={revealing}>
            <ShieldCheck aria-hidden="true" className="size-4" />
            {revealing ? "Recording access…" : "Reveal verification code"}
          </Button>
          {revealState.status === "error" && (
            <p role="alert" className="mt-2 text-xs text-danger">
              {revealState.message}
            </p>
          )}
        </form>
      )}

      {canVerify && codeAvailable && pendingReview && (
        <div className="grid gap-2 border-t border-border pt-5">
          <form ref={approveForm} action={approveAction}>
            <input type="hidden" name="orderId" value={orderId} />
          </form>
          <form ref={rejectForm} action={rejectAction}>
            <input type="hidden" name="orderId" value={orderId} />
          </form>
          <ConfirmationDialog
            trigger={
              <Button className="w-full">
                <CheckCircle2 aria-hidden="true" className="size-4" />
                Approve verification
              </Button>
            }
            title="Approve this recharge verification?"
            description="Payment will become paid and the order will become confirmed in one operation."
            confirmLabel="Approve and confirm"
            pending={approving}
            onConfirm={() => approveForm.current?.requestSubmit()}
          />
          <ConfirmationDialog
            trigger={
              <Button variant="secondary" className="w-full">
                <XCircle aria-hidden="true" className="size-4" />
                Reject verification
              </Button>
            }
            title="Reject this recharge verification?"
            description="Payment will be marked unpaid. The order will not be completed."
            confirmLabel="Reject verification"
            destructive
            pending={rejecting}
            onConfirm={() => rejectForm.current?.requestSubmit()}
          />
        </div>
      )}

      <div className="border-t border-border pt-5">
        <div className="flex items-center gap-2">
          {notification?.status === "SENT" ? (
            <MailCheck aria-hidden="true" className="size-4 text-success" />
          ) : (
            <MailWarning
              aria-hidden="true"
              className="size-4 text-foreground-muted"
            />
          )}
          <p className="text-sm font-semibold">Administrator email</p>
          <Badge
            tone={
              notification?.status === "SENT"
                ? "success"
                : notification?.status === "FAILED"
                  ? "danger"
                  : "neutral"
            }
          >
            {notification?.status.toLowerCase() ?? "not queued"}
          </Badge>
        </div>
        {notification?.sentAt && (
          <p className="mt-2 text-xs text-foreground-muted">
            Sent {new Date(notification.sentAt).toLocaleString()}
          </p>
        )}
        {canVerify && notification?.status !== "SENT" && (
          <form action={mailAction} className="mt-3">
            <input type="hidden" name="orderId" value={orderId} />
            <Button
              type="submit"
              variant="secondary"
              size="small"
              disabled={mailing}
            >
              <RotateCcw aria-hidden="true" className="size-4" />
              {mailing ? "Sending…" : "Retry email"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
