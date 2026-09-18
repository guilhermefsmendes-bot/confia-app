import type { MicroHabit } from './types';
import { getLocalCalendarDate } from '../../utils/date';

export const MICRO_HABITS: readonly MicroHabit[] = [
  { id: 'breath-30', kind: 'breath', durationSeconds: 30, labelKey: 'breath', descriptionKey: 'breathDescription' },
  { id: 'water-30', kind: 'water', durationSeconds: 30, labelKey: 'water', descriptionKey: 'waterDescription' },
  { id: 'grounding-30', kind: 'grounding', durationSeconds: 30, labelKey: 'grounding', descriptionKey: 'groundingDescription' },
  { id: 'movement-30', kind: 'movement', durationSeconds: 30, labelKey: 'movement', descriptionKey: 'movementDescription' },
  { id: 'rest-30', kind: 'rest', durationSeconds: 30, labelKey: 'rest', descriptionKey: 'restDescription' },
];

function dateSeed(date = new Date()): number {
  const value = getLocalCalendarDate(date);
  return Number(value.replaceAll('-', '')) || 0;
}

export function getMicroHabitForContext(date = new Date()): MicroHabit {
  const seed = dateSeed(date);
  return MICRO_HABITS[seed % MICRO_HABITS.length];
}
