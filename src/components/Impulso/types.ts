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
  | "anxiety"
  | "sadness"
  | "frustration"
  | "confusion"

  /**
   * IDs mantidos para compatibilidade
   * com episódios/fluxos anteriores.
   */
  | "uncertainty"
  | "urgency"
  | "curiosity"
  | "guilt";

// Episódio completo
export type ImpulseNeed =
  | "calm"
  | "mind"
  | "control"
  | "support";

export interface ImpulseEpisode {
  createdAt: string;

  /**
   * Necessidade escolhida pelo utilizador
   * no início do Impulso.
   *
   * Opcional para manter compatibilidade
   * com episódios guardados antes da 1C.5.
   */
  need?: ImpulseNeed;

  initialIntensity: Intensity;

  finalIntensity?: Intensity;

  trigger?: Trigger;

  emotion?: Emotion;

  thought?: string;

  completed: boolean;

  xpEarned: number;
}
