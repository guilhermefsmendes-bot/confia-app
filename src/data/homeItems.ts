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
  { id: "flower6", emoji: "🪻", cost: 30, category: "flowers" },

  // Árvores e natureza
  { id: "tree1", emoji: "🌳", cost: 45, category: "trees" },
  { id: "tree2", emoji: "🌲", cost: 60, category: "trees" },
  { id: "tree3", emoji: "🌴", cost: 75, category: "trees" },
  { id: "tree4", emoji: "🍀", cost: 90, category: "trees" },
  { id: "tree5", emoji: "🪵", cost: 110, category: "trees" },

  // Animais do Refúgio
  { id: "animal1", emoji: "🐰", cost: 120, category: "animals" },
  { id: "animal2", emoji: "🦔", cost: 140, category: "animals" },
  { id: "animal3", emoji: "🐿️", cost: 160, category: "animals" },
  { id: "animal4", emoji: "🦆", cost: 180, category: "animals" },
  { id: "animal5", emoji: "🪺", cost: 200, category: "animals" },
  { id: "animal6", emoji: "🦋", cost: 220, category: "animals" },

  // Zonas de calma
  { id: "calm1", emoji: "🪷", cost: 240, category: "calm" },
  { id: "calm2", emoji: "⛺", cost: 260, category: "calm" },
  { id: "calm3", emoji: "🏮", cost: 280, category: "calm" },
  { id: "calm4", emoji: "🕯️", cost: 300, category: "calm" },
  { id: "calm5", emoji: "🌙", cost: 330, category: "calm" },

  // Elementos mágicos
  { id: "magic1", emoji: "🌫️", cost: 360, category: "magic" },
  { id: "magic2", emoji: "💗", cost: 390, category: "magic" },
  { id: "magic3", emoji: "✨", cost: 420, category: "magic" },
  { id: "magic4", emoji: "☄️", cost: 460, category: "magic" },
  { id: "magic5", emoji: "🌌", cost: 500, category: "magic" },
  { id: "magic6", emoji: "🪐", cost: 550, category: "magic" },

  // Água
  { id: "water1", emoji: "💧", cost: 300, category: "water" },
  { id: "water2", emoji: "🪷", cost: 340, category: "water" },
  { id: "water3", emoji: "⛲", cost: 380, category: "water" },
  { id: "water4", emoji: "🌊", cost: 420, category: "water" },

  // Itens raros
  { id: "rare1", emoji: "🍄", cost: 600, category: "rare" },
  { id: "rare2", emoji: "🌻", cost: 650, category: "rare" },
  { id: "rare3", emoji: "🦚", cost: 700, category: "rare" },
  { id: "rare4", emoji: "🌈", cost: 800, category: "rare" },
  { id: "rare5", emoji: "💎", cost: 900, category: "rare" }
];
