import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  client: null as unknown,
}));

vi.mock("./supabase", () => ({
  getSupabaseClient: () => state.client,
}));

import { db } from "../db";
import { pushOutboxBatch } from "./push";

type UpsertResult = { error: { message: string; code?: string } | null };

function fakeClient(
  options: {
    session?: boolean;
    result?: UpsertResult;
    upserts?: Record<string, unknown>[];
  } = {}
) {
  const { session = true, result = { error: null }, upserts = [] } = options;
  return {
    auth: {
      getSession: async () => ({
        data: { session: session ? { user: { id: "user-1" } } : null },
      }),
    },
    from: () => ({
      upsert: async (payload: Record<string, unknown>) => {
        upserts.push(payload);
        return result;
      },
    }),
  };
}

async function addOutbox(overrides: Partial<Record<string, unknown>> = {}) {
  return db.outbox.add({
    table: "products",
    row_id: "p1",
    op: "upsert",
    payload: { id: "p1", name: "Risol Mayo" },
    attempts: 0,
    status: "pending",
    last_error: null,
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  } as never);
}

beforeEach(async () => {
  state.client = null;
  await db.outbox.clear();
});

describe("pushOutboxBatch", () => {
  it("tidak melakukan apa pun tanpa konfigurasi cloud", async () => {
    await addOutbox();
    await expect(pushOutboxBatch()).resolves.toEqual({ pushed: 0, failed: 0 });
    expect(await db.outbox.count()).toBe(1);
  });

  it("tidak melakukan apa pun tanpa sesi login", async () => {
    state.client = fakeClient({ session: false });
    await addOutbox();
    await expect(pushOutboxBatch()).resolves.toEqual({ pushed: 0, failed: 0 });
    expect(await db.outbox.count()).toBe(1);
  });

  it("menghapus item dan mengisi owner_id saat berhasil", async () => {
    const upserts: Record<string, unknown>[] = [];
    state.client = fakeClient({ upserts });
    await addOutbox();

    await expect(pushOutboxBatch()).resolves.toEqual({ pushed: 1, failed: 0 });
    expect(await db.outbox.count()).toBe(0);
    expect(upserts[0]).toMatchObject({ id: "p1", owner_id: "user-1" });
  });

  it("menandai dead-letter untuk error fatal", async () => {
    state.client = fakeClient({
      result: { error: { message: "duplicate key", code: "23505" } },
    });
    const seq = await addOutbox();

    await expect(pushOutboxBatch()).resolves.toEqual({ pushed: 0, failed: 1 });
    const row = await db.outbox.get(seq);
    expect(row?.status).toBe("dead");
    expect(row?.attempts).toBe(1);
    expect(row?.last_error).toContain("duplicate");
  });

  it("mempertahankan item pending untuk error sementara", async () => {
    state.client = fakeClient({
      result: { error: { message: "connection reset", code: "08006" } },
    });
    const seq = await addOutbox();

    await expect(pushOutboxBatch()).resolves.toEqual({ pushed: 0, failed: 1 });
    const row = await db.outbox.get(seq);
    expect(row?.status).toBe("pending");
    expect(row?.attempts).toBe(1);
    expect(row?.last_error).toContain("connection");
  });

  it("menangani exception jaringan sebagai error sementara", async () => {
    state.client = {
      auth: { getSession: async () => ({ data: { session: { user: { id: "u" } } } }) },
      from: () => ({
        upsert: async () => {
          throw new Error("offline");
        },
      }),
    };
    const seq = await addOutbox();

    await expect(pushOutboxBatch()).resolves.toEqual({ pushed: 0, failed: 1 });
    const row = await db.outbox.get(seq);
    expect(row?.status).toBe("pending");
    expect(row?.attempts).toBe(1);
    expect(row?.last_error).toBe("offline");
  });
});
