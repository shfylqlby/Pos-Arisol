"use client";

import React, { useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Moon, Sun, Monitor, Lock, Unlock, ImagePlus } from "lucide-react";
import { getSettings, updateSettings } from "@/data/repositories/settings";
import { Field, TextInput, NumberInput, TextArea } from "@/ui/Field";
import { Button } from "@/ui/Button";
import { Segmented } from "@/ui/Segmented";
import { Modal } from "@/ui/Modal";
import { useToast } from "@/ui/Toast";

type Theme = "light" | "dark" | "system";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("dark");
  if (theme === "dark") root.classList.add("dark");
  if (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    root.classList.add("dark");
  }
  localStorage.setItem("pos-theme", theme);
}

export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(`pos-risol:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function SettingsScreen() {
  const settings = useLiveQuery(() => getSettings(), [], undefined);
  const { show } = useToast();

  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [footer, setFooter] = useState("");
  const [deviceLabel, setDeviceLabel] = useState("A");
  const [timezone, setTimezone] = useState("Asia/Jakarta");
  const [threshold, setThreshold] = useState("10");
  const [autoReturn, setAutoReturn] = useState("8");
  const [qrisImage, setQrisImage] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>("system");
  const [saving, setSaving] = useState(false);
  const [pinModal, setPinModal] = useState<"set" | "remove" | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!settings) return;
    setBusinessName(settings.business_name);
    setAddress(settings.address);
    setPhone(settings.phone);
    setFooter(settings.receipt_footer);
    setDeviceLabel(settings.device_label);
    setTimezone(settings.timezone);
    setThreshold(String(settings.low_stock_threshold_default));
    setAutoReturn(String(settings.auto_return_seconds));
    setQrisImage(settings.qris_image);
    const saved = (localStorage.getItem("pos-theme") as Theme | null) ?? "system";
    setTheme(saved);
  }, [settings]);

  const onPickImage = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 800;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setQrisImage(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!businessName.trim()) {
      show("Nama usaha wajib diisi", { tone: "warning" });
      return;
    }
    setSaving(true);
    try {
      await updateSettings({
        business_name: businessName.trim(),
        address,
        phone,
        receipt_footer: footer,
        device_label: deviceLabel.trim().toUpperCase().slice(0, 2) || "A",
        timezone,
        low_stock_threshold_default: Math.max(0, Number(threshold) || 0),
        auto_return_seconds: Math.max(0, Number(autoReturn) || 0),
        qris_image: qrisImage,
      });
      applyTheme(theme);
      show("Pengaturan disimpan", { tone: "success" });
    } catch (err) {
      console.error(err);
      show("Gagal menyimpan pengaturan", { tone: "warning" });
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return <div className="mx-auto max-w-2xl px-4 py-6 text-sm text-ink-muted">Memuat…</div>;
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-4">
      <h1 className="mb-4 text-lg font-extrabold">Pengaturan</h1>

      <section className="mb-5 flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
        <h2 className="text-sm font-bold">Profil usaha</h2>
        <Field label="Nama usaha" htmlFor="s-name">
          <TextInput id="s-name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
        </Field>
        <Field label="Alamat" htmlFor="s-addr">
          <TextArea id="s-addr" value={address} onChange={(e) => setAddress(e.target.value)} />
        </Field>
        <Field label="Telepon / WhatsApp" htmlFor="s-phone">
          <TextInput id="s-phone" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
        </Field>
        <Field label="Teks bawah struk" htmlFor="s-footer">
          <TextInput id="s-footer" value={footer} onChange={(e) => setFooter(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Label perangkat" htmlFor="s-device" hint="Contoh: A, B">
            <TextInput
              id="s-device"
              value={deviceLabel}
              maxLength={2}
              onChange={(e) => setDeviceLabel(e.target.value.toUpperCase())}
            />
          </Field>
          <Field label="Zona waktu" htmlFor="s-tz">
            <TextInput id="s-tz" value={timezone} onChange={(e) => setTimezone(e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Ambang stok" htmlFor="s-thr">
            <NumberInput
              id="s-thr"
              min={0}
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
            />
          </Field>
          <Field label="Auto kembali (detik)" htmlFor="s-auto">
            <NumberInput
              id="s-auto"
              min={0}
              value={autoReturn}
              onChange={(e) => setAutoReturn(e.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="mb-5 flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
        <h2 className="text-sm font-bold">QRIS</h2>
        <p className="text-xs text-ink-muted">
          Unggah gambar QRIS untuk ditampilkan saat pembayaran non-tunai.
        </p>
        {qrisImage ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrisImage} alt="QRIS" className="h-28 w-28 rounded-btn border border-border object-contain" />
            <Button variant="secondary" onClick={() => setQrisImage(null)}>
              Hapus
            </Button>
          </div>
        ) : (
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            <ImagePlus size={18} /> Pilih gambar
          </Button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPickImage(f);
            e.target.value = "";
          }}
        />
      </section>

      <section className="mb-5 flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
        <h2 className="text-sm font-bold">Tema</h2>
        <Segmented
          options={[
            { value: "light", label: "Terang" },
            { value: "dark", label: "Gelap" },
            { value: "system", label: "Sistem" },
          ]}
          value={theme}
          onChange={(v) => {
            setTheme(v as Theme);
            applyTheme(v as Theme);
          }}
        />
        <div className="flex gap-3 text-ink-muted">
          <Sun size={16} />
          <Moon size={16} />
          <Monitor size={16} />
        </div>
      </section>

      <section className="mb-5 flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
        <h2 className="text-sm font-bold">Kunci PIN</h2>
        <p className="text-xs text-ink-muted">
          PIN 4 digit opsional untuk membuka menu Lainnya di HP yang dipakai bersama.
        </p>
        {settings.pin_hash ? (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setPinModal("set")}>
              <Lock size={18} /> Ganti PIN
            </Button>
            <Button variant="danger" onClick={() => setPinModal("remove")}>
              <Unlock size={18} /> Hapus PIN
            </Button>
          </div>
        ) : (
          <Button variant="secondary" onClick={() => setPinModal("set")}>
            <Lock size={18} /> Pasang PIN
          </Button>
        )}
      </section>

      <Button fullWidth size="lg" disabled={saving} onClick={save}>
        {saving ? "Menyimpan…" : "Simpan pengaturan"}
      </Button>

      <PinModal
        mode={pinModal}
        currentHash={settings.pin_hash}
        onClose={() => setPinModal(null)}
        onDone={async () => {
          setPinModal(null);
          show("PIN diperbarui", { tone: "success" });
        }}
      />
    </div>
  );
}

function PinModal({
  mode,
  currentHash,
  onClose,
  onDone,
}: {
  mode: "set" | "remove" | null;
  currentHash: string | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const { show } = useToast();
  const [current, setCurrent] = useState("");
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");

  const submit = async () => {
    if (mode === "remove") {
      if (!currentHash || (await hashPin(current)) !== currentHash) {
        show("PIN salah", { tone: "warning" });
        return;
      }
      await updateSettings({ pin_hash: null });
      onDone();
      return;
    }
    if (currentHash && (await hashPin(current)) !== currentHash) {
      show("PIN lama salah", { tone: "warning" });
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      show("PIN harus 4 digit", { tone: "warning" });
      return;
    }
    if (pin !== confirm) {
      show("Konfirmasi PIN tidak sama", { tone: "warning" });
      return;
    }
    await updateSettings({ pin_hash: await hashPin(pin) });
    onDone();
  };

  return (
    <Modal
      open={mode !== null}
      onClose={onClose}
      title={mode === "remove" ? "Hapus PIN" : currentHash ? "Ganti PIN" : "Pasang PIN"}
      footer={
        <Button fullWidth onClick={submit}>
          Simpan
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        {currentHash && (
          <Field label="PIN lama" htmlFor="pin-old">
            <TextInput
              id="pin-old"
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={current}
              onChange={(e) => setCurrent(e.target.value.replace(/\D/g, ""))}
            />
          </Field>
        )}
        {mode === "set" && (
          <>
            <Field label="PIN baru (4 digit)" htmlFor="pin-new">
              <TextInput
                id="pin-new"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              />
            </Field>
            <Field label="Ulangi PIN" htmlFor="pin-confirm">
              <TextInput
                id="pin-confirm"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value.replace(/\D/g, ""))}
              />
            </Field>
          </>
        )}
      </div>
    </Modal>
  );
}
