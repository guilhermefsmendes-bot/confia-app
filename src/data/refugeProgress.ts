export interface RefugeLevel {
  level: number;
  name: string;
  requiredXp: number;
  description: string;
  unlocks: string[];
}

export const refugeLevels: RefugeLevel[] = [

  {
    level: 1,
    name: "Pequeno Jardim",
    requiredXp: 0,
    description: "O início do teu refúgio. Um espaço simples para crescer.",
    unlocks: [
      "flower1",
      "tree1",
      "bench1"
    ]
  },

  {
    level: 2,
    name: "Jardim Acolhedor",
    requiredXp: 100,
    description: "O espaço começa a ganhar vida.",
    unlocks: [
      "flower2",
      "flower3",
      "tree2",
      "butterfly"
    ]
  },

  {
    level: 3,
    name: "Pequena Quinta",
    requiredXp: 500,
    description: "Novas zonas começam a aparecer.",
    unlocks: [
      "water1",
      "rock1",
      "extra2"
    ]
  },

  {
    level: 4,
    name: "Quinta Desenvolvida",
    requiredXp: 1000,
    description: "O teu refúgio tornou-se um verdadeiro lugar de tranquilidade.",
    unlocks: [
      "tree3",
      "water2",
      "extra3"
    ]
  },

  {
    level: 5,
    name: "Refúgio Mágico",
    requiredXp: 2000,
    description: "Um espaço especial criado pelo teu progresso.",
    unlocks: [
      "rainbow",
      "extra5",
      "extra6"
    ]
  }

];


export function getRefugeLevel(xp:number){

  let current = refugeLevels[0];

  for(const level of refugeLevels){

    if(xp >= level.requiredXp){
      current = level;
    }

  }

  return current;

}
