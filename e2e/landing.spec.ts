import { expect, test } from "@playwright/test";

test("beranda Arisol tidak menampilkan tautan POS", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Risol mayo hangat/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /POS/ })).toHaveCount(0);
  await expect(page.locator('a[href="/POS"]')).toHaveCount(0);
});

test("halaman POS menampilkan info produk dan tautan masuk", async ({ page }) => {
  await page.goto("/POS");
  await expect(page.getByRole("heading", { name: /Jualan risol/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Masuk ke dashboard/i })).toHaveAttribute(
    "href",
    "/masuk"
  );
});

test("poster menu dibuka di lightbox dan bisa ditutup", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Lihat poster/ }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const box = await page.getByRole("button", { name: "Tutup foto" }).boundingBox();
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await expect(dialog).toHaveCount(0);

  await page.getByRole("button", { name: /Lihat poster/ }).first().click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);

  // Tombol Back HP menutup foto dan tetap di halaman yang sama.
  const trigger = page.getByRole("button", { name: /Lihat poster/ }).first();
  await trigger.click();
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("button", { name: "Tutup foto" })).toBeFocused();
  await page.goBack();
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
  await expect(trigger).toBeFocused();
});
