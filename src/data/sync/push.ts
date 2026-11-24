import { db } from "../db";
import { getSupabaseClient } from "./supabase";

export async function pushOutboxBatch(batchSize = 50): Promise<{
  pushed: number;
  failed: number;
}> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { pushed: 0, failed: 0 };
  }

  // Check auth session
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session?.user) {
    // Not logged in; local mode
    return { pushed: 0, failed: 0 };
  }

  const userId = sessionData.session.user.id;
  const items = await db.outbox
    .where("status")
    .equals("pending")
    .limit(batchSize)
    .toArray();

  if (items.length === 0) return { pushed: 0, failed: 0 };

  let pushed = 0;
  let failed = 0;

  for (const item of items) {
    if (item.seq === undefined) continue;

    try {
      // Ensure owner_id is set
      const payload = {
        ...item.payload,
        owner_id: userId,
      };

      const { error } = await supabase
        .from(item.table)
        .upsert(payload, { onConflict: "id" });

      if (error) {
        console.error(`Sync error on ${item.table}:${item.row_id}`, error);
        failed++;

        const isFatal =
          error.code?.startsWith("22") || // data exception
          error.code?.startsWith("23") || // integrity constraint violation
          error.code === "PGRST100"; // parse error

        await db.outbox.update(item.seq, {
          attempts: item.attempts + 1,
          status: isFatal ? "dead" : "pending",
          last_error: error.message,
        });
      } else {
        await db.outbox.delete(item.seq);
        pushed++;
      }
    } catch (err: unknown) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      await db.outbox.update(item.seq, {
        attempts: item.attempts + 1,
        last_error: msg,
      });
    }
  }

  return { pushed, failed };
}
