import {
  getCompanionBehaviorContext,
} from "./companionBehaviorContext";

import {
  resolveCompanionBehaviorResponse,
} from "./companionBehaviorResponse";

import {
  wasCompanionBehaviorShownRecently,
} from "./companionBehaviorMemory";

export type CompanionBehaviorPresentation = {
  signal: NonNullable<
    ReturnType<
      typeof resolveCompanionBehaviorResponse
    >
  >["signal"];

  translationKey: string;

  priority: number;

  cooldownMinutes: number;
};

function stableIndex(
  seed: string,
  length: number
): number {
  if (length <= 1) {
    return 0;
  }

  let hash = 0;

  for (
    let index = 0;
    index < seed.length;
    index += 1
  ) {
    hash =
      (hash * 31 +
        seed.charCodeAt(index)) |
      0;
  }

  return (
    Math.abs(hash) %
    length
  );
}

export function getCompanionBehaviorPresentation(
  now = new Date()
): CompanionBehaviorPresentation | null {
  const behavior =
    getCompanionBehaviorContext(now);

  if (!behavior.shouldConsiderSpeaking) {
    return null;
  }

  const response =
    resolveCompanionBehaviorResponse(
      behavior
    );

  if (!response) {
    return null;
  }

  if (
    wasCompanionBehaviorShownRecently(
      response.signal,
      response.cooldownMinutes,
      now
    )
  ) {
    return null;
  }

  const latest =
    behavior.latestMeaningfulEvent;

  const seed = [
    response.signal,
    latest?.id ?? "none",
    latest?.timestamp ?? "none",
  ].join(":");

  const index =
    stableIndex(
      seed,
      response.translationKeys.length
    );

  return {
    signal: response.signal,

    translationKey:
      response.translationKeys[index],

    priority:
      response.priority,

    cooldownMinutes:
      response.cooldownMinutes,
  };
}
