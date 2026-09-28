import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getAdaptiveHugMessage } from "../hugAdaptiveMessages";

describe("adaptive hug messages", () => {
  it("supports all four languages and selected context", () => {
    const pt = getAdaptiveHugMessage("pt-PT", "busyMind", "clarity", "reflective", 2, 5);
    const en = getAdaptiveHugMessage("en", "busyMind", "clarity", "reflective", 2, 5);
    const es = getAdaptiveHugMessage("es", "busyMind", "clarity", "reflective", 2, 5);
    const fr = getAdaptiveHugMessage("fr", "busyMind", "clarity", "reflective", 2, 5);
    assert.equal(new Set([pt,en,es,fr]).size,4);
    for (const message of [pt,en,es,fr]) assert.ok(message.length>80);
  });
  it("changes messages across the session without network or randomness", () => {
    const messages = Array.from({length: 20}, (_, i) => getAdaptiveHugMessage("pt", "anxious", "calm", "warm", (Math.min(3, Math.floor(i/5))) as 0|1|2|3, i));
    assert.ok(new Set(messages).size>10);
  });
});
