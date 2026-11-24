"use client";

import React, { useState } from "react";
import type { Product, ProductKind } from "@/data/schemas";
import { saveProduct } from "@/data/repositories/products";
import { formatRupiah, parseRupiah } from "@/domain/money";
import { Field, TextInput, NumberInput, Select } from "@/ui/Field";
import { Button } from "@/ui/Button";
import { Segmented } from "@/ui/Segmented";
import { useToast } from "@/ui/Toast";

interface ProductFormProps {
  product?: Product;
  allProducts: Product[];
  onDone: () => void;
}

export function ProductForm({ product, allProducts, onDone }: ProductFormProps) {
  const { show } = useToast();
  const [name, setName] = useState(product?.name ?? "");
  const [category, setCategory] = useState(product?.category ?? "Risol");
  const [kind, setKind] = useState<ProductKind>(product?.kind ?? "single");
  const [baseProductId, setBaseProductId] = useState(product?.base_product_id ?? "");
  const [unitQty, setUnitQty] = useState(product?.unit_qty ?? 1);
  const [price, setPrice] = useState(product?.price ?? 0);
  const [costPrice, setCostPrice] = useState(product?.cost_price ?? 0);
  const [trackStock, setTrackStock] = useState(product?.track_stock ?? true);
  const [threshold, setThreshold] = useState(product?.low_stock_threshold ?? "");
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  const baseCandidates = allProducts.filter(
    (p) => p.kind === "single" && p.id !== product?.id
  );

  const margin = price - costPrice;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      show("Nama produk wajib diisi", { tone: "warning" });
      return;
    }
    if (kind === "bundle" && !baseProductId) {
      show("Pilih produk dasar untuk paket", { tone: "warning" });
      return;
    }

    setSaving(true);
    try {
      await saveProduct({
        id: product?.id,
        name: name.trim(),
        category: category.trim() || "Risol",
        kind,
        base_product_id: kind === "bundle" ? baseProductId : null,
        unit_qty: kind === "bundle" ? Math.max(1, unitQty) : 1,
        price,
        cost_price: costPrice,
        track_stock: kind === "bundle" ? false : trackStock,
        low_stock_threshold:
          kind === "bundle" || threshold === ""
            ? null
            : Number(threshold),
        sort_order: product?.sort_order ?? allProducts.length,
        is_active: isActive,
        photo: product?.photo ?? null,
      });
      show(product ? "Produk diperbarui" : "Produk ditambahkan", { tone: "success" });
      onDone();
    } catch (err) {
      console.error(err);
      show(err instanceof Error ? err.message : "Gagal menyimpan produk", {
        tone: "warning",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <Field label="Nama produk" htmlFor="p-name">
        <TextInput
          id="p-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Risol Mayo"
          autoFocus
        />
      </Field>

      <Field label="Kategori" htmlFor="p-cat">
        <TextInput
          id="p-cat"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Risol"
        />
      </Field>

      <Field label="Jenis">
        <Segmented
          options={[
            { value: "single", label: "Satuan" },
            { value: "bundle", label: "Paket" },
          ]}
          value={kind}
          onChange={(v) => setKind(v as ProductKind)}
        />
      </Field>

      {kind === "bundle" && (
        <>
          <Field label="Produk dasar" htmlFor="p-base">
            <Select
              id="p-base"
              value={baseProductId}
              onChange={(e) => setBaseProductId(e.target.value)}
            >
              <option value="">Pilih produk…</option>
              {baseCandidates.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Isi per paket (pcs)" htmlFor="p-unit">
            <NumberInput
              id="p-unit"
              min={1}
              value={unitQty}
              onChange={(e) => setUnitQty(Number(e.target.value) || 1)}
            />
          </Field>
        </>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Field label="Harga jual" htmlFor="p-price">
          <TextInput
            id="p-price"
            inputMode="numeric"
            value={price || ""}
            onChange={(e) => setPrice(parseRupiah(e.target.value))}
            placeholder="0"
          />
        </Field>
        <Field label="Modal / pcs" htmlFor="p-cost">
          <TextInput
            id="p-cost"
            inputMode="numeric"
            value={costPrice || ""}
            onChange={(e) => setCostPrice(parseRupiah(e.target.value))}
            placeholder="0"
          />
        </Field>
      </div>

      <div className="rounded-btn bg-primary-soft/40 px-3 py-2 text-sm">
        Margin:{" "}
        <span className={`tabular-nums font-bold ${margin >= 0 ? "text-success" : "text-danger"}`}>
          {formatRupiah(margin)}
        </span>
      </div>

      {kind === "single" && (
        <>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={trackStock}
              onChange={(e) => setTrackStock(e.target.checked)}
              className="h-5 w-5 accent-primary"
            />
            Lacak stok produk ini
          </label>
          {trackStock && (
            <Field label="Batas stok menipis" htmlFor="p-thr" hint="Kosongkan untuk default pengaturan">
              <NumberInput
                id="p-thr"
                min={0}
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                placeholder="10"
              />
            </Field>
          )}
        </>
      )}

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-5 w-5 accent-primary"
        />
        Tampilkan di kasir
      </label>

      <Button type="submit" fullWidth disabled={saving}>
        {saving ? "Menyimpan…" : "Simpan produk"}
      </Button>
    </form>
  );
}
