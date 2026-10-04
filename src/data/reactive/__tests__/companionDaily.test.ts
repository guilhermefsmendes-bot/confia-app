import { habitDestination, screenName } from "../../../navigation";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { dailyCandidates } from "../companionBrain/dailyCandidates";
import {
  decideCompanionThought,
  selectVariant,
} from "../companionBrain/companionBrainDecisionEngine";
import {
  recordCompanionShownMessage,
  loadCompanionBrainMemory,
} from "../companionBrain/companionBrainMemory";
import { noticeTarget } from "../../../notifications/model";
import type { HabitRecord } from "../../habits/types";
import type { PersonalEvent } from "../../personal/personalEvent";
import type { CompanionBrainCandidate as Candidate } from "../companionBrain/companionBrainTypes";
const mem = new Map<string, string>();
Object.assign(globalThis, {
  window: {
    localStorage: {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => mem.set(k, v),
    },
  },
});
const now = new Date("2026-09-28T20:00:00");
const rec = (id: string, kind: string, date: string, data: object) =>
  ({
    id,
    kind,
    date,
    updatedAt: date + "T12:00:00Z",
    timezone: "UTC",
    data,
  }) as HabitRecord;
const c = (id = "test", priority = 70): Candidate => ({
  id,
  priority,
  translationKey: "test",
  category: "progress",
  emotion: "calm",
  reason: "test",
  cooldownMinutes: 1440,
});
test("empty data never invents habits, hydration or breathing patterns", () =>
  assert.deepEqual(dailyCandidates([], [], now), []));
test("companion can explain a real morning improvement with evidence", () => {
  const companionData: any = {
    mood: [
      { date: "2026-09-23", morning: 4, afternoon: 5 },
      { date: "2026-09-24", morning: 4, afternoon: 5 },
      { date: "2026-09-25", morning: 4, afternoon: 5 },
      { date: "2026-09-26", morning: 6, afternoon: 6 },
      { date: "2026-09-27", morning: 7, afternoon: 7 },
      { date: "2026-09-28", morning: 7, afternoon: 8 },
    ],
    objectives: [{ date: "2026-09-28", completed: 2, total: 5 }],
    habits: [],
    impulse: [],
    checkIns: [],
    patternProfile: null,
    xp: 0,
  };
  const options = dailyCandidates([], [], now, companionData);
  const trend = options.find((c) => c.metadata?.family === "morningTrend");
  assert.ok(trend);
  assert.equal(trend?.metadata?.mode, "insight");
  assert.equal(trend?.translationValues?.previous, 4);
  assert.equal(trend?.translationValues?.recent, 6.7);
});

test("companion can suggest an unfinished objective and a community thought", () => {
  const companionData: any = {
    mood: [{ date: "2026-09-28", morning: 6, afternoon: 6 }],
    objectives: [{ date: "2026-09-28", completed: 2, total: 5 }],
    habits: [],
    impulse: [],
    checkIns: [],
    patternProfile: null,
    xp: 0,
  };
  const options = dailyCandidates([], [], now, companionData);
  const objective = options.find(
    (c) => c.metadata?.family === "objectiveSuggestion",
  );
  const community = options.find(
    (c) => c.metadata?.family === "communitySuggestion",
  );
  assert.equal(objective?.metadata?.mode, "suggestion");
  assert.equal(objective?.translationValues?.completed, 2);
  assert.equal(community?.metadata?.mode, "suggestion");
});
test("restart preserves history and takes priority over routine signals", () => {
  mem.clear();
  const records = [
    rec("h", "habit", "2026-09-01", { type: "coffee", active: true }),
    rec("r", "restart", "2026-09-28", {
      habitId: "h",
      reason: "once",
      bestBefore: 7,
    }),
  ];
  const before = JSON.stringify(records);
  const options = dailyCandidates(records, [], now);
  assert.equal(options[0].metadata?.family, "restart");
  assert.equal(
    decideCompanionThought([...options, c("generic", 45)], now)?.candidate
      .metadata?.family,
    "restart",
  );
  assert.equal(JSON.stringify(records), before);
});
test("daily cap and global cooldown apply across categories and variants", () => {
  mem.clear();
  recordCompanionShownMessage({
    id: "one",
    category: "casual",
    reason: "test",
    shownAt: new Date(now.getTime() - 10 * 60_000).toISOString(),
  });
  assert.equal(decideCompanionThought([c()], now), null);
  mem.clear();
  for (let i = 0; i < 4; i++)
    recordCompanionShownMessage({
      id: "" + i,
      category: "casual",
      reason: "test",
      shownAt: new Date(now.getTime() - (i + 1) * 3600_000).toISOString(),
    });
  assert.equal(decideCompanionThought([c()], now), null);
  assert.ok(decideCompanionThought([c()], new Date("2026-09-29T20:00:00")));
});
test("rotating a family does not change its fact ID or bypass cooldown", () => {
  mem.clear();
  const base = { ...c(), metadata: { family: "restart" } };
  const first = selectVariant(base, []);
  const history = [
    {
      id: first.id,
      category: first.category,
      reason: first.reason,
      translationKey: first.translationKey,
      shownAt: now.toISOString(),
    },
  ];
  const next = selectVariant(base, history);
  assert.notEqual(first.translationKey, next.translationKey);
  assert.equal(first.id, next.id);
  recordCompanionShownMessage(history[0]);
  assert.equal(
    decideCompanionThought([next], new Date(now.getTime() + 3600_000)),
    null,
  );
});
test("functional memory is bounded and contains translation IDs, not translated text", () => {
  mem.clear();
  for (let i = 0; i < 150; i++)
    recordCompanionShownMessage({
      id: "" + i,
      category: "casual",
      reason: "test",
      shownAt: now.toISOString(),
    });
  assert.equal(loadCompanionBrainMemory().shownMessages.length, 120);
});
test("breathing observation needs multiple recent explicit reflections and rejects future data", () => {
  const event = (
    i: number,
    response: string,
    date = "2026-09-28",
  ): PersonalEvent =>
    ({
      id: "z" + i,
      type: "intervention",
      source: "app_context",
      schemaVersion: 1,
      timestamp: date + "T10:00:00Z",
      localDate: date,
      value: null,
      metadata: { exercise: "five_minutes", response },
    }) as PersonalEvent;
  assert.equal(dailyCandidates([], [event(1, "calmer")], now).length, 0);
  assert.ok(
    dailyCandidates(
      [],
      [event(1, "calmer"), event(2, "calmer"), event(3, "same")],
      now,
    ).some((c) => c.reason === "breathing"),
  );
  assert.equal(
    dailyCandidates([], [event(1, "agitated", "2026-09-30")], now).length,
    0,
  );
});
test("widget and old notification URLs still resolve home, log and setup", () => {
  for (const action of ["home", "log", "setup"])
    assert.deepEqual(
      noticeTarget("confia://habits" + (action === "home" ? "" : "/" + action)),
      { kind: "habit", action },
    );
});
test("four languages have identical new keys and placeholders", () => {
  function flat(value: any, p = ""): Record<string, string> {
    return Object.fromEntries(
      Object.entries(value).flatMap(([k, v]) =>
        typeof v === "string"
          ? [[p + k, v]]
          : Object.entries(flat(v, p + k + ".")),
      ),
    );
  }
  const all = ["pt", "en", "es", "fr"].map((l) =>
    flat(
      JSON.parse(
        fs.readFileSync(
          new URL("../../../locales/" + l + ".json", import.meta.url),
          "utf8",
        ),
      ).companionDaily,
    ),
  );
  for (const other of all.slice(1)) {
    assert.deepEqual(Object.keys(other), Object.keys(all[0]));
    for (const key of Object.keys(other))
      assert.deepEqual(
        other[key].match(/{{\w+}}/g),
        all[0][key].match(/{{\w+}}/g),
      );
  }
});

test("canonical and legacy paths resolve the same Home destination", () => {
  for (const action of ["home", "log", "setup"] as const) {
    assert.deepEqual(habitDestination(action), { tab: 0, page: action });
    assert.deepEqual(
      noticeTarget(
        "confia://home/habits" + (action === "home" ? "" : "/" + action),
      ),
      noticeTarget("confia://habits" + (action === "home" ? "" : "/" + action)),
    );
  }
  assert.deepEqual(noticeTarget("confia://embrace/sky"), { kind: "sky" });
  assert.equal(screenName(1, "innerCanvas"), "embrace_sky");
  assert.equal(screenName(4), "community");
});
test("scientific guidance reacts to recorded caffeine without treating two coffees as automatic excess", () => {
  const coffee = {
    category: "coffee",
    subtype: "espresso",
    quantity: 2,
    unit: "item",
    size: "medium",
    intensity: "medium",
    deleted: false,
  };
  const records = [rec("f1", "foodItem", "2026-09-28", coffee)];
  const options = dailyCandidates(records, [], now);
  assert.equal(
    options.some((c) => c.metadata?.family === "caffeineGuidance"),
    false,
  );
  assert.equal(
    options.some((c) => c.metadata?.family === "caffeineCountGuidance"),
    true,
  );
});
test("scientific guidance flags a high estimated caffeine intake and keeps it evidence based", () => {
  const coffee = {
    category: "coffee",
    subtype: "espresso",
    quantity: 3,
    unit: "item",
    size: "large",
    intensity: "strong",
    deleted: false,
  };
  const records = [rec("f1", "foodItem", "2026-09-28", coffee)];
  const candidate = dailyCandidates(records, [], now).find(
    (c) => c.metadata?.family === "caffeineGuidance",
  );
  assert.ok(candidate);
  assert.equal(candidate?.translationValues?.mg, 450);
  assert.equal(candidate?.metadata?.mode, "insight");
});
test("scientific guidance uses only explicitly logged exercise days", () => {
  const records = [
    rec("e1", "exercise", "2026-09-23", { activity: "walk", minutes: 30 }),
    rec("e2", "exercise", "2026-09-25", { activity: "walk", minutes: 30 }),
    rec("e3", "exercise", "2026-09-28", { activity: "walk", minutes: 30 }),
  ];
  const candidate = dailyCandidates(records, [], now).find(
    (c) => c.metadata?.family === "activityGuidance",
  );
  assert.ok(candidate);
  assert.equal(candidate?.translationValues?.minutes, 90);
});
