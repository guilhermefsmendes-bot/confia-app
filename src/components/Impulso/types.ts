// Intensidade do impulso
export type Intensity = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

// Passos do fluxo SOS
export type SosStep =
  | "welcome"
  | "intensity"
  | "regulation"
  | "trigger"
  | "emotion"
  | "thought"
  | "intervention"
  | "timer"
  | "result";

// Gatilhos principais
export type Trigger =
  | "internet"
  | "symptom"
  | "conversation"
  | "message"
  | "anxiety"
  | "other";

// Emoções principais
export type Emotion =
  | "fear"
  | "uncertainty"
  | "urgency"
  | "curiosity"
  | "guilt";

// Episódio completo
export interface ImpulseEpisode {
  createdAt: string;

  initialIntensity: Intensity;

  finalIntensity?: Intensity;

  trigger?: Trigger;

  emotion?: Emotion;

  thought?: string;

  completed: boolean;

  xpEarned: number;
}
