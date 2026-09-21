import test from "node:test";
import assert from "node:assert/strict";
import type { PersonalEvent } from "../personalEvent";
import { buildPersonalTwinSummary, buildReplayMoments } from "../confiaReplay";

const mood = (id: string, date: string, value: number): PersonalEvent => ({
  id,
  type: "mood",
  timestamp: date + "T12:00:00.000Z",
  localDate: date,
  source: "daily_rating",
  schemaVersion: 1,
  value,
});

test("replay finds a later recovery after an analogous low moment", () => {
  const events: PersonalEvent[] = [
    mood("a", "2026-09-01", 3),
    mood("b", "2026-09-03", 6),
    mood("c", "2026-09-10", 4),
    mood("d", "2026-09-12", 7),
    mood("e", "2026-09-20", 3),
  ];
  const replay = buildReplayMoments(events);
  assert.ok(replay.length > 0);
  const firstWithRecovery = replay.find(item => item.recovery);
  assert.ok(firstWithRecovery?.recovery);
  assert.ok((firstWithRecovery?.recovery?.mood ?? 0) >= firstWithRecovery!.mood + 2);
});

test("personal twin does not invent insights from sparse data", () => {
  const twin = buildPersonalTwinSummary([mood("a", "2026-09-20", 5)]);
  assert.equal(twin.insightCount, 0);
  assert.equal(twin.strongest.length, 0);
});
