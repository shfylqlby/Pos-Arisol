"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound } from "lucide-react";
import {
  getSession,
  isCloudConfigured,
  onAuthChange,
  updatePassword,
} from "@/data/auth";
import { Button } from "@/ui/Button";
import { Field, TextInput } from "@/ui/Field";
import { Logo } from "@/ui/Logo";

type Status = "checking" | "ready" | "invalid" | "done" | "local";

function friendlyError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (/should be at least|password.*characters/i.test(message)) {
    return "Kata sandi terlalu pendek. Gunakan minimal 8 karakter.";
  }
  if (/same.*password|different from the old/i.test(message)) {
    return "Kata sandi baru harus berbeda dari yang lama.";
  }
  if (/rate limit/i.test(message)) return "Terlalu banyak percobaan. Coba lagi nanti.";
  return message || "Gagal memperbarui kata sandi.";
}

export function ResetPasswordScreen() {
  const configured = isCloudConfigured();
  const [status, setStatus] = useState<Status>("checking");
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!configured) {
      setStatus("local");
      return;
    }

    const hash = window.location.hash.replace(/^#/, "");
    if (hash) {
      const hashParams = new URLSearchParams(hash);
      const hashError = hashParams.get("error_description") || hashParams.get("error");
      if (hashError) {
        setMessage(decodeURIComponent(hashError.replace(/\+/g, " ")));
        setStatus("invalid");
        return;
      }
    }

    let cancelled = false;
    void getSession().then((session) => {
      if (!cancelled) setStatus(session ? "ready" : "invalid");
    });
    const unsubscribe = onAuthChange((user) => {
      if (!cancelled && user) setStatus("ready");
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [configured]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");
    if (password.length < 8) {
      setMessage("Gunakan kata sandi minimal 8 karakter.");
      return;
    }
    if (password !== confirm) {
      setMessage("Konfirmasi kata sandi belum sama.");
      return;
    }
    setBusy(true);
    try {
      await updatePassword(password);
      setStatus("done");
      setPassword("");
      setConfirm("");
    } catch (err) {
      setMessage(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-8">
        <Link
          href="/masuk"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-ink-muted hover:text-ink"
        >
          <ArrowLeft size={16} /> Kembali ke halaman masuk
        </Link>

        <div className="rounded-card border border-border bg-surface p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <Logo size={52} priority />
            <div>
              <div className="text-base font-extrabold text-primary">POS Arisol</div>
              <div className="text-xs text-ink-muted">Atur ulang kata sandi</div>
            </div>
          </div>

          {status === "checking" && (
            <div className="flex items-center gap-3 py-6 text-sm text-ink-muted">
              <div className="border-primary/30 h-6 w-6 animate-spin rounded-full border-2 border-t-primary" />
              Memeriksa tautan reset...
            </div>
          )}

          {status === "local" && (
            <div className="border-warning/30 bg-warning/10 rounded-btn border p-3 text-sm">
              <p className="font-semibold">Mode lokal (tanpa cloud)</p>
              <p className="mt-1 text-xs text-ink-muted">
                Reset kata sandi hanya tersedia saat Supabase aktif.
              </p>
              <Link
                href="/kasir"
                className="mt-3 inline-flex min-h-[44px] items-center rounded-btn bg-primary px-4 text-sm font-bold text-on-primary"
              >
                Lanjut mode lokal
              </Link>
            </div>
          )}

          {status === "invalid" && (
            <div className="rounded-btn border border-border bg-bg p-3 text-sm">
              <p className="font-semibold">Tautan tidak valid atau kedaluwarsa</p>
              <p className="mt-1 text-xs text-ink-muted">
                Minta tautan baru dari halaman masuk, lalu buka tautannya di perangkat ini.
              </p>
              {message && <p className="mt-2 text-xs text-danger">{message}</p>}
              <Link
                href="/masuk"
                className="mt-3 inline-flex min-h-[44px] items-center rounded-btn bg-primary px-4 text-sm font-bold text-on-primary"
              >
                Minta tautan baru
              </Link>
            </div>
          )}

          {status === "ready" && (
            <>
              <h1 className="text-xl font-extrabold">Buat kata sandi baru</h1>
              <p className="mt-1 text-sm text-ink-muted">
                Setelah disimpan, kamu bisa masuk dengan kata sandi baru.
              </p>
              <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
                <Field label="Kata sandi baru" htmlFor="reset-password">
                  <div className="relative">
                    <TextInput
                      id="reset-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Minimal 8 karakter"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-ink-muted"
                      aria-label={
                        showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
                      }
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </Field>
                <Field label="Ulangi kata sandi" htmlFor="reset-confirm">
                  <TextInput
                    id="reset-confirm"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Ulangi kata sandi baru"
                    value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                  />
                </Field>

                {message && (
                  <p role="alert" className="text-sm font-medium text-danger">
                    {message}
                  </p>
                )}

                <Button type="submit" fullWidth size="lg" disabled={busy}>
                  <KeyRound size={18} /> {busy ? "Menyimpan..." : "Simpan kata sandi"}
                </Button>
              </form>
            </>
          )}

          {status === "done" && (
            <div className="text-sm">
              <div className="flex items-center gap-2 font-extrabold text-success">
                <CheckCircle2 size={20} /> Kata sandi diperbarui
              </div>
              <p className="mt-2 text-ink-muted">
                Kamu sudah bisa membuka dashboard dengan kata sandi baru.
              </p>
              <Link
                href="/kasir"
                className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center rounded-btn bg-primary px-4 text-sm font-bold text-on-primary"
              >
                Buka dashboard
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
