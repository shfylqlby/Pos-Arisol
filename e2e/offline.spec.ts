import { expect, test } from "@playwright/test";
import { onboard } from "./helpers";

const routes = [
  { path: "/kasir", name: "Kasir" },
  { path: "/stok", name: "Stok" },
  { path: "/pesanan", name: "Pesanan" },
  { path: "/laporan", name: "Laporan" },
  { path: "/lainnya", name: "Lainnya" },
];

test("semua tab tetap terbuka setelah offline dan reload", async ({ page, context }) => {
  await onboard(page);

  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)), {
      timeout: 20_000,
    })
    .toBe(true);

  for (const route of routes) {
    await page.goto(route.path);
    await expect(page.getByRole("heading", { name: route.name }).first()).toBeVisible();
  }

  await context.setOffline(true);

  for (const route of routes) {
    await page.goto(route.path);
    await expect(page.getByRole("heading", { name: route.name }).first()).toBeVisible();
  }

  await context.setOffline(false);
});
