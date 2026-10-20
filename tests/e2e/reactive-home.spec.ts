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

test("reactive home: combines repeated lifestyle records with low mood without claiming causality", async ({ page }) => {
  await page.route(/(firestore|identitytoolkit|securetoken)\.googleapis\.com/, route => route.abort());
  await page.addInitScript(() => {
    localStorage.setItem("confia_language", "pt");
    const date = (offset: number) => {
      const d = new Date(); d.setDate(d.getDate() + offset);
      return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
    };
    const today = date(0);
    const days = [date(0), date(-1), date(-2)];
    localStorage.setItem("confia_daily_checkin", JSON.stringify({ date: today, mood: 4, need: "focus", completed: true }));
    localStorage.setItem("confia_ratings_v2", JSON.stringify(days.map(day => ({ date: day, morning: 4, afternoon: 4 }))));
    const base = (id: string, kind: string, day: string, data: object) => ({ id, kind, date: day, updatedAt: new Date(day + "T12:00:00.000Z").toISOString(), timezone: "UTC", data });
    const records = [
      base("sweet-today", "foodItem", days[0], { category: "sweets", subtype: "occasion", quantity: 1, unit: "occasion", deleted: false }),
      base("sweet-yesterday", "foodItem", days[1], { category: "sweets", subtype: "occasion", quantity: 1, unit: "occasion", deleted: false }),
      base("sleep-today", "sleep", days[0], { hours: 6, quality: 3 }),
      base("sleep-yesterday", "sleep", days[1], { hours: 6, quality: 3 }),
      base("exercise-today", "exercise", days[0], { activity: "walk", minutes: 30, intensity: "moderate", period: "morning" }),
    ];
    localStorage.setItem("confia_habits_v1:guest", JSON.stringify({ version: 1, records, pending: {} }));
  });
  await page.goto("/");
  const synergy = page.getByRole("button", { name: /O que estou a perceber/ });
  await expect(synergy).toBeVisible();
  await synergy.click();
  await expect(page.getByText(/sinais repetidos na alimentação e vários dias com menos de 7 horas de sono/)).toBeVisible();
  await expect(page.getByText("É uma hipótese baseada nos teus próprios registos. A CONFIA não assume que um hábito causa diretamente o teu bem-estar.", { exact: true })).toBeVisible();
});
