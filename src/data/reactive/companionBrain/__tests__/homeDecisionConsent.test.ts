import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getHomeCompanionBrainDecision } from "../homeDecision";

describe("Companion personal-context consent", () => {
  it("does not inspect or generate a contextual decision when consent is disabled", () => {
    const now = new Date();
    const selectedDate = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
    const result = getHomeCompanionBrainDecision({
      currentTab: 0, homeScreen: "home", selectedDate, todayLogged: false,
      morningRating: 0, afternoonRating: 0, ratings: [], allowPersonalContext: false,
    });
    assert.equal(result, null);
  });
});
