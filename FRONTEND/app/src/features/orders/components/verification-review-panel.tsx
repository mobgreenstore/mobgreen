"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  MailCheck,
  MailWarning,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { Badge, Button, InlineAlert } from "@/components/ui";
import {
  retryOrderNotificationAction,
  revealVerificationCodeAction,
} from "@/features/orders/server/verification-actions";
import { initialVerificationActionState } from "@/features/orders/verification-action-state";
import type { AdminOrderDetail } from "@/features/orders/types";
import { useToast } from "@/components/ui/toast";

type Notification = AdminOrderDetail["notification"];

function EmailStatus({
  label,
  notification,
}: {
  label: string;
  notification: Notification;
}) {
  const sent = notification?.status === "SENT";
  return (
    <div>
      <div className="flex items-center gap-2">
        {sent ? (
          <MailCheck aria-hidden="true" className="size-4 text-success" />
        ) : (
          <MailWarning
            aria-hidden="true"
            className="size-4 text-foreground-muted"
          />
        )}
        <p className="text-sm font-semibold">{label}</p>
        <Badge
          tone={
            sent
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
      {notification?.status === "FAILED" && notification.lastError && (
        <p className="mt-2 text-xs leading-5 text-danger">
          Last mail error: {notification.lastError}
        </p>
      )}
    </div>
  );
}

export function VerificationReviewPanel({
  orderId,
  codeAvailable,
  canVerify,
  notification,
  customerNotification,
}: {
  orderId: string;
  codeAvailable: boolean;
  canVerify: boolean;
  notification: Notification;
  customerNotification: Notification;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [revealState, revealAction, revealing] = useActionState(
    revealVerificationCodeAction,
    initialVerificationActionState,
  );
  const [mailState, mailAction, mailing] = useActionState(
    retryOrderNotificationAction,
    initialVerificationActionState,
  );
  const retryNeeded = [notification, customerNotification].some(
    (entry) => entry && entry.status !== "SENT",
  );

  useEffect(() => {
    const state = mailState.status !== "idle" ? mailState : null;
    if (!state) return;
    toast({
      title:
        state.status === "success" ? "Operation completed" : "Operation failed",
      ...(state.message ? { description: state.message } : {}),
      tone: state.status === "success" ? "success" : "danger",
    });
    if (state.status === "success") router.refresh();
  }, [mailState, router, toast]);

  return (
    <div className="grid gap-5">
      <div>
        <div className="flex items-center gap-2">
          <KeyRound aria-hidden="true" className="size-5" />
          <h2 className="font-semibold">Recharge codes</h2>
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
          description="No submitted recharge code is available for this order."
        />
      ) : !canVerify ? (
        <InlineAlert
          title="Restricted information"
          description="Only an Owner or Manager can reveal submitted recharge codes."
        />
      ) : revealState.codes?.length ? (
        <div className="rounded-md border border-border bg-surface-subtle p-4">
          <p className="text-xs font-semibold text-foreground-muted">
            Submitted recharge codes
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
            {revealing ? "Recording access…" : "Reveal recharge codes"}
          </Button>
          {revealState.status === "error" && (
            <p role="alert" className="mt-2 text-xs text-danger">
              {revealState.message}
            </p>
          )}
        </form>
      )}

      <div className="border-t border-border pt-5">
        <div className="grid gap-4">
          <EmailStatus
            label="Administrator email"
            notification={notification}
          />
          <EmailStatus
            label="Customer email"
            notification={customerNotification}
          />
        </div>
        {canVerify && retryNeeded && (
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
