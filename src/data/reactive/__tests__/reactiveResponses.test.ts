import assert from "node:assert/strict";
import test from "node:test";
import {
  getAllReactiveResponses,
  getResponsesForSituation,
} from "../reactiveResponses";

test("response index preserves every situation and priority order", () => {
  const allResponses = getAllReactiveResponses();
  const situations = new Set(allResponses.map((response) => response.situation));

  for (const situation of situations) {
    const expected = allResponses
      .filter((response) => response.situation === situation)
      .sort((a, b) => b.priority - a.priority)
      .map((response) => response.id);

    const indexed = getResponsesForSituation(situation).map(
      (response) => response.id,
    );

    assert.deepEqual(indexed, expected);
  }
});

test("response index returns an empty list for an unknown situation", () => {
  assert.deepEqual(
    getResponsesForSituation("__unknown_situation__" as never),
    [],
  );
});
