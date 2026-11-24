export async function shareText(text: string, title = "Struk"): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ text, title });
      return;
    } catch {
      // user cancelled or failed; fall through
    }
  }
  // Fallback: open WhatsApp
  const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(waUrl, "_blank");
}

export function printHtml(html: string): void {
  const w = window.open("", "_blank", "width=320,height=600");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => {
    w.print();
  }, 250);
}

export function receiptHtml(opts: {
  businessName: string;
  address?: string;
  phone?: string;
  receiptNo: string;
  dateText: string;
  items: { name: string; qty: number; unitPrice: string; lineTotal: string }[];
  subtotal: string;
  discount?: string;
  total: string;
  paid: string;
  change: string;
  paymentLabel: string;
  footer: string;
}): string {
  const itemRows = opts.items
    .map(
      (i) => `<tr><td colspan="2">${i.name}</td></tr>
      <tr><td>${i.qty} x ${i.unitPrice}</td><td style="text-align:right">${i.lineTotal}</td></tr>`
    )
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: 58mm auto; margin: 2mm; }
    body { font-family: ui-monospace, monospace; font-size: 11px; width: 54mm; color:#000; }
    h1 { font-size: 13px; text-align:center; margin: 0 0 2px; }
    .center { text-align:center; }
    hr { border: none; border-top: 1px dashed #000; margin: 4px 0; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 1px 0; vertical-align: top; }
    .bold { font-weight: 700; }
  </style></head><body>
    <h1>${opts.businessName}</h1>
    ${opts.address ? `<div class="center">${opts.address}</div>` : ""}
    ${opts.phone ? `<div class="center">${opts.phone}</div>` : ""}
    <hr/>
    <div>No: ${opts.receiptNo}</div>
    <div>${opts.dateText}</div>
    <hr/>
    <table>${itemRows}</table>
    <hr/>
    <table>
      <tr><td>Subtotal</td><td style="text-align:right">${opts.subtotal}</td></tr>
      ${opts.discount ? `<tr><td>Diskon</td><td style="text-align:right">-${opts.discount}</td></tr>` : ""}
      <tr class="bold"><td>Total</td><td style="text-align:right">${opts.total}</td></tr>
      <tr><td>Bayar (${opts.paymentLabel})</td><td style="text-align:right">${opts.paid}</td></tr>
      <tr class="bold"><td>Kembali</td><td style="text-align:right">${opts.change}</td></tr>
    </table>
    <hr/>
    <div class="center">${opts.footer}</div>
  </body></html>`;
}
