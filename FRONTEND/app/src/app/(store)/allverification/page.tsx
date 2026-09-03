import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  CheckoutConfirmationRoute,
  confirmationMetadata,
} from "@/features/delivery-matching/components/checkout-confirmation-route";

export const metadata: Metadata = {
  ...confirmationMetadata,
  title: "Verification · MOB GREENS",
};

export default async function AllVerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string }>;
}) {
  const params = await searchParams;
  if (!params.intent) redirect("/checkout");
  return <CheckoutConfirmationRoute searchParams={Promise.resolve(params)} />;
}
