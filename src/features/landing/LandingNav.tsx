"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSession, isCloudConfigured, onAuthChange } from "@/data/auth";
import { Logo } from "@/ui/Logo";

export function LandingNav() {
  const configured = isCloudConfigured();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    if (!configured) return;
    let cancelled = false;
    void getSession().then((session) => {
      if (!cancelled) setSignedIn(Boolean(session));
    });
    const unsub = onAuthChange((user) => {
      if (!cancelled) setSignedIn(Boolean(user));
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [configured]);

  return (
    <header className="border-border/70 bg-bg/90 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/POS" className="flex items-center gap-2">
          <Logo size={40} priority />
          <span className="text-base font-extrabold tracking-tight">POS Risol</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/"
            className="hidden min-h-[44px] items-center rounded-btn px-3 text-sm font-semibold text-ink-muted hover:text-ink sm:inline-flex"
          >
            Arisol
          </Link>
          <a
            href="#fitur"
            className="hidden min-h-[44px] items-center rounded-btn px-3 text-sm font-semibold text-ink-muted hover:text-ink sm:inline-flex"
          >
            Fitur
          </a>
          <a
            href="#cara"
            className="hidden min-h-[44px] items-center rounded-btn px-3 text-sm font-semibold text-ink-muted hover:text-ink sm:inline-flex"
          >
            Cara kerja
          </a>
          <Link
            href={signedIn ? "/kasir" : "/masuk"}
            className="inline-flex min-h-[44px] items-center rounded-btn bg-primary px-4 text-sm font-bold text-on-primary hover:opacity-90"
          >
            {signedIn ? "Buka POS" : "Masuk"}
          </Link>
        </nav>
      </div>
    </header>
  );
}
