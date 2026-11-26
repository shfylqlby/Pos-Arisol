import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { onboard } from "./helpers";

const routes = [
  { path: "/kasir", name: "Kasir" },
  { path: "/stok", name: "Stok" },
  { path: "/pesanan", name: "Pesanan" },
  { path: "/laporan", name: "Laporan" },
  { path: "/lainnya", name: "Lainnya" },
];

test("tidak ada pelanggaran aksesibilitas serius di tab utama", async ({ page }) => {
  await onboard(page);

  for (const route of routes) {
    await page.goto(route.path);
    await expect(page.getByRole("heading", { name: route.name }).first()).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );

    expect(
      serious.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => n.target.join(" ")),
      })),
      `Pelanggaran a11y di ${route.path}`
    ).toEqual([]);
  }
});
