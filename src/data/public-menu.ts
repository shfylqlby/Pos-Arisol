import { getSupabaseClient } from "@/data/sync/supabase";

export type PublicMenuItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  image_url: string | null;
  sort_order: number;
  active: boolean;
  product_id: string | null;
  stock_qty: number | null;
};

const TABLE = "public_menu_items";
const VIEW = "public_menu_with_stock";
const COLUMNS = "id, name, category, price, image_url, sort_order, active, product_id, stock_qty";
const BUCKET = "menu";

function client() {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase belum dikonfigurasi");
  return supabase;
}

export async function fetchPublicMenu(): Promise<PublicMenuItem[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from(VIEW)
    .select(COLUMNS)
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as PublicMenuItem[];
}

export async function fetchAllPublicMenu(): Promise<PublicMenuItem[]> {
  const { data, error } = await client()
    .from(VIEW)
    .select(COLUMNS)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as PublicMenuItem[];
}

export type PublicMenuInput = {
  id?: string;
  name: string;
  category: string;
  price: number;
  image_url: string | null;
  sort_order: number;
  active: boolean;
  product_id: string | null;
};

export async function savePublicMenuItem(input: PublicMenuInput): Promise<void> {
  const payload = {
    name: input.name.trim(),
    category: input.category.trim(),
    price: Math.round(input.price),
    image_url: input.image_url,
    sort_order: input.sort_order,
    active: input.active,
    product_id: input.product_id,
    updated_at: new Date().toISOString(),
  };
  const supabase = client();
  const { error } = input.id
    ? await supabase.from(TABLE).update(payload).eq("id", input.id)
    : await supabase.from(TABLE).insert(payload);
  if (error) throw error;
}

export async function deletePublicMenuItem(id: string): Promise<void> {
  const { error } = await client().from(TABLE).delete().eq("id", id);
  if (error) throw error;
}

export async function uploadPublicMenuPhoto(file: File): Promise<string> {
  const supabase = client();
  if (!file.type.startsWith("image/")) throw new Error("File harus berupa gambar.");
  if (file.size > 2 * 1024 * 1024) throw new Error("Ukuran gambar maksimal 2 MB.");
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
