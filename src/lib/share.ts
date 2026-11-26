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

export interface ReceiptPrintOptions {
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
}

export function receiptHtml(opts: ReceiptPrintOptions): string {
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

type DrawOp =
  | {
      kind: "text";
      text: string;
      x: number;
      y: number;
      align: "left" | "center" | "right";
      bold?: boolean;
      size?: number;
    }
  | { kind: "dash"; y: number };

export function receiptCanvas(opts: ReceiptPrintOptions): HTMLCanvasElement {
  const width = 384;
  const pad = 18;
  const lineH = 26;
  const fontFor = (size: number, bold: boolean) =>
    `${bold ? "700 " : ""}${size}px ui-monospace, SFMono-Regular, Menlo, monospace`;

  const measure = document.createElement("canvas").getContext("2d")!;
  const wrap = (text: string, maxWidth: number, size: number, bold = false): string[] => {
    measure.font = fontFor(size, bold);
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (measure.measureText(next).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = next;
      }
    }
    if (current) lines.push(current);
    return lines.length > 0 ? lines : [""];
  };

  const ops: DrawOp[] = [];
  let y = pad + 20;

  const pushCenter = (text: string, size = 20, bold = false) => {
    for (const line of wrap(text, width - pad * 2, size, bold)) {
      ops.push({
        kind: "text",
        text: line,
        x: width / 2,
        y,
        align: "center",
        size,
        bold,
      });
      y += lineH;
    }
  };
  const pushLeft = (text: string, size = 18, bold = false) => {
    ops.push({ kind: "text", text, x: pad, y, align: "left", size, bold });
    y += lineH;
  };
  const pushRow = (left: string, right: string, bold = false, size = 18) => {
    ops.push({ kind: "text", text: left, x: pad, y, align: "left", size, bold });
    ops.push({
      kind: "text",
      text: right,
      x: width - pad,
      y,
      align: "right",
      size,
      bold,
    });
    y += lineH;
  };
  const dash = () => {
    ops.push({ kind: "dash", y });
    y += 14;
  };

  pushCenter(opts.businessName, 24, true);
  if (opts.address) pushCenter(opts.address, 17);
  if (opts.phone) pushCenter(opts.phone, 17);
  dash();
  pushLeft(`No: ${opts.receiptNo}`, 17);
  pushLeft(opts.dateText, 17);
  dash();
  for (const item of opts.items) {
    pushLeft(item.name, 18);
    pushRow(`${item.qty} x ${item.unitPrice}`, item.lineTotal, false, 17);
  }
  dash();
  pushRow("Subtotal", opts.subtotal);
  if (opts.discount) pushRow("Diskon", `-${opts.discount}`);
  pushRow("Total", opts.total, true);
  pushRow(`Bayar (${opts.paymentLabel})`, opts.paid);
  pushRow("Kembali", opts.change, true);
  dash();
  pushCenter(opts.footer, 17);

  const height = y + pad;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#FFFBF5";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#1C1917";
  ctx.textBaseline = "alphabetic";

  for (const op of ops) {
    if (op.kind === "dash") {
      ctx.save();
      ctx.strokeStyle = "#78716C";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(pad, op.y - 8);
      ctx.lineTo(width - pad, op.y - 8);
      ctx.stroke();
      ctx.restore();
      continue;
    }
    ctx.font = fontFor(op.size ?? 18, op.bold ?? false);
    ctx.textAlign = op.align;
    ctx.fillText(op.text, op.x, op.y);
  }

  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Gagal membuat gambar"));
    }, "image/png");
  });
}

export async function shareReceiptPng(
  opts: ReceiptPrintOptions,
  filename = "struk.png"
): Promise<void> {
  const canvas = receiptCanvas(opts);
  const blob = await canvasToBlob(canvas);

  if (typeof navigator !== "undefined" && navigator.canShare) {
    const file = new File([blob], filename, { type: "image/png" });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "Struk" });
        return;
      } catch {
        // fall through to download
      }
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
