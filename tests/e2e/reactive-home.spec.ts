import { test, expect } from "@playwright/test";

test("reactive home: immediate support opens the real support flow", async ({ page }) => {
  await page.route(/(firestore|identitytoolkit|securetoken)\.googleapis\.com/, route => route.abort());

  await page.addInitScript(() => {
    localStorage.setItem("confia_language", "pt");
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
    name: "Abrir apoio imediato",
    exact: true,
  });
  await expect(action).toBeVisible();
  await action.click();

  await expect(
    page.getByRole("heading", { name: "Apoio imediato", exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: /Voltar/ }).click();
  await expect(page.getByTestId("challenge-clock")).toBeVisible();
});

test("reactive home: combines today's lifestyle records into one contextual observation", async ({ page }) => {
  await page.route(/(firestore|identitytoolkit|securetoken)\.googleapis\.com/, route => route.abort());

  await page.addInitScript(() => {
    localStorage.setItem("confia_language", "pt");
    const now = new Date();
    const day = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");
    const events = [
      {
        id: "nutrition-today",
        type: "nutrition",
        source: "nutrition",
        timestamp: now.toISOString(),
        localDate: day,
        schemaVersion: 1,
        metadata: { water: 5, coffee: 1 },
      },
      {
        id: "exercise-today",
        type: "exercise",
        source: "exercise",
        timestamp: now.toISOString(),
        localDate: day,
        schemaVersion: 1,
        value: 30,
        metadata: { activity: "walk", intensity: "moderate", period: "morning" },
      },
    ];
    localStorage.setItem("confia_personal_events_v1", JSON.stringify(events));
  });

  await page.goto("/");

  await expect(
    page.getByText(
      "Hoje deixaste mais do que um tipo de pista sobre o teu dia. Isso ajuda a CONFIA a acompanhar o teu ritmo com mais contexto.",
      { exact: true },
    ),
  ).toBeVisible();
});
