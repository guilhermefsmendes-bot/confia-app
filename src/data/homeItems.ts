/**
 * ==========================================================
 * A5.1 — CONTRATO DE ITENS DA CONFIA
 * ==========================================================
 *
 * A persistência antiga continua baseada exclusivamente no ID.
 * Estes metadados não alteram home_inventory/home_equipped.
 *
 * legacy:
 *   item pertencente ao antigo mundo.
 *
 * accessory:
 *   item visual que poderá ser usado pela CONFIA.
 *
 * treat:
 *   mimo/interação futura.
 *
 * effect:
 *   efeito cosmético leve futuro.
 */
export type CompanionItemKind =
  | "legacy"
  | "accessory"
  | "treat"
  | "effect";

export type CompanionAccessorySlot =
  | "head"
  | "face"
  | "neck"
  | "body"
  | "hand"
  | "aura"
  | "skin"
  | "mark"
  | "flame"
  | "eyes";

export interface HomeItem {
  id: string;
  emoji: string;
  cost: number;
  category: string;

  /**
   * A5 — classificação para a nova relação com a CONFIA.
   *
   * Opcional para manter compatibilidade total com o
   * catálogo antigo.
   */
  companionKind?: CompanionItemKind;
  companionSlot?: CompanionAccessorySlot;
  minCompanionLevel?: number;
  legacy?: boolean;
}

export const homeItems: HomeItem[] = [
  // B2.3 — personalização premium diversificada
  {
    id: "confia_bow_cream",
    emoji: "🎀",
    cost: 80,
    category: "companion",
    companionKind: "accessory",
    companionSlot: "head",
    minCompanionLevel: 2
  },
  {
    id: "confia_flower_daisy",
    emoji: "🌼",
    cost: 120,
    category: "companion",
    companionKind: "accessory",
    companionSlot: "head",
    minCompanionLevel: 3
  },
  {
    id: "confia_beret_terra",
    emoji: "🧢",
    cost: 180,
    category: "companion",
    companionKind: "accessory",
    companionSlot: "head",
    minCompanionLevel: 4
  },
  {
    id: "confia_beanie_cream",
    emoji: "🧶",
    cost: 220,
    category: "companion",
    companionKind: "accessory",
    companionSlot: "head",
    minCompanionLevel: 5
  },
  {
    id: "confia_hat_garden",
    emoji: "👒",
    cost: 280,
    category: "companion",
    companionKind: "accessory",
    companionSlot: "head",
    minCompanionLevel: 6
  },
  {
    id: "confia_crown_gold",
    emoji: "👑",
    cost: 600,
    category: "companion",
    companionKind: "accessory",
    companionSlot: "head",
    minCompanionLevel: 10
  },
  {
    id: "confia_glasses_round",
    emoji: "👓",
    cost: 130,
    category: "companion",
    companionKind: "accessory",
    companionSlot: "face",
    minCompanionLevel: 3
  },
  {
    id: "confia_glasses_gold",
    emoji: "👓",
    cost: 260,
    category: "companion",
    companionKind: "accessory",
    companionSlot: "face",
    minCompanionLevel: 6
  },
  {
    id: "confia_glasses_sun",
    emoji: "🕶️",
    cost: 330,
    category: "companion",
    companionKind: "accessory",
    companionSlot: "face",
    minCompanionLevel: 7
  },
  {
    id: "confia_glasses_heart",
    emoji: "💗",
    cost: 460,
    category: "companion",
    companionKind: "accessory",
    companionSlot: "face",
    minCompanionLevel: 9
  },
  {
    id: "confia_scarf_terra",
    emoji: "🧣",
    cost: 120,
    category: "companion",
    companionKind: "accessory",
    companionSlot: "neck",
    minCompanionLevel: 3
  },
  {
    id: "confia_charm_gold",
    emoji: "✨",
    cost: 180,
    category: "companion",
    companionKind: "accessory",
    companionSlot: "neck",
    minCompanionLevel: 5
  },
  {
    id: "confia_scarf_cream",
    emoji: "🧣",
    cost: 150,
    category: "companion",
    companionKind: "accessory",
    companionSlot: "neck",
    minCompanionLevel: 3
  },
  {
    id: "confia_necklace_leaf",
    emoji: "🌿",
    cost: 200,
    category: "companion",
    companionKind: "accessory",
    companionSlot: "neck",
    minCompanionLevel: 4
  },
  {
    id: "confia_pendant_moon",
    emoji: "🌙",
    cost: 500,
    category: "companion",
    companionKind: "accessory",
    companionSlot: "neck",
    minCompanionLevel: 9
  },
  {
    id: "confia_bag_terra",
    emoji: "👜",
    cost: 240,
    category: "companion",
    companionKind: "accessory",
    companionSlot: "body",
    minCompanionLevel: 5
  },
  {
    id: "confia_cape_cream",
    emoji: "🧥",
    cost: 300,
    category: "companion",
    companionKind: "accessory",
    companionSlot: "body",
    minCompanionLevel: 6
  },
  {
    id: "confia_backpack_terra",
    emoji: "🎒",
    cost: 360,
    category: "companion",
    companionKind: "accessory",
    companionSlot: "body",
    minCompanionLevel: 7
  },
  {
    id: "confia_hand_flower",
    emoji: "🌼",
    cost: 170,
    category: "companion",
    companionKind: "accessory",
    companionSlot: "hand",
    minCompanionLevel: 4
  },
  {
    id: "confia_hand_book",
    emoji: "📖",
    cost: 340,
    category: "companion",
    companionKind: "accessory",
    companionSlot: "hand",
    minCompanionLevel: 7
  },
  {
    id: "confia_hand_light",
    emoji: "✨",
    cost: 540,
    category: "companion",
    companionKind: "accessory",
    companionSlot: "hand",
    minCompanionLevel: 10
  },
  {
    id: "confia_aura_soft",
    emoji: "✨",
    cost: 230,
    category: "companion",
    companionKind: "accessory",
    companionSlot: "aura",
    minCompanionLevel: 5
  },
  {
    id: "confia_aura_stars",
    emoji: "🌟",
    cost: 320,
    category: "companion",
    companionKind: "accessory",
    companionSlot: "aura",
    minCompanionLevel: 6
  },
  {
    id: "confia_aura_leaves",
    emoji: "🍃",
    cost: 400,
    category: "companion",
    companionKind: "accessory",
    companionSlot: "aura",
    minCompanionLevel: 7
  },
  {
    id: "confia_aura_gold",
    emoji: "✨",
    cost: 700,
    category: "companion",
    companionKind: "accessory",
    companionSlot: "aura",
    minCompanionLevel: 10
  },
  {
    id: "confia_skin_cream",
    emoji: "🎨",
    cost: 160,
    category: "companion",
    companionKind: "accessory",
    companionSlot: "skin",
    minCompanionLevel: 3
  },
  {
    id: "confia_skin_peach",
    emoji: "🎨",
    cost: 220,
    category: "companion",
    companionKind: "accessory",
    companionSlot: "skin",
    minCompanionLevel: 4
  },
  {
    id: "confia_skin_rose",
    emoji: "🎨",
    cost: 300,
    category: "companion",
    companionKind: "accessory",
    companionSlot: "skin",
    minCompanionLevel: 5
  },
  {
    id: "confia_skin_terra",
    emoji: "🎨",
    cost: 400,
    category: "companion",
    companionKind: "accessory",
    companionSlot: "skin",
    minCompanionLevel: 7
  },
  {
    id: "confia_skin_gold",
    emoji: "🎨",
    cost: 650,
    category: "companion",
    companionKind: "accessory",
    companionSlot: "skin",
    minCompanionLevel: 10
  },
  {
    id: "confia_mark_heart",
    emoji: "♥",
    cost: 180,
    category: "companion",
    companionKind: "accessory",
    companionSlot: "mark",
    minCompanionLevel: 3
  },
  {
    id: "confia_mark_star",
    emoji: "★",
    cost: 240,
    category: "companion",
    companionKind: "accessory",
    companionSlot: "mark",
    minCompanionLevel: 4
  },
  {
    id: "confia_mark_leaf",
    emoji: "🌿",
    cost: 300,
    category: "companion",
    companionKind: "accessory",
    companionSlot: "mark",
    minCompanionLevel: 6
  },
  {
    id: "confia_mark_moon",
    emoji: "☾",
    cost: 380,
    category: "companion",
    companionKind: "accessory",
    companionSlot: "mark",
    minCompanionLevel: 8
  },
  {
    id: "confia_mark_sun",
    emoji: "☀",
    cost: 500,
    category: "companion",
    companionKind: "accessory",
    companionSlot: "mark",
    minCompanionLevel: 10
  },
  {
    id: "confia_flame_pearl",
    emoji: "🔥",
    cost: 260,
    category: "companion",
    companionKind: "accessory",
    companionSlot: "flame",
    minCompanionLevel: 5
  },
  {
    id: "confia_flame_rose",
    emoji: "🔥",
    cost: 360,
    category: "companion",
    companionKind: "accessory",
    companionSlot: "flame",
    minCompanionLevel: 7
  },
  {
    id: "confia_flame_gold",
    emoji: "🔥",
    cost: 520,
    category: "companion",
    companionKind: "accessory",
    companionSlot: "flame",
    minCompanionLevel: 9
  },
  {
    id: "confia_eyes_amber",
    emoji: "👁️",
    cost: 280,
    category: "companion",
    companionKind: "accessory",
    companionSlot: "eyes",
    minCompanionLevel: 6
  },
  {
    id: "confia_eyes_honey",
    emoji: "👁️",
    cost: 420,
    category: "companion",
    companionKind: "accessory",
    companionSlot: "eyes",
    minCompanionLevel: 8
  },
];

/**
 * ==========================================================
 * A5.1 — CAMADA DE COMPATIBILIDADE
 * ==========================================================
 *
 * Qualquer item antigo sem metadados A5 é tratado como
 * legacy. Assim nenhum ID antigo precisa de ser alterado.
 */
export function getCompanionItemKind(
  item: HomeItem
): CompanionItemKind {
  return item.companionKind ?? "legacy";
}

export function isLegacyHomeItem(
  item: HomeItem
): boolean {
  return item.legacy === true ||
    getCompanionItemKind(item) === "legacy";
}

export function isCompanionAccessory(
  item: HomeItem
): boolean {
  return getCompanionItemKind(item) === "accessory";
}

export function getCompanionAccessories(): HomeItem[] {
  return homeItems.filter(isCompanionAccessory);
}

