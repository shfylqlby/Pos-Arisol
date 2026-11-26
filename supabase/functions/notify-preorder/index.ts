// Supabase Edge Function: kirim email ke pemilik saat ada pre-order publik.
// Deploy: supabase functions deploy notify-preorder
// Secrets: supabase secrets set RESEND_API_KEY=... PREORDER_NOTIFY_EMAIL=...
// Opsional: PREORDER_FROM_EMAIL="Arisol <noreply@domainmu.com>"
// Opsional: ALLOWED_ORIGIN=https://domainmu.com (default "*"; set di produksi)

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Item = { name: string; qty: number; price: number };
type Payload = {
  name: string;
  phone: string;
  date: string;
  time?: string;
  method: "ambil" | "kirim";
  address?: string;
  note?: string;
  items: Item[];
  total: number;
};

const esc = (value: unknown) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!
  );
const rupiah = (n: number) => `Rp ${Math.round(n).toLocaleString("id-ID")}`;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const short = (v: unknown, max: number) => typeof v === "string" && v.length <= max;

function valid(p: Payload): boolean {
  return (
    typeof p?.name === "string" &&
    p.name.trim().length > 0 &&
    p.name.length <= 100 &&
    short(p.phone, 30) &&
    typeof p.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(p.date) &&
    (p.time === undefined || short(p.time, 10)) &&
    (p.method === "ambil" || p.method === "kirim") &&
    (p.address === undefined || short(p.address, 300)) &&
    (p.note === undefined || short(p.note, 500)) &&
    Array.isArray(p.items) &&
    p.items.length > 0 &&
    p.items.length <= 50 &&
    p.items.every(
      (i) =>
        short(i?.name, 100) && Number.isInteger(i.qty) && i.qty > 0 && i.qty <= 99
    )
  );
}

// ponytail: rate limit di memori per isolate (cukup meredam spam kasual). Naik ke
// tabel Postgres / Upstash kalau diserang serius.
const hits = new Map<string, number[]>();
function limited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  return false;
}

/** Harga resmi dari DB: klien tidak dipercaya; nama item harus menu aktif. */
async function loadMenu(): Promise<Map<string, number> | null> {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !key) return null;
  const res = await fetch(`${url}/rest/v1/public_menu_items?select=name,price&active=eq.true`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as { name: string; price: number }[];
  return new Map(rows.map((r) => [r.name, r.price]));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (limited(`ip:${ip}`, 5, 10 * 60_000) || limited("global", 60, 60 * 60_000)) {
    return json({ ok: false, error: "Terlalu banyak permintaan" }, 429);
  }

  const apiKey = Deno.env.get("RESEND_API_KEY");
  const to = Deno.env.get("PREORDER_NOTIFY_EMAIL");
  const from = Deno.env.get("PREORDER_FROM_EMAIL") ?? "Arisol <onboarding@resend.dev>";
  if (!apiKey || !to) return json({ ok: false, error: "Email belum dikonfigurasi" }, 503);

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, error: "JSON tidak valid" }, 400);
  }
  if (!valid(payload)) return json({ ok: false, error: "Data tidak valid" }, 400);

  const menu = await loadMenu();
  if (!menu) return json({ ok: false, error: "Menu tidak bisa diverifikasi" }, 502);
  const items: Item[] = [];
  for (const i of payload.items) {
    const price = menu.get(i.name);
    if (price === undefined) return json({ ok: false, error: `Menu tidak dikenal: ${i.name}` }, 400);
    items.push({ name: i.name, qty: i.qty, price });
  }

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const rows = items
    .map(
      (i) =>
        `<tr><td>${esc(i.name)}</td><td align="right">${i.qty}</td><td align="right">${rupiah(i.price * i.qty)}</td></tr>`
    )
    .join("");
  const html = `
    <h2>Pre-order baru di Arisol</h2>
    <p><b>${esc(payload.name)}</b><br>WhatsApp: ${esc(payload.phone)}</p>
    <p>${payload.method === "kirim" ? "Kirim" : "Ambil"}: ${esc(payload.date)}${
      payload.time ? ` jam ${esc(payload.time)}` : ""
    }${payload.method === "kirim" ? `<br>Alamat: ${esc(payload.address)}` : ""}</p>
    <table cellpadding="6" cellspacing="0" border="1" style="border-collapse:collapse">
      <tr><th align="left">Menu</th><th>Qty</th><th align="right">Subtotal</th></tr>
      ${rows}
      <tr><td colspan="2"><b>Total estimasi</b></td><td align="right"><b>${rupiah(total)}</b></td></tr>
    </table>
    ${payload.note ? `<p>Catatan: ${esc(payload.note)}</p>` : ""}
    <p>Hubungi pembeli lewat WhatsApp untuk konfirmasi.</p>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `Pre-order baru: ${payload.name} (${rupiah(total)})`,
      html,
    }),
  });
  if (!res.ok) return json({ ok: false, error: await res.text() }, 502);
  return json({ ok: true });
});
