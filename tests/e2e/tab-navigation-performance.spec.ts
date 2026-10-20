import { test, expect } from "@playwright/test";

test("primary tabs remain responsive and do not keep the loading fallback visible", async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on("pageerror", error => runtimeErrors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("confia_language", "pt");
    const now = new Date();
    const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
    localStorage.setItem("confia_daily_checkin", JSON.stringify({ date, mood: 5, need: "focus", completed: true }));
  });
  await page.goto("/");

  const navigation = page.locator('footer[aria-label]');
  await expect(navigation).toBeVisible({ timeout: 15_000 });
  const tabs = navigation.getByRole("button");
  await expect(tabs).toHaveCount(4);

  // Exercise touch/mobile-like navigation as well as the desktop path. A brief
  // fallback is acceptable, but it must not remain on screen for several seconds.
  const loading = page.locator("main [role='status']").filter({ hasText: "A carregar" });
  for (const index of [1, 2, 3, 0, 3, 1, 2]) {
    const tab = tabs.nth(index);
    await tab.click();
    await expect(tab).toHaveAttribute("aria-current", "page");
    await page.waitForTimeout(120);
    await expect(loading).toHaveCount(0, { timeout: 2_500 });
  }

  expect(runtimeErrors).toEqual([]);
});
