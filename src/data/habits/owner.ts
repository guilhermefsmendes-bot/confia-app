/**
 * Lightweight owner identity shared by habit storage and companion memory.
 * Keep this module dependency-free so reading the active owner does not pull
 * habit analytics, nutrition or event-history code into the app entry bundle.
 */
let currentOwner = "guest";

export function getCurrentHabitOwner(): string {
  return currentOwner;
}

export function setCurrentHabitOwner(owner: string): void {
  currentOwner = owner;
}
