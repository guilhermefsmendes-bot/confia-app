export type MicroHabitKind = 'breath' | 'water' | 'grounding' | 'movement' | 'rest';
export interface MicroHabit { id:string; kind:MicroHabitKind; durationSeconds:number; labelKey:string; descriptionKey:string; }
