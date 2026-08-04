export interface HomeItem {
  id: string;
  emoji: string;
  cost: number;
  category: string;
}

export const homeItems: HomeItem[] = [
  // Flores
  { id: "flower1", emoji: "🌼", cost: 5, category: "flowers" },
  { id: "flower2", emoji: "🌸", cost: 10, category: "flowers" },
  { id: "flower3", emoji: "🌺", cost: 15, category: "flowers" },
  { id: "flower4", emoji: "🌷", cost: 20, category: "flowers" },
  { id: "flower5", emoji: "🌹", cost: 25, category: "flowers" },
  { id: "flower6", emoji: "🥀", cost: 30, category: "flowers" },
  { id: "flower7", emoji: "💐", cost: 35, category: "flowers" },
  { id: "flower8", emoji: "🪻", cost: 40, category: "flowers" },

  // Árvores
  { id: "tree1", emoji: "🌳", cost: 45, category: "trees" },
  { id: "tree2", emoji: "🌲", cost: 50, category: "trees" },
  { id: "tree3", emoji: "🌴", cost: 55, category: "trees" },
  { id: "tree4", emoji: "🎄", cost: 60, category: "trees" },
  { id: "tree5", emoji: "🌵", cost: 65, category: "trees" },
  { id: "tree6", emoji: "🪵", cost: 70, category: "trees" },
  { id: "tree7", emoji: "🍀", cost: 75, category: "trees" },
  { id: "tree8", emoji: "☘️", cost: 80, category: "trees" },

  // Rochas
  { id: "rock1", emoji: "🪨", cost: 85, category: "rocks" },
  { id: "rock2", emoji: "🪨", cost: 90, category: "rocks" },
  { id: "rock3", emoji: "🪨", cost: 95, category: "rocks" },
  { id: "rock4", emoji: "🪨", cost: 100, category: "rocks" },
  { id: "rock5", emoji: "🪨", cost: 105, category: "rocks" },
  { id: "rock6", emoji: "🪨", cost: 110, category: "rocks" },

  // Bancos
  { id: "bench1", emoji: "🪑", cost: 115, category: "furniture" },
  { id: "bench2", emoji: "🪑", cost: 120, category: "furniture" },
  { id: "bench3", emoji: "🪑", cost: 125, category: "furniture" },
  { id: "bench4", emoji: "🪑", cost: 130, category: "furniture" },
  { id: "bench5", emoji: "🪑", cost: 135, category: "furniture" },
  { id: "bench6", emoji: "🪑", cost: 140, category: "furniture" },

  // Água
  { id: "water1", emoji: "💧", cost: 145, category: "water" },
  { id: "water2", emoji: "🪷", cost: 150, category: "water" },
  { id: "water3", emoji: "⛲", cost: 155, category: "water" },
  { id: "water4", emoji: "🌊", cost: 160, category: "water" },
  { id: "water5", emoji: "🐚", cost: 165, category: "water" },
  { id: "water6", emoji: "🦆", cost: 170, category: "water" },

  // Extras
  { id: "extra1", emoji: "🏮", cost: 175, category: "extras" },
  { id: "extra2", emoji: "🦋", cost: 180, category: "extras" },
  { id: "extra3", emoji: "🐿️", cost: 185, category: "extras" },
  { id: "extra4", emoji: "🪺", cost: 190, category: "extras" },
  { id: "extra5", emoji: "🌞", cost: 195, category: "extras" },
  { id: "extra6", emoji: "🌈", cost: 200, category: "extras" }
];
