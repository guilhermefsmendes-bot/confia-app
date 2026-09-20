import test from "node:test";
import assert from "node:assert/strict";

import {
  interpretCompanionInteractions,
  type CompanionInteractionEvent,
} from "../companionEventIntelligence";

function event(
  id: string,
  minute: number,
  kind: CompanionInteractionEvent["kind"],
  area: CompanionInteractionEvent["area"]
): CompanionInteractionEvent {
  return {
    id,
    kind,
    area,
    timestamp:
      new Date(
        2026,
        8,
        20,
        12,
        minute
      ).toISOString(),
  };
}

test(
  "ordinary navigation remains quiet",
  () => {
    const result =
      interpretCompanionInteractions([
        event(
          "1",
          1,
          "area_opened",
          "progress"
        ),
        event(
          "2",
          2,
          "area_returned",
          "home"
        ),
      ]);

    assert.equal(
      result.shouldConsiderSpeaking,
      false
    );

    assert.ok(
      result.signals.includes(
        "quiet_navigation"
      )
    );
  }
);

test(
  "repeated companion contact becomes meaningful",
  () => {
    const result =
      interpretCompanionInteractions([
        event(
          "1",
          1,
          "companion_contact",
          "companion"
        ),
        event(
          "2",
          2,
          "companion_contact",
          "companion"
        ),
        event(
          "3",
          3,
          "companion_contact",
          "companion"
        ),
      ]);

    assert.ok(
      result.signals.includes(
        "repeated_companion_contact"
      )
    );

    assert.equal(
      result.shouldConsiderSpeaking,
      true
    );
  }
);

test(
  "support followed by home return has high relevance",
  () => {
    const result =
      interpretCompanionInteractions([
        event(
          "1",
          1,
          "tool_started",
          "impulse"
        ),
        event(
          "2",
          4,
          "support_completed",
          "impulse"
        ),
        event(
          "3",
          5,
          "area_returned",
          "home"
        ),
      ]);

    assert.ok(
      result.signals.includes(
        "return_after_support"
      )
    );

    assert.equal(
      result.relevance,
      "high"
    );

    assert.equal(
      result.shouldConsiderSpeaking,
      true
    );
  }
);

test(
  "patterns followed by checkin is interpreted as reflection",
  () => {
    const result =
      interpretCompanionInteractions([
        event(
          "1",
          1,
          "reflection_opened",
          "patterns"
        ),
        event(
          "2",
          5,
          "checkin_completed",
          "checkin"
        ),
      ]);

    assert.ok(
      result.signals.includes(
        "reflection_sequence"
      )
    );

    assert.equal(
      result.relevance,
      "high"
    );
  }
);

test(
  "unfinished tool does not automatically demand speech",
  () => {
    const result =
      interpretCompanionInteractions([
        event(
          "1",
          1,
          "tool_started",
          "exercise"
        ),
        event(
          "2",
          2,
          "tool_abandoned",
          "exercise"
        ),
      ]);

    assert.ok(
      result.signals.includes(
        "unfinished_tool"
      )
    );

    assert.equal(
      result.shouldConsiderSpeaking,
      false
    );
  }
);
