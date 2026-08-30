"use client";

import * as ToastPrimitive from "@radix-ui/react-toast";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";

type ToastTone = "neutral" | "success" | "danger";
interface ToastInput {
  title: string;
  description?: string;
  tone?: ToastTone;
}
interface ToastRecord extends ToastInput {
  id: number;
  open: boolean;
}
interface ToastContextValue {
  toast: (input: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);
let toastSequence = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const toast = useCallback((input: ToastInput) => {
    const id = ++toastSequence;
    setToasts((current) => [...current, { ...input, id, open: true }]);
  }, []);
  const context = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={context}>
      <ToastPrimitive.Provider swipeDirection="right" duration={4500}>
        {children}
        {toasts.map((item) => {
          const Icon =
            item.tone === "success"
              ? CheckCircle2
              : item.tone === "danger"
                ? XCircle
                : Info;
          return (
            <ToastPrimitive.Root
              key={item.id}
              open={item.open}
              onOpenChange={(open) => {
                if (!open)
                  setToasts((current) =>
                    current.filter(({ id }) => id !== item.id),
                  );
              }}
              className={cn(
                "interaction-toast grid grid-cols-[auto_1fr_auto] items-start gap-3 rounded-lg border bg-surface p-4 shadow-md",
                item.tone === "success" && "border-success/30",
                item.tone === "danger" && "border-danger/30",
              )}
            >
              <Icon
                aria-hidden="true"
                className={cn(
                  "mt-0.5 size-5",
                  item.tone === "success" && "text-success",
                  item.tone === "danger" && "text-danger",
                  (!item.tone || item.tone === "neutral") && "text-info",
                )}
              />
              <div className="min-w-0">
                <ToastPrimitive.Title className="text-sm font-semibold">
                  {item.title}
                </ToastPrimitive.Title>
                {item.description && (
                  <ToastPrimitive.Description className="mt-1 text-[0.8125rem] leading-5 text-foreground-muted">
                    {item.description}
                  </ToastPrimitive.Description>
                )}
              </div>
              <ToastPrimitive.Close asChild>
                <IconButton
                  aria-label="Dismiss notification"
                  size="small"
                  className="-mt-2 -mr-2"
                >
                  <X aria-hidden="true" className="size-4" />
                </IconButton>
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          );
        })}
        <ToastPrimitive.Viewport className="safe-bottom fixed right-0 bottom-0 z-[100] flex w-full max-w-sm flex-col gap-2 p-4 outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
