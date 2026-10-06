import test from "node:test";
import assert from "node:assert/strict";
import { buildLifestyleSynergyCandidate } from "../companionBrain/lifestyleSynergy";
import type { CompanionCollectedData } from "../../companionData";
import type { HabitRecord } from "../../habits/types";

const companionData = (mood: CompanionCollectedData["mood"]): CompanionCollectedData => ({
  mood, objectives: [], habits: [], impulse: [], checkIns: [], patternProfile: {} as never, xp: 0,
});
const food = (date:string, category:"coffee"|"sweets") => ({ id:`${date}-${category}`, date, updatedAt:`${date}T12:00:00.000Z`, timezone:"Europe/Lisbon", kind:"foodItem", data:{ category, quantity: category==="coffee"?3:1, unit:"portion" } } as HabitRecord);
const sleep = (date:string) => ({ id:`${date}-sleep`, date, updatedAt:`${date}T12:00:00.000Z`, timezone:"Europe/Lisbon", kind:"sleep", data:{ hours:6, quality:3 } } as HabitRecord);

test("lifestyle synergy connects wellbeing with repeated lifestyle signals without claiming causality", () => {
  const days=["2026-10-01","2026-10-02","2026-10-03","2026-10-04","2026-10-05"];
  const records:HabitRecord[] = days.flatMap(day=>[food(day,"coffee"),food(day,"sweets"),sleep(day)]);
  const mood=days.map(date=>({date,morning:5,afternoon:5}));
  const candidate=buildLifestyleSynergyCandidate(records,companionData(mood),new Date("2026-10-05T18:00:00"));
  assert.equal(candidate?.metadata?.family,"lifestyleSynergy");
  assert.equal(candidate?.metadata?.group,"food_sleep_movement");
  assert.equal(candidate?.confidence,"strong");
  assert.match(String(candidate?.translationKey),/food_sleep_movement/);
});

test("sparse wellbeing history stays silent", () => {
  const records:HabitRecord[]=[food("2026-10-05","coffee")];
  const mood=[{date:"2026-10-05",morning:4,afternoon:5}];
  assert.equal(buildLifestyleSynergyCandidate(records,companionData(mood),new Date("2026-10-05T18:00:00")),undefined);
});
