"use client";

/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ImagePlus, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { isCloudConfigured } from "@/data/auth";
import { listProducts } from "@/data/repositories/products";
import {
  deletePublicMenuItem,
  fetchAllPublicMenu,
  savePublicMenuItem,
  uploadPublicMenuPhoto,
  type PublicMenuItem,
} from "@/data/public-menu";
import { formatRupiah } from "@/domain/money";
import { invalidatePublicMenuCache } from "@/features/landing/usePublicMenu";
import { Button } from "@/ui/Button";
import { BackLink } from "@/ui/BackLink";
import { Field, NumberInput, Select, TextInput } from "@/ui/Field";
import { useToast } from "@/ui/Toast";

type Draft = {
  id?: string;
  name: string;
  category: string;
  price: string;
  sort_order: string;
  active: boolean;
  image_url: string | null;
  product_id: string;
};

const emptyDraft = (category = "Risol Mayo"): Draft => ({
  name: "",
  category,
  price: "",
  sort_order: "0",
  active: true,
  image_url: null,
  product_id: "",
});

export function PublicMenuScreen() {
  const { show } = useToast();
  const configured = isCloudConfigured();
  const [items, setItems] = useState<PublicMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const products = useLiveQuery(() => listProducts(true), [], undefined);
  const stockProducts = (products ?? []).filter((p) => p.track_stock && p.kind === "single");

  const categories = useMemo(
    () => Array.from(new Set(items.map((item) => item.category))),
    [items]
  );

  const load = async () => {
    if (!configured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setItems(await fetchAllPublicMenu());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat menu publik.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured]);

  const startNew = () => {
    setDraft(emptyDraft(categories[0] ?? "Risol Mayo"));
    setFile(null);
    setPreview(null);
  };

  const startEdit = (item: PublicMenuItem) => {
    setDraft({
      id: item.id,
      name: item.name,
      category: item.category,
      price: String(item.price),
      sort_order: String(item.sort_order),
      active: item.active,
      image_url: item.image_url,
      product_id: item.product_id ?? "",
    });
    setFile(null);
    setPreview(item.image_url);
  };

  const closeDraft = () => {
    setDraft(null);
    setFile(null);
    setPreview(null);
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.name.trim()) {
      show("Nama menu wajib diisi", { tone: "warning" });
      return;
    }
    if (!draft.category.trim()) {
      show("Kategori wajib diisi", { tone: "warning" });
      return;
    }
    const price = Number(draft.price);
    if (!Number.isFinite(price) || price <= 0) {
      show("Harga harus lebih dari 0", { tone: "warning" });
      return;
    }
    setSaving(true);
    try {
      let imageUrl = draft.image_url;
      if (file) imageUrl = await uploadPublicMenuPhoto(file);
      await savePublicMenuItem({
        id: draft.id,
        name: draft.name,
        category: draft.category,
        price,
        image_url: imageUrl,
        sort_order: Number(draft.sort_order) || 0,
        active: draft.active,
        product_id: draft.product_id || null,
      });
      invalidatePublicMenuCache();
      show(draft.id ? "Menu diperbarui" : "Menu ditambahkan", { tone: "success" });
      closeDraft();
      await load();
    } catch (err) {
      show(err instanceof Error ? err.message : "Gagal menyimpan menu.", {
        tone: "warning",
      });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: PublicMenuItem) => {
    if (!window.confirm(`Hapus "${item.name}" dari menu publik?`)) return;
    try {
      await deletePublicMenuItem(item.id);
      invalidatePublicMenuCache();
      show("Menu dihapus", { tone: "success" });
      await load();
    } catch (err) {
      show(err instanceof Error ? err.message : "Gagal menghapus menu.", {
        tone: "warning",
      });
    }
  };

  if (!configured) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-6">
        <BackLink />
        <h1 className="text-lg font-extrabold">Menu publik</h1>
        <div className="border-warning/30 bg-warning/10 mt-4 rounded-card border p-4 text-sm">
          <p className="font-semibold">Menu publik butuh Supabase</p>
          <p className="mt-1 text-xs text-ink-muted">
            Hubungkan akun cloud dulu agar menu, foto, dan harga bisa diatur dari POS dan
            tampil di halaman Arisol.
          </p>
          <Link
            href="/lainnya/sinkronisasi"
            className="mt-3 inline-flex min-h-[44px] items-center rounded-btn bg-primary px-4 text-sm font-bold text-on-primary"
          >
            Buka Sinkronisasi
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-4">
      <BackLink />
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-extrabold">Menu publik</h1>
          <p className="text-xs text-ink-muted">
            Tampil di halaman Arisol. Perubahan langsung terlihat setelah halaman dimuat
            ulang.
          </p>
        </div>
        <Button variant="secondary" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={16} /> Muat ulang
        </Button>
      </div>

      {error && (
        <div className="mb-3 rounded-card border border-danger/30 bg-danger/5 p-3 text-sm">
          <p className="font-semibold text-danger">Gagal memuat menu</p>
          <p className="mt-1 text-xs text-ink-muted">{error}</p>
          <p className="mt-1 text-xs text-ink-muted">
            Pastikan migrasi `003_public_menu.sql` dan `004_public_menu_stock.sql` sudah dijalankan di Supabase.
          </p>
        </div>
      )}

      {!draft && (
        <Button className="mb-3" fullWidth onClick={startNew}>
          <Plus size={18} /> Tambah menu
        </Button>
      )}

      {draft && (
        <div className="mb-4 rounded-card border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold">
              {draft.id ? "Ubah menu" : "Menu baru"}
            </h2>
            <button
              type="button"
              onClick={closeDraft}
              aria-label="Tutup form"
              className="flex h-11 w-11 items-center justify-center rounded-btn text-ink-muted"
            >
              <X size={18} />
            </button>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Nama menu" htmlFor="pm-name">
              <TextInput
                id="pm-name"
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                placeholder="Risol Mayo Sosis Telur"
              />
            </Field>
            <Field label="Kategori" htmlFor="pm-category">
              <TextInput
                id="pm-category"
                value={draft.category}
                onChange={(event) => setDraft({ ...draft, category: event.target.value })}
                placeholder="Risol Mayo"
                list="pm-categories"
              />
              <datalist id="pm-categories">
                {categories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </Field>
            <Field label="Harga (Rp)" htmlFor="pm-price">
              <NumberInput
                id="pm-price"
                value={draft.price}
                onChange={(event) => setDraft({ ...draft, price: event.target.value })}
                placeholder="3000"
                min={0}
              />
            </Field>
            <Field
              label="Produk stok"
              htmlFor="pm-product"
              hint="Hubungkan agar stok tampil dan membatasi pre-order"
            >
              <Select
                id="pm-product"
                value={draft.product_id}
                onChange={(event) => setDraft({ ...draft, product_id: event.target.value })}
              >
                <option value="">Tidak dihubungkan (stok bebas)</option>
                {stockProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Urutan" htmlFor="pm-order" hint="Angka kecil tampil lebih dulu">
              <NumberInput
                id="pm-order"
                value={draft.sort_order}
                onChange={(event) =>
                  setDraft({ ...draft, sort_order: event.target.value })
                }
                min={0}
              />
            </Field>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <input
              id="pm-active"
              type="checkbox"
              checked={draft.active}
              onChange={(event) => setDraft({ ...draft, active: event.target.checked })}
              className="h-5 w-5 accent-primary"
            />
            <label htmlFor="pm-active" className="text-sm font-semibold">
              Tampilkan di halaman publik
            </label>
          </div>

          <div className="mt-3">
            <p className="text-sm font-semibold">Foto menu</p>
            <div className="mt-2 flex items-center gap-3">
              {preview ? (
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-btn border border-border">
                  <img src={preview} alt="" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-btn border border-dashed border-border text-ink-muted">
                  <ImagePlus size={22} />
                </div>
              )}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="pm-photo"
                  className="inline-flex min-h-[44px] cursor-pointer items-center rounded-btn border border-border bg-surface px-3 text-sm font-semibold"
                >
                  Pilih foto
                </label>
                <input
                  id="pm-photo"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => {
                    const selected = event.target.files?.[0] ?? null;
                    setFile(selected);
                    setPreview(selected ? URL.createObjectURL(selected) : draft.image_url);
                  }}
                />
                <span className="text-[11px] text-ink-muted">JPG/PNG, maksimal 2 MB.</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button fullWidth onClick={save} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
            <Button variant="secondary" onClick={closeDraft} disabled={saving}>
              Batal
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="py-8 text-center text-sm text-ink-muted">Memuat menu...</p>
      ) : items.length === 0 ? (
        <div className="rounded-card border border-border bg-surface p-6 text-center">
          <p className="text-sm font-semibold">Belum ada menu publik</p>
          <p className="mt-1 text-xs text-ink-muted">
            Tambahkan menu pertama. Halaman Arisol memakai menu contoh sampai menu publik
            diisi.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-card border border-border bg-surface">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 p-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-btn bg-primary-soft">
                {item.image_url ? (
                  <Image
                    src={item.image_url}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{item.name}</p>
                <p className="text-xs text-ink-muted">
                  {item.category} · {formatRupiah(item.price)}
                  {item.product_id
                    ? ` · Stok ${Math.max(0, item.stock_qty ?? 0)}`
                    : " · Stok bebas"}
                  {!item.active && " · disembunyikan"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => startEdit(item)}
                aria-label={`Ubah ${item.name}`}
                className="flex h-11 w-11 items-center justify-center rounded-btn text-ink-muted hover:text-ink"
              >
                <Pencil size={17} />
              </button>
              <button
                type="button"
                onClick={() => void remove(item)}
                aria-label={`Hapus ${item.name}`}
                className="flex h-11 w-11 items-center justify-center rounded-btn text-danger"
              >
                <Trash2 size={17} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
