import type { Trigger } from "./types";

export interface TriggerOption {
  id: Trigger;
  label: string;
  icon: string;
}

export const triggerOptions: TriggerOption[] = [
  {
    id: "anxiety",
    label: "Ansiedade",
    icon: "🧠",
  },
  {
    id: "internet",
    label: "Vi algo na Internet",
    icon: "🌐",
  },
  {
    id: "symptom",
    label: "Senti um sintoma",
    icon: "❤️",
  },
  {
    id: "conversation",
    label: "Alguém falou de doenças",
    icon: "💬",
  },
  {
    id: "message",
    label: "Recebi uma mensagem",
    icon: "📱",
  },
  {
    id: "other",
    label: "Outro / Não sei",
    icon: "❓",
  },
];
