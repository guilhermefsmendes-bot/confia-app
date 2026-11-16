import assert from "node:assert/strict";
import test from "node:test";
import type { ReactiveResult } from "../reactiveTypes";
import {
  buildHomeReactiveObservation,
  getHomeNowAction,
} from "../homePresentation";

function makeResult(
  intent: ReactiveResult["intent"],
  activeDays = 0,
  domains: string[] = [],
): ReactiveResult {
  return {
    intent,
    situation: "no_data",
    response: {} as unknown as ReactiveResult["response"],
    metrics: { activeDays } as unknown as ReactiveResult["metrics"],
    reasoning: "",
    confidence: 0,
    personalSignals: {
      activeDays,
      facts: domains.map((domain) => ({
        domain,
        observedValue: 1,
      })),
    } as unknown as NonNullable<ReactiveResult["personalSignals"]>,
  };
}

test("home observation keeps the existing exercise mapping", () => {
  assert.deepEqual(
    buildHomeReactiveObservation(makeResult("welcome", 2, ["exercise"])),
    { key: "dailyMoment.observation.exercise.a" },
  );
});

test("home observation does not invent a card without evidence", () => {
  assert.equal(buildHomeReactiveObservation(makeResult("welcome", 2)), null);
});

test("home action maps regulation intents to the existing Impulso card", () => {
  assert.deepEqual(
    getHomeNowAction(makeResult("calm"), 0, "home"),
    {
      kind: "impulse",
      titleKey: "homeNow.impulse.title",
      textKey: "homeNow.impulse.text",
      actionKey: "homeNow.impulse.action",
    },
  );
});

test("home action stays hidden outside the home screen", () => {
  assert.equal(getHomeNowAction(makeResult("calm"), 1, "home"), null);
  assert.equal(getHomeNowAction(makeResult("calm"), 0, "progress"), null);
});
