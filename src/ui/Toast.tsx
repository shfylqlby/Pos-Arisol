"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Check, Info, AlertTriangle } from "lucide-react";

type ToastTone = "info" | "success" | "warning";

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastContextValue {
  show: (
    message: string,
    opts?: { tone?: ToastTone; actionLabel?: string; onAction?: () => void }
  ) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let counter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback<ToastContextValue["show"]>((message, opts) => {
    const id = ++counter;
    const item: ToastItem = {
      id,
      message,
      tone: opts?.tone ?? "info",
      actionLabel: opts?.actionLabel,
      onAction: opts?.onAction,
    };
    setToasts((prev) => [...prev, item]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            aria-live="polite"
            className="pointer-events-auto flex w-full max-w-md items-center gap-2 rounded-btn border border-border bg-surface px-4 py-3 shadow-lg"
          >
            <span
              className={
                t.tone === "success"
                  ? "text-success"
                  : t.tone === "warning"
                    ? "text-warning"
                    : "text-primary"
              }
            >
              {t.tone === "success" ? (
                <Check size={18} />
              ) : t.tone === "warning" ? (
                <AlertTriangle size={18} />
              ) : (
                <Info size={18} />
              )}
            </span>
            <span className="flex-1 text-sm text-ink">{t.message}</span>
            {t.actionLabel && t.onAction && (
              <button
                onClick={() => {
                  t.onAction?.();
                  setToasts((prev) => prev.filter((x) => x.id !== t.id));
                }}
                className="text-sm font-bold text-primary"
              >
                {t.actionLabel}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Safe fallback when used outside provider (e.g. tests)
    return { show: () => {} };
  }
  return ctx;
}

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}
