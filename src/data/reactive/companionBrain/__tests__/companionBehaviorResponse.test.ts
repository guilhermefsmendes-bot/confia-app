import test from "node:test";
import assert from "node:assert/strict";

import {
  resolveCompanionBehaviorResponse,
} from "../companionBehaviorResponse";

import type {
  CompanionBehaviorInterpretation,
} from "../companionEventIntelligence";

function behavior(
  signals:
    CompanionBehaviorInterpretation["signals"]
): CompanionBehaviorInterpretation {
  return {
    signals,
    eventCount: signals.length,
    uniqueAreas: 1,
    shouldConsiderSpeaking:
      signals.length > 0,
    relevance:
      signals.includes(
        "return_after_support"
      )
        ? "high"
        : "medium",
  };
}

test(
  "ordinary exploration stays silent",
  () => {
    const response =
      resolveCompanionBehaviorResponse(
        behavior([
          "active_exploration"
        ])
      );

    assert.equal(
      response,
      null
    );
  }
);

test(
  "unfinished tool stays silent",
  () => {
    const response =
      resolveCompanionBehaviorResponse(
        behavior([
          "unfinished_tool"
        ])
      );

    assert.equal(
      response,
      null
    );
  }
);

test(
  "return after support can speak",
  () => {
    const response =
      resolveCompanionBehaviorResponse(
        behavior([
          "return_after_support"
        ])
      );

    assert.ok(response);

    assert.equal(
      response?.signal,
      "return_after_support"
    );

    assert.ok(
      (response?.priority ?? 0) >= 70
    );
  }
);

test(
  "repeated companion contact can speak",
  () => {
    const response =
      resolveCompanionBehaviorResponse(
        behavior([
          "repeated_companion_contact"
        ])
      );

    assert.ok(response);

    assert.equal(
      response?.signal,
      "repeated_companion_contact"
    );
  }
);
