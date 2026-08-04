const KEY = "confia_home_positions";

export interface Position {
  left?: string;
  top?: string;
  bottom?: string;
  right?: string;
}

export function getPositions(): Record<string, Position> {

  const saved = localStorage.getItem(KEY);

  if (!saved) return {};

  return JSON.parse(saved);

}


export function savePositions(
  positions: Record<string, Position>
) {

  localStorage.setItem(
    KEY,
    JSON.stringify(positions)
  );

}
