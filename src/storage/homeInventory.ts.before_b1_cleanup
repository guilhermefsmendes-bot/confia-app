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

  const saved = localStorage.getItem(INVENTORY_KEY);

  if (saved) {
    return safeParseIdList(saved);
  }


  // Oferta inicial para novos utilizadores
  const initialInventory = ["flower1"];

  localStorage.setItem(
    INVENTORY_KEY,
    JSON.stringify(initialInventory)
  );


  return initialInventory;

}



export function buyItem(id: string) {

  const inventory = getInventory();

  if (!inventory.includes(id)) {

    inventory.push(id);

    localStorage.setItem(
      INVENTORY_KEY,
      JSON.stringify(inventory)
    );

  }

}



export function isOwned(id: string) {

  return getInventory().includes(id);

}



export function getEquipped(): string[] {

  const saved = localStorage.getItem(EQUIPPED_KEY);

  return safeParseIdList(saved);

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
}

