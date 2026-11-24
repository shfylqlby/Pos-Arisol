import { describe, it, expect } from "vitest";
import { getBusinessDate, formatDateTime } from "./date";

describe("lib/date", () => {
  it("formats date to YYYY-MM-DD in Asia/Jakarta", () => {
    // 2026-11-24T20:00:00Z -> In Asia/Jakarta (UTC+7) is 2026-11-25 03:00
    const d = new Date("2026-11-24T20:00:00Z");
    expect(getBusinessDate(d, "Asia/Jakarta")).toBe("2026-11-25");
  });

  it("formats date time into human friendly string", () => {
    const d = "2026-11-24T10:30:00Z";
    const formatted = formatDateTime(d, "Asia/Jakarta");
    expect(formatted).toContain("24");
    expect(formatted).toContain("17.30"); // 10:30 UTC = 17:30 WIB
  });
});
