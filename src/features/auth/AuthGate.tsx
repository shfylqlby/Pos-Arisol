"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isCloudConfigured, getSession, onAuthChange } from "@/data/auth";

type GateState = "checking" | "allowed" | "denied";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const configured = isCloudConfigured();
  const [state, setState] = useState<GateState>(configured ? "checking" : "allowed");

  useEffect(() => {
    if (!configured) {
      setState("allowed");
      return;
    }

    let cancelled = false;
    void getSession()
      .then((session) => {
        if (!cancelled) setState(session ? "allowed" : "denied");
      })
      .catch(() => {
        if (!cancelled) setState("denied");
      });

    const unsub = onAuthChange((user) => {
      if (!cancelled) setState(user ? "allowed" : "denied");
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [configured]);

  useEffect(() => {
    if (state !== "denied") return;
    const next = encodeURIComponent(pathname || "/kasir");
    router.replace(`/masuk?next=${next}`);
  }, [state, pathname, router]);

  if (state === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="border-primary/30 h-10 w-10 animate-spin rounded-full border-4 border-t-primary" />
          <p className="text-sm text-ink-muted">Memeriksa sesi...</p>
        </div>
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <p className="text-sm text-ink-muted">Mengalihkan ke halaman masuk...</p>
      </div>
    );
  }

  return <>{children}</>;
}
