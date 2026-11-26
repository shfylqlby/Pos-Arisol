import { expect, type Page } from "@playwright/test";

export async function onboard(page: Page, businessName = "Risol Test") {
  await page.goto("/kasir");
  await expect(page.getByRole("heading", { name: "Selamat datang!" })).toBeVisible();
  await page.getByPlaceholder("Contoh: Risol Bu Sari").fill(businessName);
  await page.getByRole("button", { name: "Lanjut" }).click();
  await expect(
    page.getByRole("heading", { name: "3 menu awal disiapkan" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Lanjut" }).click();
  await page.getByRole("button", { name: "Mulai jualan" }).click();
  await expect(page.getByRole("button", { name: /Risol Mayo/ })).toBeVisible();
}

export async function recordProduction(page: Page, qty: number) {
  await page.getByRole("link", { name: "Stok" }).click();
  await page.getByRole("tab", { name: "Tambah stok", exact: true }).click();
  await page.locator("select").first().selectOption({ label: "Risol Mayo" });
  await page.getByPlaceholder("Jumlah").fill(String(qty));
  await page.getByRole("button", { name: "Simpan stok" }).click();
  await expect(page.getByText(`Produksi Risol Mayo +${qty}`)).toBeVisible();
}

export async function sell(page: Page, productName: string) {
  await page.getByRole("link", { name: "Kasir" }).click();
  await page.getByRole("button", { name: new RegExp(productName) }).click();
  await page.getByRole("button", { name: "BAYAR", exact: true }).click();
  await expect(page.getByText("Total", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "UANG PAS" }).click();
  await page.getByRole("button", { name: /SELESAI/ }).click();
  await expect(page.getByRole("heading", { name: "Transaksi tersimpan" })).toBeVisible();
}

export async function newTransaction(page: Page) {
  await page.getByRole("button", { name: "TRANSAKSI BARU" }).click();
}

export async function openStock(page: Page) {
  await page.getByRole("link", { name: "Stok" }).click();
  await expect(page.getByRole("heading", { name: "Stok", exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Hari ini", exact: true }).click();
}
