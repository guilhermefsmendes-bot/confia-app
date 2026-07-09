import type { ImpulseEpisode } from "./types";

const STORAGE_KEY = "confia_impulso_history";

export function loadEpisodes(): ImpulseEpisode[] {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) return [];

  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveEpisode(
  episode: ImpulseEpisode
): void {
  const history = loadEpisodes();

  history.unshift(episode);

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(history)
  );
}
