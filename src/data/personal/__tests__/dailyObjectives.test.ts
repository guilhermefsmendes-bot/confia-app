import test from "node:test";
import assert from "node:assert/strict";
import { getDailyObjectives } from "../../initialData";

const date = new Date(2026, 10, 3);

test("daily objectives stay stable for the same day and declared need", () => {
  const first = getDailyObjectives(date, "calm");
  const second = getDailyObjectives(date, "calm");
  assert.equal(first.length, 5);
  assert.deepEqual(first.map(item => item.id), second.map(item => item.id));
  assert.equal(new Set(first.map(item => item.id)).size, 5);
});

test("daily objectives reflect the need without turning every task into the same category", () => {
  const cases = [
    { need: "calm", preferred: ["mental", "corporeo"] },
    { need: "mind", preferred: ["mental", "acao"] },
    { need: "energy", preferred: ["corporeo", "nutricao"] },
    { need: "support", preferred: ["social", "acao"] },
  ];

  for (const item of cases) {
    const objectives = getDailyObjectives(date, item.need);
    const relevant = objectives.filter(objective => item.preferred.includes(objective.category));
    assert.equal(objectives.length, 5, item.need);
    assert.ok(relevant.length >= 3, item.need);
    assert.equal(new Set(objectives.map(objective => objective.id)).size, 5, item.need);
  }
});

test("a broad wellbeing need receives a balanced set of categories", () => {
  const objectives = getDailyObjectives(date, "well");
  assert.equal(objectives.length, 5);
  assert.deepEqual(
    new Set(objectives.map(objective => objective.category)),
    new Set(["mental", "corporeo", "nutricao", "social", "acao"]),
  );
});

test("unknown needs preserve the neutral daily objective selection", () => {
  assert.deepEqual(
    getDailyObjectives(date, "unknown").map(item => item.id),
    getDailyObjectives(date).map(item => item.id),
  );
});
