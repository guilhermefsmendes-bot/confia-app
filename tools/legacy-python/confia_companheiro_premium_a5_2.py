from pathlib import Path
import shutil
import sys

ITEMS = Path("src/data/homeItems.ts")
STORAGE = Path("src/storage/homeInventory.ts")

BACKUP_ITEMS = Path(
    "/tmp/homeItems.ts.before_companheiro_premium_a5_2"
)
BACKUP_STORAGE = Path(
    "/tmp/homeInventory.ts.before_companheiro_premium_a5_2"
)

if not ITEMS.exists() or not STORAGE.exists():
    print("ERRO: ficheiros A5 não encontrados.")
    sys.exit(1)

items = ITEMS.read_text(encoding="utf-8")
storage = STORAGE.read_text(encoding="utf-8")

shutil.copy2(ITEMS, BACKUP_ITEMS)
shutil.copy2(STORAGE, BACKUP_STORAGE)

try:

    # ============================================================
    # 1. GARANTIR QUE A5.1 EXISTE
    # ============================================================

    required_items = [
        "export type CompanionItemKind",
        "export type CompanionAccessorySlot",
        "companionKind?: CompanionItemKind",
        "companionSlot?: CompanionAccessorySlot",
        "getCompanionAccessories",
    ]

    for marker in required_items:
        if marker not in items:
            raise RuntimeError(
                f"Contrato A5.1 ausente: {marker}"
            )

    if "export function getEquipped" not in storage:
        raise RuntimeError("getEquipped não encontrado")

    if "export function toggleEquip" not in storage:
        raise RuntimeError("toggleEquip não encontrado")

    # ============================================================
    # 2. NOVOS ACESSÓRIOS
    # ============================================================

    accessory_ids = [
        "confia_bow_cream",
        "confia_scarf_terra",
        "confia_charm_gold",
    ]

    already_present = [
        item_id
        for item_id in accessory_ids
        if f'id: "{item_id}"' in items
    ]

    if already_present:
        raise RuntimeError(
            "A5.2 parece já aplicado. IDs encontrados: "
            + ", ".join(already_present)
        )

    # Inserimos antes do último item raro.
    marker = (
        '  { id: "rare5", emoji: "💎", '
        'cost: 900, category: "rare" }'
    )

    if marker not in items:
        raise RuntimeError(
            "Ponto seguro do catálogo não encontrado"
        )

    replacement = '''  { id: "rare5", emoji: "💎", cost: 900, category: "rare" },

  // A5.2 — Acessórios da CONFIA
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
  }'''

    items = items.replace(
        marker,
        replacement,
        1
    )

    # ============================================================
    # 3. EQUIPAMENTO ESPECÍFICO DA CONFIA
    # ============================================================

    if "toggleCompanionAccessory" not in storage:

        addition = '''

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
'''

        storage = storage.rstrip() + addition + "\n"

    # ============================================================
    # 4. GUARDAR
    # ============================================================

    ITEMS.write_text(items, encoding="utf-8")
    STORAGE.write_text(storage, encoding="utf-8")

    final_items = ITEMS.read_text(encoding="utf-8")
    final_storage = STORAGE.read_text(encoding="utf-8")

    # ============================================================
    # 5. VALIDAÇÃO
    # ============================================================

    checks = {
        "laço criado":
            final_items.count(
                'id: "confia_bow_cream"'
            ) == 1,

        "lenço criado":
            final_items.count(
                'id: "confia_scarf_terra"'
            ) == 1,

        "amuleto criado":
            final_items.count(
                'id: "confia_charm_gold"'
            ) == 1,

        "laço head":
            'companionSlot: "head"'
            in final_items,

        "dois neck":
            final_items.count(
                'companionSlot: "neck"'
            ) == 2,

        "todos accessory":
            final_items.count(
                'companionKind: "accessory"'
            ) == 3,

        "nível 2":
            "minCompanionLevel: 2"
            in final_items,

        "nível 3":
            "minCompanionLevel: 3"
            in final_items,

        "nível 5":
            "minCompanionLevel: 5"
            in final_items,

        "equipamento por slot":
            "export function toggleCompanionAccessory"
            in final_storage,

        "storage antigo":
            '"home_equipped"'
            in final_storage
            and '"home_inventory"'
            in final_storage,

        "toggle legado":
            "export function toggleEquip"
            in final_storage,

        "flower1 preservada":
            '"flower1"'
            in final_storage,

        "sem storage novo":
            "companion_equipped"
            not in final_storage
            and "companion_inventory"
            not in final_storage,

        "sem timer":
            "setTimeout(" not in final_items
            and "setTimeout(" not in final_storage
            and "setInterval(" not in final_items
            and "setInterval(" not in final_storage,

        "sem rAF":
            "requestAnimationFrame("
            not in final_items
            and "requestAnimationFrame("
            not in final_storage,
    }

    failed = [
        name for name, ok in checks.items()
        if not ok
    ]

    if failed:
        raise RuntimeError(
            "Validação falhou:\n - "
            + "\n - ".join(failed)
        )

except Exception as exc:

    shutil.copy2(BACKUP_ITEMS, ITEMS)
    shutil.copy2(BACKUP_STORAGE, STORAGE)

    print("ERRO:", exc)
    print()
    print(
        "Ficheiros restaurados automaticamente."
    )
    sys.exit(1)


print("=" * 76)
print("CONFIA — COMPANHEIRO PREMIUM A5.2")
print("=" * 76)
print()
print("✓ 3 acessórios próprios da CONFIA")
print("✓ Laço Creme — cabeça — nível 2")
print("✓ Lenço Terracota — pescoço — nível 3")
print("✓ Amuleto Dourado — pescoço — nível 5")
print("✓ IDs antigos preservados")
print("✓ Itens legacy preservados")
print("✓ Um acessório por slot preparado")
print("✓ Equipamento legacy preservado")
print("✓ home_inventory preservado")
print("✓ home_equipped preservado")
print("✓ Nenhuma storage nova")
print("✓ Nenhum timer")
print("✓ Nenhum requestAnimationFrame")
print("✓ Nenhuma dependência nova")
print()
print("Backups:")
print(f"  {BACKUP_ITEMS}")
print(f"  {BACKUP_STORAGE}")
print()
print("A5.2 aplicado.")
print("=" * 76)
