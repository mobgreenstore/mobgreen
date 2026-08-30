"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  CART_STORAGE_KEY,
  addCartLine,
  clearCart as clearCartLines,
  readStoredCart,
  removeCartLine,
  updateCartLineQuantity,
  writeStoredCart,
} from "@/features/cart/domain";
import type {
  CartLoadStatus,
  CartValidationResult,
  StoredCartLine,
} from "@/features/cart/types";
import { useToast } from "@/components/ui/toast";

const EMPTY_CART: CartValidationResult = {
  lines: [],
  itemCount: 0,
  currency: null,
  currencies: [],
  subtotalMinor: 0,
  hasCurrencyConflict: false,
  checkoutEligible: false,
};

interface CartContextValue {
  storedLines: StoredCartLine[];
  cart: CartValidationResult;
  status: CartLoadStatus;
  error: string | null;
  itemCount: number;
  addItem: (
    productId: string,
    priceOptionId: string,
    specialOfferId?: string,
  ) => Promise<boolean>;
  updateQuantity: (identity: string, quantity: number) => void;
  removeItem: (identity: string) => void;
  clear: () => void;
  refresh: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

async function requestCartValidation(
  lines: readonly StoredCartLine[],
): Promise<CartValidationResult> {
  const response = await fetch("/api/cart/validate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ lines }),
  });
  if (!response.ok) throw new Error("Cart validation failed");
  const payload = (await response.json()) as { cart?: CartValidationResult };
  if (!payload.cart || !Array.isArray(payload.cart.lines)) {
    throw new Error("Invalid cart response");
  }
  return payload.cart;
}

function addChangeWarnings(
  next: CartValidationResult,
  previous: CartValidationResult,
): CartValidationResult {
  const previousLines = new Map(previous.lines.map((line) => [line.key, line]));
  return {
    ...next,
    lines: next.lines.map((line) => {
      const oldLine = previousLines.get(line.key);
      if (!oldLine) return line;
      const issues = [...line.issues];
      if (
        oldLine.option &&
        line.option &&
        (oldLine.option.priceMinor !== line.option.priceMinor ||
          oldLine.option.currency !== line.option.currency)
      ) {
        issues.push({
          code: "PRICE_CHANGED",
          message:
            "The price changed. The current server-confirmed price is shown.",
        });
      }
      if (
        oldLine.productName !== line.productName ||
        (oldLine.option &&
          line.option &&
          (oldLine.option.weightValue !== line.option.weightValue ||
            oldLine.option.weightUnit !== line.option.weightUnit))
      ) {
        issues.push({
          code: "PRODUCT_CHANGED",
          message: "The product details changed. Review this selection.",
        });
      }
      return { ...line, issues };
    }),
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [storedLines, setStoredLines] = useState<StoredCartLine[]>([]);
  const [cart, setCart] = useState<CartValidationResult>(EMPTY_CART);
  const [status, setStatus] = useState<CartLoadStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const linesRef = useRef<StoredCartLine[]>([]);
  const cartRef = useRef<CartValidationResult>(EMPTY_CART);
  const requestSequence = useRef(0);

  const acceptCart = useCallback(
    (
      lines: StoredCartLine[],
      result: CartValidationResult,
      persist: boolean,
    ) => {
      const enriched = addChangeWarnings(result, cartRef.current);
      linesRef.current = lines;
      cartRef.current = enriched;
      setStoredLines(lines);
      setCart(enriched);
      setError(null);
      setStatus("ready");
      if (persist) {
        try {
          writeStoredCart(window.localStorage, lines);
        } catch {
          toast({
            title: "Cart was not saved",
            description: "Your browser blocked local cart storage.",
            tone: "danger",
          });
        }
      }
      const count = lines.reduce((total, line) => total + line.quantity, 0);
      setAnnouncement(
        count === 1 ? "Cart contains 1 item." : `Cart contains ${count} items.`,
      );
    },
    [toast],
  );

  const validateAndAccept = useCallback(
    async (lines: StoredCartLine[], persist: boolean) => {
      const requestId = ++requestSequence.current;
      setStatus(lines.length ? "refreshing" : "ready");
      if (lines.length === 0) {
        acceptCart([], EMPTY_CART, persist);
        return true;
      }
      try {
        const result = await requestCartValidation(lines);
        if (requestId !== requestSequence.current) return false;
        acceptCart(lines, result, persist);
        return true;
      } catch {
        if (requestId !== requestSequence.current) return false;
        setStatus("error");
        setError("Current prices and availability could not be confirmed.");
        return false;
      }
    },
    [acceptCart],
  );

  useEffect(() => {
    let active = true;
    const lines = readStoredCart(window.localStorage);
    linesRef.current = lines;
    queueMicrotask(() => {
      if (active) void validateAndAccept(lines, false);
    });

    const synchronize = (event: StorageEvent) => {
      if (event.key !== CART_STORAGE_KEY && event.key !== null) return;
      const synchronized = readStoredCart(window.localStorage);
      linesRef.current = synchronized;
      setStoredLines(synchronized);
      void validateAndAccept(synchronized, false);
    };
    window.addEventListener("storage", synchronize);
    return () => {
      active = false;
      requestSequence.current += 1;
      window.removeEventListener("storage", synchronize);
    };
  }, [validateAndAccept]);

  const addItem = useCallback(
    async (
      productId: string,
      priceOptionId: string,
      specialOfferId?: string,
    ) => {
      const candidate = addCartLine(linesRef.current, {
        productId,
        priceOptionId,
        ...(specialOfferId ? { specialOfferId } : {}),
      });
      const requestId = ++requestSequence.current;
      setStatus("refreshing");
      try {
        const result = await requestCartValidation(candidate);
        if (requestId !== requestSequence.current) return false;
        const selected = result.lines.find(
          (line) =>
            line.productId === productId &&
            line.priceOptionId === priceOptionId &&
            line.specialOfferId === specialOfferId,
        );
        if (!selected?.available) {
          setStatus("ready");
          toast({
            title: "Item is unavailable",
            description:
              selected?.issues[0]?.message ??
              "The store could not confirm this selection.",
            tone: "danger",
          });
          return false;
        }
        if (result.hasCurrencyConflict) {
          setStatus("ready");
          toast({
            title: "Choose one currency",
            description:
              "A cart can contain GBP, EUR, or USD items, but not more than one currency at a time.",
            tone: "danger",
          });
          return false;
        }
        acceptCart(candidate, result, true);
        toast({
          title: "Added to cart",
          description: `${selected.productName} is ready in your cart.`,
          tone: "success",
        });
        return true;
      } catch {
        if (requestId !== requestSequence.current) return false;
        setStatus("error");
        setError("The item could not be confirmed by the store.");
        toast({
          title: "Could not add item",
          description: "Check your connection and try again.",
          tone: "danger",
        });
        return false;
      }
    },
    [acceptCart, toast],
  );

  const updateQuantity = useCallback(
    (identity: string, quantity: number) => {
      const candidate = updateCartLineQuantity(
        linesRef.current,
        identity,
        quantity,
      );
      linesRef.current = candidate;
      setStoredLines(candidate);
      try {
        writeStoredCart(window.localStorage, candidate);
      } catch {
        toast({ title: "Cart was not saved", tone: "danger" });
      }
      void validateAndAccept(candidate, false);
    },
    [toast, validateAndAccept],
  );

  const removeItem = useCallback(
    (identity: string) => {
      const candidate = removeCartLine(linesRef.current, identity);
      void validateAndAccept(candidate, true);
      toast({ title: "Item removed", tone: "neutral" });
    },
    [toast, validateAndAccept],
  );

  const clear = useCallback(() => {
    requestSequence.current += 1;
    acceptCart(clearCartLines(), EMPTY_CART, true);
    toast({ title: "Cart cleared", tone: "neutral" });
  }, [acceptCart, toast]);

  const refresh = useCallback(() => {
    void validateAndAccept(linesRef.current, false);
  }, [validateAndAccept]);

  const itemCount = useMemo(
    () => storedLines.reduce((total, line) => total + line.quantity, 0),
    [storedLines],
  );
  const value = useMemo(
    () => ({
      storedLines,
      cart,
      status,
      error,
      itemCount,
      addItem,
      updateQuantity,
      removeItem,
      clear,
      refresh,
    }),
    [
      storedLines,
      cart,
      status,
      error,
      itemCount,
      addItem,
      updateQuantity,
      removeItem,
      clear,
      refresh,
    ],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}

export { addChangeWarnings };
