import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getDailyCheckInHistory, saveDailyCheckIn } from "../../../storage/dailyCheckInStorage";
import { syncPersonalEventsFromLegacySources } from "../syncPersonalEvents";
import { clearPersonalEvents, readPersonalEvents, writePersonalEvents } from "../personalEventStorage";
import { makePersonalEvent, type CheckInEvent, type MoodEvent } from "../personalEvent";

const values = new Map<string, string>();
let failHistoryWrite = false;
const storage = {
  get length() { return values.size; },
  key: (index: number) => [...values.keys()][index] ?? null,
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => {
    if (failHistoryWrite && key === "confia_daily_checkin_history") throw new Error("QuotaExceededError");
    values.set(key, value);
  },
  removeItem: (key: string) => { values.delete(key); },
};
const browserWindow = Object.assign(new EventTarget(), { localStorage: storage });
Object.defineProperty(globalThis, "window", { configurable: true, value: browserWindow });
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });

function reset() {
  failHistoryWrite = false;
  values.clear();
  clearPersonalEvents();
  values.clear();
}

describe("daily entry integration", () => {
  it("projects ratings and check-ins into one stable personal timeline and notifies subscribers", () => {
    reset();
    const date = "2026-11-01";
    values.set("confia_ratings_v2", JSON.stringify([
      { date, morning: 4, afternoon: 8, note: "Dia preenchido", scaleVersion: 2 },
    ]));
    values.set("confia_daily_checkin_history", JSON.stringify([
      { date, mood: 6, need: "calm", completed: true, scaleVersion: 2 },
    ]));

    const oldMood = makePersonalEvent<MoodEvent>({
      id: "old-migration-mood", type: "mood", timestamp: "2026-11-01T12:00:00.000Z",
      localDate: date, source: "migration", value: 4,
      metadata: { moment: "morning", legacySource: "confia_ratings_v2" },
    });
    const oldCheckIn = makePersonalEvent<CheckInEvent>({
      id: "old-migration-checkin", type: "checkin", timestamp: "2026-11-01T12:00:00.000Z",
      localDate: date, source: "migration", value: 6,
      metadata: { need: "calm", legacySource: "confia_daily_checkin_history" },
    });
    writePersonalEvents([oldMood, oldCheckIn]);

    let notifications = 0;
    browserWindow.addEventListener("confia:personal-events-updated", () => { notifications += 1; });
    const first = syncPersonalEventsFromLegacySources();
    assert.equal(first.length, 3);
    assert.equal(first.filter(event => event.type === "mood").length, 2);
    assert.equal(first.filter(event => event.type === "checkin").length, 1);
    assert.equal(first.some(event => event.id === oldMood.id || event.id === oldCheckIn.id), false);
    assert.equal(first.find(event => event.type === "mood" && event.metadata?.moment === "morning")?.value, 4);
    assert.equal(first.find(event => event.type === "mood" && event.metadata?.moment === "morning")?.metadata?.note, "Dia preenchido");
    assert.ok(notifications > 0);

    const afterSecondSync = syncPersonalEventsFromLegacySources();
    assert.equal(afterSecondSync.length, 3, "repeated sync must not duplicate events");

    values.set("confia_ratings_v2", JSON.stringify([
      { date, morning: 9, afternoon: 8, note: "Corrigido", scaleVersion: 2 },
    ]));
    const afterEdit = syncPersonalEventsFromLegacySources();
    assert.equal(afterEdit.length, 3);
    assert.equal(afterEdit.find(event => event.type === "mood" && event.metadata?.moment === "morning")?.value, 9);
  });

  it("retains check-ins older than 30 days", () => {
    reset();
    const history = Array.from({ length: 40 }, (_, index) => ({
      date: new Date(2026, 8, index + 1, 12).toISOString().slice(0, 10),
      mood: 5, need: "calm", completed: true, scaleVersion: 2 as const,
    }));
    values.set("confia_daily_checkin_history", JSON.stringify(history));
    saveDailyCheckIn(7, "energy");
    assert.equal(getDailyCheckInHistory().length, 41);
    assert.equal(getDailyCheckInHistory()[0].date, history[0].date);
  });

  it("recovers the current check-in if writing the history key fails", () => {
    reset();
    failHistoryWrite = true;
    const saved = saveDailyCheckIn(7, "support");
    const recovered = getDailyCheckInHistory();
    assert.equal(recovered.length, 1);
    assert.equal(recovered[0].date, saved.date);
    assert.equal(recovered[0].mood, 7);
  });

  it("recovers the current check-in when the history JSON is malformed", () => {
    reset();
    values.set("confia_daily_checkin_history", "{broken-json");
    values.set("confia_daily_checkin", JSON.stringify({
      date: "2026-11-03", mood: 8, need: "calm", completed: true, scaleVersion: 2,
    }));
    const recovered = getDailyCheckInHistory();
    assert.equal(recovered.length, 1);
    assert.equal(recovered[0].mood, 8);
  });

  it("deduplicates repeated historical entries by local date", () => {
    reset();
    values.set("confia_daily_checkin_history", JSON.stringify([
      { date: "2026-11-02", mood: 4, need: "calm", completed: true, scaleVersion: 2 },
      { date: "2026-11-02", mood: 7, need: "support", completed: true, scaleVersion: 2 },
    ]));
    const recovered = getDailyCheckInHistory();
    assert.equal(recovered.length, 1);
    assert.equal(recovered[0].mood, 7);
  });
});
