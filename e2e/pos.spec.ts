import { expect, test } from "@playwright/test";
import { newTransaction, onboard, openStock, recordProduction, sell } from "./helpers";

test("onboarding menyiapkan 3 menu default", async ({ page }) => {
  await onboard(page);

  await expect(page.getByRole("button", { name: /Risol Mayo/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Risol Ragout/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Risol Sayur/ })).toBeVisible();
  await expect(page.getByText("Risol Test").first()).toBeVisible();
});

test("jual tunai, struk tersimpan, stok berkurang", async ({ page }) => {
  await onboard(page);
  await recordProduction(page, 10);

  await page.context().setOffline(true);
  await sell(page, "Risol Mayo");
  await expect(page.getByText(/Struk A-0001/)).toBeVisible();
  await newTransaction(page);
  await page.context().setOffline(false);

  await openStock(page);
  const mayoRow = page.locator("li", { hasText: "Risol Mayo" }).first();
  await expect(mayoRow.getByText("9", { exact: true })).toBeVisible();
});

test("void mengembalikan stok", async ({ page }) => {
  await onboard(page);
  await recordProduction(page, 5);
  await sell(page, "Risol Mayo");
  await newTransaction(page);

  await page.getByRole("link", { name: "Laporan" }).click();
  await page.getByRole("button", { name: /A-0001/ }).click();
  await page.getByRole("button", { name: /Batalkan transaksi/ }).click();
  await page.getByRole("button", { name: "Ya, batalkan" }).click();
  await expect(page.getByText(/Transaksi dibatalkan/)).toBeVisible();

  await openStock(page);
  const mayoRow = page.locator("li", { hasText: "Risol Mayo" }).first();
  await expect(mayoRow.getByText("5", { exact: true })).toBeVisible();
});

test("tutup hari mencatat selisih waste", async ({ page }) => {
  await onboard(page);
  await recordProduction(page, 10);
  await openStock(page);

  await page.getByRole("button", { name: "Tutup hari" }).click();
  await expect(page.getByText(/Langkah 1\/2/)).toBeVisible();
  await page.locator('input[type="number"]').first().fill("8");
  await page.getByRole("button", { name: "Lanjut ke ringkasan" }).click();
  await expect(page.getByText("Ringkasan selisih")).toBeVisible();
  await page.getByRole("button", { name: "Konfirmasi tutup hari" }).click();
  await expect(page.getByText(/Hari ditutup/)).toBeVisible();

  await expect(
    page.locator("li", { hasText: "Risol Mayo" }).first().getByText("8", { exact: true })
  ).toBeVisible();
});

test("pre-order DP sampai selesai tercatat di laporan", async ({ page }) => {
  await onboard(page);

  await page.getByRole("link", { name: "Pesanan" }).click();
  await page.getByRole("button", { name: "Pesanan baru" }).click();
  await page.getByPlaceholder("Contoh: Bu Ani").fill("Bu Ani");
  await page.getByPlaceholder("0", { exact: true }).fill("2000");
  await page.getByRole("button", { name: "Tambah" }).first().click();
  await page.getByRole("button", { name: "Simpan pesanan" }).click();
  await expect(page.getByText("Pesanan tersimpan")).toBeVisible();

  await page.getByRole("button", { name: /Bu Ani/ }).click();
  await page.getByRole("button", { name: /Mulai produksi/ }).click();
  await expect(page.getByText("Status: Diproduksi")).toBeVisible();

  await page.getByRole("button", { name: /Bu Ani/ }).click();
  await page.getByRole("button", { name: /Tandai siap/ }).click();
  await expect(page.getByText("Status: Siap")).toBeVisible();

  await page.getByRole("button", { name: /Bu Ani/ }).click();
  await page.getByRole("button", { name: /Selesaikan & bayar/ }).click();
  await page.getByRole("button", { name: /Selesai & catat penjualan/ }).click();
  await expect(page.getByText("Pesanan selesai & tercatat")).toBeVisible();

  await page.getByRole("link", { name: "Laporan" }).click();
  await expect(page.getByText("Rp 3.000").first()).toBeVisible();
});

test("titip jual: kirim, setoran, lunas", async ({ page }) => {
  await onboard(page);

  await page.getByRole("link", { name: "Pesanan" }).click();
  await page.getByRole("tab", { name: "Titip jual" }).click();
  await page.getByRole("button", { name: "Mitra", exact: true }).click();
  await page.getByPlaceholder("Warung Bu Tini").fill("Warung Bu Tini");
  await page.getByRole("button", { name: "Simpan mitra" }).click();
  await expect(page.getByText("Mitra ditambahkan")).toBeVisible();

  await page.getByRole("button", { name: /Warung Bu Tini/ }).click();
  await page.getByRole("button", { name: "Tambah" }).first().click();
  await page.getByRole("button", { name: "Simpan pengiriman" }).click();
  await expect(page.getByText("Pengiriman dicatat")).toBeVisible();

  await page.getByRole("tab", { name: "Setoran" }).click();
  await page.getByRole("button", { name: "Buat setoran" }).click();
  await page.getByLabel("Terjual").first().fill("1");
  await page.getByRole("button", { name: "Simpan setoran" }).click();
  await expect(page.getByText("Setoran dicatat")).toBeVisible();

  await page.getByRole("button", { name: "Tandai lunas" }).click();
  await expect(page.getByText("Setoran ditandai lunas")).toBeVisible();
  await expect(page.getByText("Lunas", { exact: true })).toBeVisible();
});

test("riwayat stok terbuka dan submenu Lainnya bisa kembali", async ({ page }) => {
  await onboard(page);
  await recordProduction(page, 4);

  await page.getByRole("tab", { name: "Riwayat", exact: true }).click();
  await expect(page.getByText(/Produksi · /).first()).toBeVisible();
  await expect(page.getByText(/Application error/)).toHaveCount(0);

  await page.getByRole("link", { name: "Lainnya" }).click();
  await expect(page.getByText("Operasional", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: /Pengaturan/ }).click();
  await expect(page.getByRole("heading", { name: "Pengaturan" })).toBeVisible();
  await page.getByRole("link", { name: "Lainnya" }).first().click();
  await expect(page.getByText("Operasional", { exact: true })).toBeVisible();
});
