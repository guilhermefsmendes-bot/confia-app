import type { Trigger } from "./types";

export interface TriggerOption {
  id: Trigger;
  label: string;
  icon: string;
}

export const triggerOptions: TriggerOption[] = [
  {
    id: "anxiety",
   label: "anxiety",
    icon: "🧠",
  },
  {
    id: "internet",
   label: "triggerInternet",
    icon: "🌐",
  },
  {
    id: "symptom",
   label: "triggerSymptom",
    icon: "❤️",
  },
  {
    id: "conversation",
   label: "triggerDiseaseTalk",
    icon: "💬",
  },
  {
    id: "message",
   label: "triggerMessage",
    icon: "📱",
  },
  {
    id: "other",
   label: "triggerOther",
    icon: "❓",
  },
];
