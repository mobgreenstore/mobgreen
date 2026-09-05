import { StatusBadge } from "@/components/ui/status-badge";
import type {
  AdminOrderStatus,
  AdminPaymentStatus,
} from "@/features/orders/types";

const orderStatus = {
  PENDING: ["pending", "Pending"],
  CONFIRMED: ["confirmed", "Confirmed"],
  PROCESSING: ["processing", "Processing"],
  READY: ["ready", "Ready"],
  OUT_FOR_DELIVERY: ["processing", "Out for delivery"],
  COMPLETED: ["completed", "Completed"],
  CANCELLED: ["cancelled", "Cancelled"],
} as const;

const paymentStatus = {
  UNPAID: ["unpaid", "Unpaid"],
  PENDING: ["pending", "Verification pending"],
  PAID: ["paid", "Paid"],
  REFUNDED: ["cancelled", "Refunded"],
} as const;

export function OrderStatusBadge({ status }: { status: AdminOrderStatus }) {
  const [tone, label] = orderStatus[status];
  return <StatusBadge status={tone} label={label} />;
}

export function CustomerOrderStatusBadge({
  status,
}: {
  status: AdminOrderStatus;
}) {
  const [tone, label] = orderStatus[status];
  return (
    <StatusBadge
      status={tone}
      label={status === "PENDING" ? "Order received" : label}
    />
  );
}

export function PaymentStatusBadge({ status }: { status: AdminPaymentStatus }) {
  const [tone, label] = paymentStatus[status];
  return <StatusBadge status={tone} label={label} />;
}

export function CustomerPaymentStatusBadge({
  status,
}: {
  status: AdminPaymentStatus;
}) {
  const [tone, label] = paymentStatus[status];
  return (
    <StatusBadge
      status={tone}
      label={status === "PENDING" ? "Payment submitted" : label}
    />
  );
}

export function orderStatusLabel(status: AdminOrderStatus) {
  return orderStatus[status][1];
}

export function paymentStatusLabel(status: AdminPaymentStatus) {
  return paymentStatus[status][1];
}

export function customerOrderStatusLabel(status: AdminOrderStatus) {
  return status === "PENDING" ? "Order received" : orderStatus[status][1];
}
