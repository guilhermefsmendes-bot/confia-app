import test from "node:test";
import assert from "node:assert/strict";
import { buildCompanionBrainContext } from "../companionBrain/companionBrainContext";

const longitudinalMood = {
  recordCount: 3,
  activeDays: 3,
  trend: "stable" as const,
  recoveryDays: 0,
  harderDays: 0,
  lowMorningCount: 0,
  repeatedLowMornings: false,
  repeatedRecoveries: false,
  lowMorningRelevance: "insufficient" as const,
  recoveryRelevance: "insufficient" as const,
  hasEnoughData: true,
};

test("companion context preserves personal discovery", () => {
  const context = buildCompanionBrainContext({
    currentTab: 0,
    homeScreen: "home",
    morningCompleted: true,
    afternoonCompleted: false,
    longitudinalMood,
    personalIntelligence: { generatedAt: "2026-09-22T00:00:00.000Z", timeScales: [], interventions: [], recoveries: [], testedLearning: [], safeguards: { personalBaseline: true, contradictionsRetained: true, nonCausalLanguage: true, insufficientDataAllowed: true } },
    personalDiscovery: {
      id: "insight-1",
      messageKey: "personalInsights.test",
      messageValues: { count: 3 },
      confidence: "moderate",
      evidenceCount: 3,
      actionability: "high",
    },
  });

  assert.equal(context.personalIntelligence?.safeguards.contradictionsRetained, true);

  assert.deepEqual(context.personalDiscovery, {
    id: "insight-1",
    messageKey: "personalInsights.test",
    messageValues: { count: 3 },
    confidence: "moderate",
    evidenceCount: 3,
    actionability: "high",
  });
});
