export interface HomeWorldState {
  level: number;
  health: number;
  lastVisit: string;
  daysActive: number;
}

const WORLD_KEY = "confia_home_world";

const defaultWorld: HomeWorldState = {
  level: 1,
  health: 100,
  lastVisit: new Date().toISOString(),
  daysActive: 1,
};


export function getWorld(): HomeWorldState {

  const saved = localStorage.getItem(WORLD_KEY);

  if (!saved) {
    localStorage.setItem(
      WORLD_KEY,
      JSON.stringify(defaultWorld)
    );

    return defaultWorld;
  }

  return JSON.parse(saved);

}


export function saveWorld(
  world: HomeWorldState
) {

  localStorage.setItem(
    WORLD_KEY,
    JSON.stringify(world)
  );

}


export function careWorld(amount:number = 1){

  const world = getWorld();

  world.health = Math.min(
    100,
    world.health + amount
  );


  saveWorld(world);

  return world;

}
