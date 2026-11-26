"use client";

import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, Store, HandCoins } from "lucide-react";
import {
  listPartners,
  savePartner,
  getPartnerStockBalance,
  listSettlements,
} from "@/data/repositories/partners";

import type { Partner } from "@/data/schemas";
import { formatRupiah } from "@/domain/money";
import { Button } from "@/ui/Button";
import { EmptyState } from "@/ui/EmptyState";
import { Modal } from "@/ui/Modal";
import { Field, TextInput } from "@/ui/Field";
import { PartnerDetail } from "./PartnerDetail";
import { useToast } from "@/ui/Toast";

export function ConsignmentList() {
  const partners = useLiveQuery(() => listPartners(), [], undefined);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Partner | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">Titip jual</h2>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={18} /> Mitra
        </Button>
      </div>

      {partners === undefined ? (
        <div className="bg-border/40 h-32 animate-pulse rounded-card" />
      ) : partners.length === 0 ? (
        <EmptyState
          icon={<Store size={40} />}
          title="Belum ada mitra"
          description="Tambah warung atau kantin yang menerima titipan risol."
          action={<Button onClick={() => setCreateOpen(true)}>Tambah mitra</Button>}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {partners.map((p) => (
            <PartnerRow key={p.id} partner={p} onClick={() => setSelected(p)} />
          ))}
        </ul>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Mitra baru">
        <PartnerForm onDone={() => setCreateOpen(false)} />
      </Modal>

      {selected && <PartnerDetail partner={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function PartnerRow({ partner, onClick }: { partner: Partner; onClick: () => void }) {
  const balance = useLiveQuery(
    () => getPartnerStockBalance(partner.id),
    [partner.id],
    {} as Record<string, number>
  );
  const unpaid = useLiveQuery(
    async () => {
      const list = await listSettlements(partner.id);
      return list.filter((s) => s.status === "unpaid");
    },
    [partner.id],
    []
  );

  const totalBalance = Object.values(balance).reduce((a, b) => a + b, 0);
  const totalUnpaid = unpaid.reduce((a, s) => a + s.total_due, 0);

  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-1 rounded-card border border-border bg-surface p-3 text-left"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold">{partner.name}</span>
        {totalUnpaid > 0 && (
          <span className="text-xs font-semibold text-warning">
            Tagihan {formatRupiah(totalUnpaid)}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 text-xs text-ink-muted">
        <span className="inline-flex items-center gap-1">
          <HandCoins size={14} /> Sisa di mitra: {totalBalance} pcs
        </span>
      </div>
    </button>
  );
}

function PartnerForm({ onDone }: { onDone: () => void }) {
  const { show } = useToast();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim()) {
      show("Nama mitra wajib diisi", { tone: "warning" });
      return;
    }
    setSaving(true);
    try {
      await savePartner({ name: name.trim(), contact, note: null, is_active: true });
      show("Mitra ditambahkan", { tone: "success" });
      onDone();
    } catch (err) {
      console.error(err);
      show("Gagal menyimpan mitra", { tone: "warning" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Field label="Nama mitra">
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Warung Bu Tini"
        />
      </Field>
      <Field label="Kontak">
        <TextInput
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="08…"
        />
      </Field>
      <Button fullWidth disabled={saving} onClick={submit}>
        {saving ? "Menyimpan…" : "Simpan mitra"}
      </Button>
    </div>
  );
}
