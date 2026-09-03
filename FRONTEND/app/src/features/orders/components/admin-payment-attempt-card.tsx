import { Bitcoin, ExternalLink, KeyRound, ReceiptText } from "lucide-react";
import { Money } from "@/components/commerce";
import { Badge, Card } from "@/components/ui";
import type { AdminOrderDetail } from "@/features/orders/types";

function bitcoinAmount(satoshis: number | null) {
  if (satoshis === null) return "—";
  return `${new Intl.NumberFormat("en", {
    maximumFractionDigits: 8,
  }).format(satoshis / 100_000_000)} BTC`;
}

export function AdminPaymentAttemptCard({
  order,
}: {
  order: AdminOrderDetail;
}) {
  const attempt = order.paymentAttempt;
  if (!attempt) return null;
  const transactionSafe = Boolean(
    attempt.transactionId && /^[a-f0-9]{64}$/i.test(attempt.transactionId),
  );

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center gap-2">
        {order.paymentMethod === "BITCOIN_DEPOSIT" ? (
          <Bitcoin aria-hidden="true" className="size-5" />
        ) : (
          <ReceiptText aria-hidden="true" className="size-5" />
        )}
        <h2 className="text-lg font-semibold">Payment attempt</h2>
        <Badge className="ml-auto">{attempt.status.replaceAll("_", " ")}</Badge>
      </div>
      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-foreground-muted">Payment reference</dt>
          <dd className="mt-1 font-mono text-xs font-semibold break-all">
            {attempt.publicId}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-foreground-muted">Provider</dt>
          <dd className="mt-1 font-semibold">
            {attempt.provider.replaceAll("_", " ")}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-foreground-muted">Fiat deposit</dt>
          <dd className="mt-1 font-semibold">
            <Money
              amountMinor={attempt.depositMinor}
              currency={order.currency}
            />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-foreground-muted">Cash balance due</dt>
          <dd className="mt-1 font-semibold">
            <Money
              amountMinor={attempt.cashBalanceDueMinor}
              currency={order.currency}
            />
          </dd>
        </div>
        {order.paymentMethod === "BITCOIN_DEPOSIT" && (
          <>
            <div>
              <dt className="text-xs text-foreground-muted">Expected BTC</dt>
              <dd className="mt-1 font-semibold">
                {bitcoinAmount(attempt.expectedSatoshis)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-foreground-muted">Received BTC</dt>
              <dd className="mt-1 font-semibold">
                {bitcoinAmount(attempt.receivedSatoshis)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-foreground-muted">Confirmations</dt>
              <dd className="mt-1 font-semibold">
                {attempt.confirmationCount}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-foreground-muted">Cash collected</dt>
              <dd className="mt-1 font-semibold">
                {attempt.cashCollectedAt ? "Yes" : "Not yet"}
              </dd>
            </div>
          </>
        )}
      </dl>

      {attempt.maskedCodes.length > 0 && (
        <div className="mt-5 border-t border-border pt-5">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <KeyRound aria-hidden="true" className="size-4" />
            Masked recharge codes
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {attempt.maskedCodes.map((code, index) => (
              <code
                key={`${code}-${index}`}
                className="rounded-lg bg-surface-subtle px-3 py-2 text-xs font-semibold"
              >
                {code}
              </code>
            ))}
          </div>
        </div>
      )}

      {attempt.transactionId && (
        <div className="mt-5 border-t border-border pt-5">
          <p className="text-xs text-foreground-muted">Transaction ID</p>
          {transactionSafe ? (
            <a
              href={`https://mempool.space/tx/${encodeURIComponent(attempt.transactionId)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex max-w-full items-center gap-2 font-mono text-xs font-semibold break-all text-info hover:underline"
            >
              {attempt.transactionId}
              <ExternalLink aria-hidden="true" className="size-3.5 shrink-0" />
            </a>
          ) : (
            <p className="mt-1 font-mono text-xs break-all">
              {attempt.transactionId}
            </p>
          )}
        </div>
      )}

      {attempt.events.length > 0 && (
        <div className="mt-5 border-t border-border pt-5">
          <h3 className="text-sm font-semibold">Payment audit timeline</h3>
          <ol className="mt-3 grid gap-3">
            {attempt.events.map((event) => (
              <li
                key={event.id}
                className="grid grid-cols-[0.5rem_1fr] gap-3 text-xs"
              >
                <span className="mt-1 size-2 rounded-full bg-info" />
                <div>
                  <p className="font-semibold">
                    {event.eventType.replaceAll("_", " ")}
                  </p>
                  <p className="mt-0.5 text-foreground-muted">
                    {event.fromStatus
                      ? `${event.fromStatus} → ${event.toStatus}`
                      : event.toStatus}{" "}
                    · {new Date(event.occurredAt).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </Card>
  );
}
