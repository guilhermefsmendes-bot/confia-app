import { test, expect } from "@playwright/test";

test("reactive home: immediate support opens the real support flow", async ({ page }) => {
  await page.route(/(firestore|identitytoolkit|securetoken)\.googleapis\.com/, route => route.abort());

  await page.addInitScript(() => {
    localStorage.setItem("confia_language", "pt");
    const checkInNow = new Date();
    const checkInDate = [checkInNow.getFullYear(), String(checkInNow.getMonth() + 1).padStart(2, "0"), String(checkInNow.getDate()).padStart(2, "0")].join("-");
    localStorage.setItem("confia_daily_checkin", JSON.stringify({ date: checkInDate, mood: 5, need: "focus", completed: true }));
    const now = new Date();
    const yesterday = new Date(now.getTime() - 86400000);
    const episodes = [
      {
        createdAt: now.toISOString(),
        need: "calm",
        initialIntensity: 7,
        finalIntensity: 3,
        completed: true,
        xpEarned: 0,
      },
      {
        createdAt: yesterday.toISOString(),
        need: "calm",
        initialIntensity: 6,
        finalIntensity: 3,
        completed: true,
        xpEarned: 0,
      },
    ];
    localStorage.setItem("confia_impulso_history", JSON.stringify(episodes));
  });

  await page.goto("/");

  const action = page.getByRole("button", {
    name: /Escolher um apoio agora/,
  });
  await expect(action).toBeVisible();
  await action.click();

  await expect(
    page.getByRole("heading", { name: "Menu de Apoio Natural", exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await expect(page.getByTestId("challenge-clock")).toBeVisible();
});

test("reactive home: combines today's lifestyle records into one contextual observation", async ({ page }) => {
  await page.route(/(firestore|identitytoolkit|securetoken)\.googleapis\.com/, route => route.abort());

  await page.addInitScript(() => {
    localStorage.setItem("confia_language", "pt");
    const checkInNow = new Date();
    const checkInDate = [checkInNow.getFullYear(), String(checkInNow.getMonth() + 1).padStart(2, "0"), String(checkInNow.getDate()).padStart(2, "0")].join("-");
    localStorage.setItem("confia_daily_checkin", JSON.stringify({ date: checkInDate, mood: 5, need: "focus", completed: true }));
    const now = new Date();
    const day = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");
    const records = [
      {
        id: "nutrition-today",
        kind: "nutrition",
        date: day,
        updatedAt: now.toISOString(),
        timezone: "UTC",
        data: { water: 5, coffee: 1 },
      },
      {
        id: "exercise-today",
        kind: "exercise",
        date: day,
        updatedAt: now.toISOString(),
        timezone: "UTC",
        data: { activity: "walk", minutes: 30, intensity: "moderate", period: "morning" },
      },
    ];
    localStorage.setItem("confia_habits_v1:guest", JSON.stringify({ version: 1, records, pending: {} }));
  });

  await page.goto("/");

  await expect(
    page.getByText(
      "Hoje deixaste mais do que um tipo de pista sobre o teu dia. Isso ajuda a CONFIA a acompanhar o teu ritmo com mais contexto.",
      { exact: true },
    ),
  ).toBeVisible();
});
