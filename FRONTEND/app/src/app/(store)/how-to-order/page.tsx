import type { Metadata } from "next";
import { HowToOrderPage } from "@/features/how-to-order/components/how-to-order-page";

export const metadata: Metadata = {
  title: "How to order · MOB GREENS",
  description:
    "A clear guide to browsing, checkout, secure payment verification, delivery matching, and order tracking at MOB GREENS.",
};

export default function Page() {
  return <HowToOrderPage />;
}
