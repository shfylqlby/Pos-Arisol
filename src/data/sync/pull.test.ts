import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  client: null as unknown,
  rows: {} as Record<string, Record<string, unknown>[]>,
}));

vi.mock("./supabase", () => ({
  getSupabaseClient: () => state.client,
}));

import { db } from "../db";
import { pullAll } from "./pull";

function fakeClient() {
  return {
    auth: {
      getSession: async () => ({ data: { session: { user: { id: "user-1" } } } }),
    },
    from: (table: string) => ({
      select: () => ({
        gt: () => ({
          order: () => ({
            limit: async () => ({ data: state.rows[table] ?? [], error: null }),
          }),
        }),
      }),
    }),
  };
}

beforeEach(async () => {
  state.client = null;
  state.rows = {};
  await db.settings.clear();
  await db.outbox.clear();
  await db.sync_state.clear();
});

describe("pullAll", () => {
  it("mempertahankan pin_hash lokal saat menarik settings dari server", async () => {
    state.client = fakeClient();
    await db.settings.put({
      id: "default_settings",
      business_name: "Lokal",
      address: "",
      phone: "",
      receipt_footer: "Terima kasih",
      timezone: "Asia/Jakarta",
      low_stock_threshold_default: 10,
      device_label: "A",
      pin_hash: "hash-lokal",
      auto_return_seconds: 8,
      qris_image: null,
      updated_at: "2026-01-01T00:00:00.000Z",
    });
    state.rows.settings = [
      {
        id: "default_settings",
        owner_id: "user-1",
        device_id: "A",
        business_name: "Dari Cloud",
        address: "",
        phone: "",
        receipt_footer: "Terima kasih",
        timezone: "Asia/Jakarta",
        low_stock_threshold_default: 10,
        device_label: "A",
        auto_return_seconds: 8,
        qris_image: null,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
        server_updated_at: "2026-01-02T00:00:00.000Z",
      },
    ];

    await pullAll();

    const settings = await db.settings.get("default_settings");
    expect(settings?.business_name).toBe("Dari Cloud");
    expect(settings?.pin_hash).toBe("hash-lokal");
    expect(await db.sync_state.get("settings")).toMatchObject({
      cursor: "2026-01-02T00:00:00.000Z",
    });
  });

  it("tidak menimpa baris yang masih punya outbox pending", async () => {
    state.client = fakeClient();
    await db.settings.put({
      id: "default_settings",
      business_name: "Lokal",
      address: "",
      phone: "",
      receipt_footer: "Terima kasih",
      timezone: "Asia/Jakarta",
      low_stock_threshold_default: 10,
      device_label: "A",
      pin_hash: null,
      auto_return_seconds: 8,
      qris_image: null,
      updated_at: "2026-01-03T00:00:00.000Z",
    });
    await db.outbox.add({
      table: "settings",
      row_id: "default_settings",
      op: "upsert",
      payload: {},
      attempts: 0,
      status: "pending",
      last_error: null,
      created_at: "2026-01-03T00:00:00.000Z",
    } as never);
    state.rows.settings = [
      {
        id: "default_settings",
        business_name: "Dari Cloud",
        server_updated_at: "2026-01-02T00:00:00.000Z",
      },
    ];

    await pullAll();

    const settings = await db.settings.get("default_settings");
    expect(settings?.business_name).toBe("Lokal");
  });
});
