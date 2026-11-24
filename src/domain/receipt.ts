import type { Sale, SaleItem, Settings } from "@/data/schemas";
import { formatRupiah } from "./money";
import { formatDateTime } from "@/lib/date";

export function formatWhatsAppReceipt(
  sale: Sale,
  items: SaleItem[],
  settings: Settings
): string {
  const line = "--------------------------------";
  const dateFormatted = formatDateTime(sale.created_at, settings.timezone);

  const itemLines = items
    .map((item) => {
      const totalItem = item.qty * item.unit_price;
      return `${item.product_name}\n  ${item.qty} x ${formatRupiah(item.unit_price)} = ${formatRupiah(totalItem)}`;
    })
    .join("\n");

  const discountText =
    sale.discount > 0 ? `\nDiskon: -${formatRupiah(sale.discount)}` : "";
  const depositText =
    sale.deposit_applied > 0
      ? `\nDP Sebelumnya: -${formatRupiah(sale.deposit_applied)}`
      : "";

  const paymentMethodLabel =
    sale.payment_method === "cash"
      ? "Tunai"
      : sale.payment_method === "qris"
      ? "QRIS"
      : "Transfer Bank";

  return `*${settings.business_name}*
${settings.address ? settings.address + "\n" : ""}${settings.phone ? settings.phone + "\n" : ""}${line}
No. Struk: *${sale.receipt_no}*
Waktu: ${dateFormatted}
${line}
${itemLines}
${line}
Subtotal: ${formatRupiah(sale.subtotal)}${discountText}${depositText}
*Total: ${formatRupiah(sale.total)}*
Bayar (${paymentMethodLabel}): ${formatRupiah(sale.paid_amount)}
Kembalian: *${formatRupiah(sale.change_amount)}*
${line}
${settings.receipt_footer}
`;
}
