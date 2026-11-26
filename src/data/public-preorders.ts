import { getSupabaseClient } from "@/data/sync/supabase";

export type PublicPreorderPayload = {
  name: string;
  phone: string;
  date: string;
  time?: string;
  method: "ambil" | "kirim";
  address?: string;
  note?: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
};

/** Kirim notifikasi email ke pemilik lewat Edge Function. Gagal = tidak fatal. */
export async function notifyPublicPreorder(payload: PublicPreorderPayload): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const { error } = await supabase.functions.invoke("notify-preorder", { body: payload });
  return !error;
}
