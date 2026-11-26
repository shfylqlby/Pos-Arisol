"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, KeyRound, Mail } from "lucide-react";
import {
  getSession,
  isCloudConfigured,
  sendPasswordReset,
  signInWithGoogle,
  signInWithMagicLink,
  signInWithPassword,
} from "@/data/auth";
import { Button } from "@/ui/Button";
import { Field, TextInput } from "@/ui/Field";
import { useToast } from "@/ui/Toast";
import { Logo } from "@/ui/Logo";

function friendlyError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (/invalid login credentials/i.test(message)) return "Email atau kata sandi salah.";
  if (/email not confirmed/i.test(message))
    return "Email belum dikonfirmasi. Cek kotak masuk atau hubungi admin.";
  if (/rate limit/i.test(message)) return "Terlalu banyak percobaan. Coba lagi nanti.";
  return message || "Gagal masuk.";
}

export function AuthScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const { show } = useToast();
  const configured = isCloudConfigured();
  const nextPath = params.get("next") || "/kasir";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (!configured) return;
    let cancelled = false;
    void getSession().then((session) => {
      if (!cancelled && session) router.replace(nextPath);
    });
    return () => {
      cancelled = true;
    };
  }, [configured, nextPath, router]);

  const submitPassword = async () => {
    if (!email.trim() || !password) {
      show("Isi email dan kata sandi", { tone: "warning" });
      return;
    }
    setBusy(true);
    try {
      await signInWithPassword(email.trim(), password);
      router.replace(nextPath);
    } catch (err) {
      show(friendlyError(err), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  };

  const submitMagicLink = async () => {
    if (!email.trim()) {
      show("Isi email dulu", { tone: "warning" });
      return;
    }
    setBusy(true);
    try {
      await signInWithMagicLink(email.trim(), "/masuk");
      setLinkSent(true);
      show("Tautan masuk dikirim. Cek email.", { tone: "success" });
    } catch (err) {
      show(friendlyError(err), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  };

  const submitReset = async () => {
    if (!email.trim()) {
      show("Isi email akun dulu untuk reset kata sandi", { tone: "warning" });
      return;
    }
    setBusy(true);
    try {
      await sendPasswordReset(email.trim());
      setResetSent(true);
      show("Tautan reset dikirim. Cek email.", { tone: "success" });
    } catch (err) {
      show(friendlyError(err), { tone: "warning" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-8">
        <Link
          href="/POS"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-ink-muted hover:text-ink"
        >
          <ArrowLeft size={16} /> Kembali ke halaman POS
        </Link>

        <div className="rounded-card border border-border bg-surface p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <Logo size={52} priority />
            <div>
              <div className="text-base font-extrabold text-primary">POS Arisol</div>
              <div className="text-xs text-ink-muted">Arisol - Risol Mayo Banyumanik</div>
            </div>
          </div>
          <h1 className="text-xl font-extrabold">Masuk ke dashboard</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Dashboard hanya untuk pemilik dan staf yang punya akun.
          </p>

          {!configured ? (
            <div className="border-warning/30 bg-warning/10 mt-4 rounded-btn border p-3 text-sm">
              <p className="font-semibold">Mode lokal (tanpa cloud)</p>
              <p className="mt-1 text-xs text-ink-muted">
                Isi <code>NEXT_PUBLIC_SUPABASE_URL</code> dan{" "}
                <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> untuk mengaktifkan login.
              </p>
              <Link
                href="/kasir"
                className="mt-3 inline-flex min-h-[44px] items-center rounded-btn bg-primary px-4 text-sm font-bold text-on-primary"
              >
                Lanjut mode lokal
              </Link>
            </div>
          ) : (
            <>
              <div className="mt-4 flex flex-col gap-3">
                <Field label="Email" htmlFor="auth-email">
                  <TextInput
                    id="auth-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setLinkSent(false);
                    }}
                  />
                </Field>
                <Field label="Kata sandi" htmlFor="auth-password">
                  <div className="relative">
                    <TextInput
                      id="auth-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Kata sandi"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void submitPassword();
                      }}
                      className="pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-ink-muted"
                      aria-label={
                        showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
                      }
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </Field>

                <div className="-mt-1 flex justify-end">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={submitReset}
                    className="min-h-[44px] text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                  >
                    Lupa kata sandi?
                  </button>
                </div>

                <Button fullWidth size="lg" disabled={busy} onClick={submitPassword}>
                  <KeyRound size={18} /> {busy ? "Memproses..." : "Masuk"}
                </Button>

                <div className="flex items-center gap-2 text-[11px] text-ink-muted">
                  <span className="h-px flex-1 bg-border" />
                  atau
                  <span className="h-px flex-1 bg-border" />
                </div>

                <Button
                  variant="secondary"
                  fullWidth
                  disabled={busy}
                  onClick={async () => {
                    try {
                      await signInWithGoogle("/masuk");
                    } catch (err) {
                      show(friendlyError(err), { tone: "warning" });
                    }
                  }}
                >
                  Masuk dengan Google
                </Button>

                <Button
                  variant="secondary"
                  fullWidth
                  disabled={busy || !email.trim()}
                  onClick={submitMagicLink}
                >
                  <Mail size={18} /> Kirim tautan masuk
                </Button>

                {linkSent && (
                  <p className="text-xs text-success">
                    Tautan sudah dikirim ke email. Buka di perangkat ini, lalu kembali ke
                    halaman ini.
                  </p>
                )}
                {resetSent && (
                  <p className="text-xs text-success">
                    Tautan reset kata sandi sudah dikirim. Buka email, lalu atur kata sandi
                    baru.
                  </p>
                )}
              </div>

              <p className="mt-4 border-t border-border pt-3 text-xs text-ink-muted">
                Belum punya akun? Akun dibuat oleh pemilik usaha. Hubungi admin untuk
                didaftarkan, lalu masuk dengan Google atau tautan email.
              </p>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-[11px] text-ink-muted">
          Dengan masuk, kamu menyetujui penggunaan data untuk operasional usaha.
        </p>
      </div>
    </div>
  );
}
