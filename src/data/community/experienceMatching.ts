export const EXPERIENCE_MATCHING_IDS = [
  "separation_divorce",
  "grief",
  "loneliness",
  "work_difficulties",
  "parenting",
  "relationship_problems",
  "job_change",
  "sleep_difficulties",
  "stress",
  "panic_attacks",
  "body_sensations",
  "low_self_esteem",
  "caregiving",
  "moving_city",
  "family_problems",
  "rumination"
] as const;

export type ExperienceMatchingId = typeof EXPERIENCE_MATCHING_IDS[number];
export type ExperienceMatchPreference = "same_now" | "been_there" | "either";

export function isExperienceMatchingId(value: unknown): value is ExperienceMatchingId {
  return typeof value === "string" && (EXPERIENCE_MATCHING_IDS as readonly string[]).includes(value);
}

export function experienceToTopic(id: ExperienceMatchingId): string {
  if (id === "loneliness") return "solidao";
  if (id === "work_difficulties" || id === "job_change") return "trabalho-estudos";
  if (id === "parenting" || id === "family_problems" || id === "caregiving") return "familia";
  if (id === "relationship_problems" || id === "separation_divorce") return "relacoes";
  if (id === "sleep_difficulties") return "sono";
  if (id === "low_self_esteem") return "autoestima";
  if (id === "stress") return "stress";
  return "ansiedade";
}
