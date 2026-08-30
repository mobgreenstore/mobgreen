import type { ReactNode } from "react";
import { CartProvider } from "@/features/cart/cart-provider";

export default function StoreLayout({ children }: { children: ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
