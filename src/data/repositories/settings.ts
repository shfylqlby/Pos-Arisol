import { db } from "../db";
import type { Settings } from "../schemas";
import { recordOutbox } from "../sync/outbox";
import { getNowISO } from "@/lib/date";

export const DEFAULT_SETTINGS_ID = "default_settings";

export function defaultSettings(): Settings {
  return {
    id: DEFAULT_SETTINGS_ID,
    business_name: "Risol Bu Sari",
    address: "",
    phone: "",
    receipt_footer: "Terima kasih atas kunjungannya!",
    timezone: "Asia/Jakarta",
    low_stock_threshold_default: 10,
    device_label: "A",
    pin_hash: null,
    auto_return_seconds: 8,
    qris_image: null,
    updated_at: getNowISO(),
  };
}

// Read-only: safe to call inside useLiveQuery (no write in the live query transaction).
export async function getSettings(): Promise<Settings> {
  const settings = await db.settings.get(DEFAULT_SETTINGS_ID);
  return settings ?? defaultSettings();
}

// Creates the default row when missing. Call from app init, never inside useLiveQuery.
export async function ensureSettings(): Promise<Settings> {
  const existing = await db.settings.get(DEFAULT_SETTINGS_ID);
  if (existing) return existing;
  const settings = defaultSettings();
  await db.settings.put(settings);
  return settings;
}

export async function updateSettings(
  partial: Partial<Omit<Settings, "id">>
): Promise<Settings> {
  const current = await getSettings();
  const updated: Settings = {
    ...current,
    ...partial,
    updated_at: getNowISO(),
  };

  await db.transaction("rw", [db.settings, db.outbox], async () => {
    await db.settings.put(updated);
    // Don't sync pin_hash to outbox
    const { pin_hash, ...syncPayload } = updated;
    await recordOutbox(
      "settings",
      updated.id,
      "upsert",
      syncPayload as unknown as Record<string, unknown>
    );
  });

  return updated;
}
