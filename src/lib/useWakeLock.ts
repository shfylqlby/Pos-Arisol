"use client";

import { useEffect } from "react";

export function useWakeLock(active = true) {
  useEffect(() => {
    if (!active) return;
    if (typeof navigator === "undefined" || !navigator.wakeLock) return;

    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const request = async () => {
      try {
        sentinel = await navigator.wakeLock.request("screen");
        if (cancelled) {
          await sentinel.release();
          sentinel = null;
          return;
        }
        sentinel.addEventListener("release", () => {
          sentinel = null;
        });
      } catch {
        /* not supported or denied */
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible" && !sentinel) {
        void request();
      }
    };

    void request();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      if (sentinel) void sentinel.release();
    };
  }, [active]);
}
