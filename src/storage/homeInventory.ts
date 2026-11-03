const INVENTORY_KEY = "home_inventory";
const EQUIPPED_KEY = "home_equipped";

/**
 * A5.1 — leitura defensiva.
 *
 * Mantém exatamente as mesmas chaves antigas.
 * Apenas impede que dados inválidos no storage quebrem
 * Inventário/Loja/Companheiro.
 */
function safeParseIdList(
  raw: string | null
): string[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (value): value is string =>
        typeof value === "string"
    );
  } catch {
    return [];
  }
}



export function getInventory(): string[] {
  try {
    const saved = localStorage.getItem(INVENTORY_KEY);

    if (saved) {
      // Preserve every valid legacy ID. Items absent from the current
      // catalogue may not be rendered, but reading must never delete them.
      return [...new Set(safeParseIdList(saved))];
    }

    const initialInventory: string[] = [];
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(initialInventory));
    return initialInventory;
  } catch {
    // Storage can be unavailable in private/restricted browser contexts.
    return [];
  }
}



export function buyItem(id: string): boolean {
  if (typeof id !== "string" || !id.startsWith("confia_")) {
    return false;
  }

  const inventory = getInventory();

  // The storage layer is the final duplicate guard. This matters when
  // two rapid clicks occur before React has refreshed the shop UI.
  if (inventory.includes(id)) {
    return false;
  }

  try {
    localStorage.setItem(
      INVENTORY_KEY,
      JSON.stringify([...inventory, id])
    );
    return true;
  } catch {
    // A failed persistence must never be reported as a successful purchase.
    return false;
  }
}



export function isOwned(id: string) {

  return getInventory().includes(id);

}



export function getEquipped(): string[] {
  try {
    const saved = localStorage.getItem(EQUIPPED_KEY);
    // Keep legacy equipment IDs. The companion preview consumes only
    // known accessory IDs, while persistence remains lossless.
    return [...new Set(safeParseIdList(saved))];
  } catch {
    return [];
  }
}



export function isEquipped(id: string) {

  return getEquipped().includes(id);

}



export function toggleEquip(id: string) {

  let equipped = getEquipped();


  if (equipped.includes(id)) {

    equipped = equipped.filter(
      item => item !== id
    );

  } else {

    equipped.push(id);

  }


  localStorage.setItem(
    EQUIPPED_KEY,
    JSON.stringify(equipped)
  );

}

/**
 * ==========================================================
 * A5.2 — EQUIPAMENTO DA CONFIA POR SLOT
 * ==========================================================
 *
 * Mantém home_equipped como fonte única de verdade.
 *
 * Ao equipar um acessório:
 * - preserva todos os IDs legacy;
 * - preserva acessórios de outros slots;
 * - remove apenas outro acessório do mesmo slot.
 *
 * Não cria storage novo.
 */
export function toggleCompanionAccessory(
  id: string,
  slot: string,
  accessoryIdsBySlot: Record<string, string[]>
): void {
  let equipped = getEquipped();

  if (equipped.includes(id)) {
    equipped = equipped.filter(
      equippedId => equippedId !== id
    );
  } else {
    const sameSlotIds =
      accessoryIdsBySlot[slot] ?? [];

    equipped = equipped.filter(
      equippedId =>
        !sameSlotIds.includes(equippedId)
    );

    equipped.push(id);
  }

  localStorage.setItem(
    EQUIPPED_KEY,
    JSON.stringify(equipped)
  );

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new Event("confia:equipment-changed")
    );
  }
}

