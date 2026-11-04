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
  await expect(navigation.getByRole("button")).toHaveCount(4);
});


test.describe("first-run eligibility and morning check-in", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("requires an explicit 18+ confirmation and completes the daily check-in", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("confia_language", "pt"));
    test.setTimeout(60000);
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Bem-vindo/a à Confia", exact: true })).toBeVisible();
    const continueButton = page.getByRole("button", { name: "Continuar", exact: true });
    await expect(continueButton).toBeDisabled();
    await page.getByRole("checkbox", { name: "Confirmo que tenho 18 anos ou mais." }).check();
    await expect(continueButton).toBeEnabled();
    await continueButton.click();

    await expect(page.getByRole("heading", { name: "Como te sentes neste momento?", exact: true })).toBeVisible({ timeout: 15000 });
    await page.getByRole("button", { name: "7", exact: true }).click();
    await page.getByRole("button", { name: /Acalmar/ }).click();
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await expect(page.getByText("+20 XP", { exact: true })).toBeVisible();
    // The reflection remains visible until the user chooses to continue.
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Por onde queres começar hoje?", exact: true })).toBeVisible({ timeout: 10000 });

    const saved = await page.evaluate(() => ({
      age: localStorage.getItem("confia_age_18_confirmed_v1"),
      current: JSON.parse(localStorage.getItem("confia_daily_checkin") || "null"),
      history: JSON.parse(localStorage.getItem("confia_daily_checkin_history") || "[]"),
    }));
    expect(saved.age).toBe("yes");
    expect(saved.current).toMatchObject({ mood: 7, need: "calm", completed: true, scaleVersion: 2 });
    expect(saved.history).toEqual(expect.arrayContaining([expect.objectContaining({ mood: 7, need: "calm", completed: true })]));
  });
});


test("accessibility smoke audit: names, labels, images and mobile overflow", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('footer[aria-label]')).toBeVisible({ timeout: 15000 });
  const audit = await page.evaluate(() => {
    const visible = (element: Element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };
    const named = (element: Element) => Boolean(
      element.getAttribute("aria-label")?.trim() ||
      element.getAttribute("aria-labelledby")?.trim() ||
      element.getAttribute("title")?.trim() ||
      element.textContent?.trim()
    );
    return {
      unnamedButtons: Array.from(document.querySelectorAll("button")).filter(el => visible(el) && !named(el)).map(el => el.outerHTML.slice(0, 180)),
      unlabeledFields: Array.from(document.querySelectorAll("input:not([type=hidden]), select, textarea")).filter(el => visible(el) && !named(el) && !(el as HTMLInputElement).labels?.length).map(el => el.outerHTML.slice(0, 180)),
      imagesWithoutAlt: Array.from(document.querySelectorAll("img")).filter(el => visible(el) && !el.hasAttribute("alt")).map(el => el.outerHTML.slice(0, 180)),
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  });
  expect(audit.unnamedButtons, "visible buttons need an accessible name").toEqual([]);
  expect(audit.unlabeledFields, "visible form fields need an accessible label").toEqual([]);
  expect(audit.imagesWithoutAlt, "informative images need alt text").toEqual([]);
  expect(audit.horizontalOverflow, "the page must not overflow horizontally").toBe(false);
});


test("preloads first-use chunks and opens every primary tab on first entry", async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on("pageerror", error => runtimeErrors.push(error.message));
  await page.route(/(firestore|identitytoolkit|securetoken)\.googleapis\.com/, route => route.abort());
  await page.goto("/");

  const navigation = page.locator("footer.confia-nav");
  await expect(navigation).toBeVisible({ timeout: 15_000 });

  // The first-use content for every main tab must be downloaded in the idle
  // warm-up, rather than waiting for the first click to request its chunk.
  await page.waitForFunction(() => {
    const resources = performance.getEntriesByType("resource").map(entry => entry.name);
    return ["AppTabs-", "AbracoTimer-", "ObjectivosList-", "WeeklyGoalSection-", "PartilhaFeed-"]
      .every(chunk => resources.some(resource => resource.includes(chunk)));
  }, null, { timeout: 15_000 });

  const tabs = navigation.getByRole("button");
  const main = page.locator("main.confia-main");
  for (const index of [1, 2, 3]) {
    await tabs.nth(index).click();
    await expect(tabs.nth(index)).toHaveAttribute("aria-current", "page");
    await expect(main.locator(".confia-motion-enter:visible").first()).toBeVisible({ timeout: 15_000 });

    // Returning and reopening a tab must preserve immediate availability.
    await tabs.nth(0).click();
    await expect(tabs.nth(0)).toHaveAttribute("aria-current", "page");
    await tabs.nth(index).click();
    await expect(tabs.nth(index)).toHaveAttribute("aria-current", "page");
    await expect(main.locator(".confia-motion-enter:visible").first()).toBeVisible({ timeout: 15_000 });
  }

  expect(runtimeErrors).toEqual([]);
});
