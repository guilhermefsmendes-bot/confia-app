import { test, expect } from "@playwright/test";

test("loads the Confia shell without a runtime error", async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on("pageerror", error => runtimeErrors.push(error.message));
  await page.goto("/");
  await expect(page.getByText("Confia", { exact: true }).first()).toBeVisible({ timeout: 15_000 });
  expect(runtimeErrors).toEqual([]);
});

test("renders the primary navigation on mobile and desktop", async ({ page }) => {
  await page.goto("/");
  const navigation = page.locator("footer[aria-label]");
  await expect(navigation).toBeVisible({ timeout: 15_000 });
  await expect(navigation.getByRole("button")).toHaveCount(5);
});
