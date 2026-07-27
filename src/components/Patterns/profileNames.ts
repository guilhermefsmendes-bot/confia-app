import { PatternCategory } from "./types";

export interface ProfileInfo {
  emoji: string;
  nameKey: string;
  descriptionKey: string;
  strengthKey: string;
  challengeKey: string;
}

export const PROFILE_INFO: Record<PatternCategory, ProfileInfo> = {
  reassurance: {
    emoji: "⚖️",
    nameKey: "patterns.profile.reassurance.name",
    descriptionKey: "patterns.profile.reassurance.description",
    strengthKey: "patterns.profile.reassurance.strength",
    challengeKey: "patterns.profile.reassurance.challenge",
  },

  search: {
    emoji: "🔍",
    nameKey: "patterns.profile.search.name",
    descriptionKey: "patterns.profile.search.description",
    strengthKey: "patterns.profile.search.strength",
    challengeKey: "patterns.profile.search.challenge",
  },

  body: {
    emoji: "🩺",
    nameKey: "patterns.profile.body.name",
    descriptionKey: "patterns.profile.body.description",
    strengthKey: "patterns.profile.body.strength",
    challengeKey: "patterns.profile.body.challenge",
  },

  perfectionism: {
    emoji: "🎯",
    nameKey: "patterns.profile.perfectionism.name",
    descriptionKey: "patterns.profile.perfectionism.description",
    strengthKey: "patterns.profile.perfectionism.strength",
    challengeKey: "patterns.profile.perfectionism.challenge",
  },

  avoidance: {
    emoji: "🚪",
    nameKey: "patterns.profile.avoidance.name",
    descriptionKey: "patterns.profile.avoidance.description",
    strengthKey: "patterns.profile.avoidance.strength",
    challengeKey: "patterns.profile.avoidance.challenge",
  },

  rumination: {
    emoji: "💭",
    nameKey: "patterns.profile.rumination.name",
    descriptionKey: "patterns.profile.rumination.description",
    strengthKey: "patterns.profile.rumination.strength",
    challengeKey: "patterns.profile.rumination.challenge",
  },

  control: {
    emoji: "🛡️",
    nameKey: "patterns.profile.control.name",
    descriptionKey: "patterns.profile.control.description",
    strengthKey: "patterns.profile.control.strength",
    challengeKey: "patterns.profile.control.challenge",
  },

  comparison: {
    emoji: "🌍",
    nameKey: "patterns.profile.comparison.name",
    descriptionKey: "patterns.profile.comparison.description",
    strengthKey: "patterns.profile.comparison.strength",
    challengeKey: "patterns.profile.comparison.challenge",
  }
};
