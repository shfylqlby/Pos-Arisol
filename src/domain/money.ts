/**
 * Domain: Money & Currency calculations
 * Rules: Uang selalu integer rupiah (bilangan bulat tanpa desimal).
 */

export function formatRupiah(amount: number): string {
  const rounded = Math.round(amount || 0);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(rounded);
}

export function parseRupiah(text: string): number {
  if (!text) return 0;
  const digits = text.replace(/[^0-9]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

export function calculateTotal(subtotal: number, discount: number = 0): number {
  return Math.max(0, Math.round(subtotal) - Math.round(discount));
}

export function calculateChange(
  paidAmount: number,
  total: number,
  depositApplied: number = 0
): number {
  const remainingDue = Math.max(0, total - depositApplied);
  return Math.max(0, paidAmount - remainingDue);
}

export function getQuickCashOptions(totalDue: number): number[] {
  if (totalDue <= 0) return [5000, 10000, 20000, 50000];

  const standardDenominations = [5000, 10000, 20000, 50000, 100000];
  const higherDenominations = standardDenominations.filter((d) => d > totalDue);

  // Dynamic rounded up options (e.g. next 10k or next 50k)
  const next5k = Math.ceil(totalDue / 5000) * 5000;
  const next10k = Math.ceil(totalDue / 10000) * 10000;
  const next50k = Math.ceil(totalDue / 50000) * 50000;
  const next100k = Math.ceil(totalDue / 100000) * 100000;

  const set = new Set<number>();
  if (next5k > totalDue) set.add(next5k);
  if (next10k > totalDue) set.add(next10k);
  if (next50k > totalDue) set.add(next50k);
  if (next100k > totalDue) set.add(next100k);
  for (const d of higherDenominations) {
    set.add(d);
  }

  const sorted = Array.from(set).sort((a, b) => a - b);
  return sorted.slice(0, 4);
}
