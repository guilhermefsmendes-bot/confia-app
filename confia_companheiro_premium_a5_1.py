from pathlib import Path
import shutil
import sys

ITEMS = Path("src/data/homeItems.ts")
STORAGE = Path("src/storage/homeInventory.ts")

BACKUP_ITEMS = Path(
    "/tmp/homeItems.ts.before_companheiro_premium_a5_1"
)
BACKUP_STORAGE = Path(
    "/tmp/homeInventory.ts.before_companheiro_premium_a5_1"
)

if not ITEMS.exists():
    print("ERRO: src/data/homeItems.ts não encontrado")
    sys.exit(1)

if not STORAGE.exists():
    print("ERRO: src/storage/homeInventory.ts não encontrado")
    sys.exit(1)

items_source = ITEMS.read_text(encoding="utf-8")
storage_source = STORAGE.read_text(encoding="utf-8")

shutil.copy2(ITEMS, BACKUP_ITEMS)
shutil.copy2(STORAGE, BACKUP_STORAGE)

try:

    # ============================================================
    # 1. NOVO CONTRATO DE ITENS
    # ============================================================

    if "CompanionItemKind" not in items_source:

        marker = "export interface HomeItem {"

        pos = items_source.find(marker)

        if pos == -1:
            raise RuntimeError(
                "interface HomeItem não encontrada"
            )

        contract = '''/**
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
  | "neck"
  | "body"
  | "hand"
  | "aura";

'''

        items_source = (
            items_source[:pos]
            + contract
            + items_source[pos:]
        )

    # ============================================================
    # 2. EXPANDIR HOMEITEM SEM QUEBRAR ITENS ANTIGOS
    # ============================================================

    interface_start = items_source.find(
        "export interface HomeItem {"
    )

    if interface_start == -1:
        raise RuntimeError(
            "HomeItem não encontrada após contrato"
        )

    interface_end = items_source.find(
        "}",
        interface_start
    )

    if interface_end == -1:
        raise RuntimeError(
            "fim da interface HomeItem não encontrado"
        )

    interface_block = items_source[
        interface_start:interface_end + 1
    ]

    if "companionKind?" not in interface_block:

        insertion = '''
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
'''

        items_source = (
            items_source[:interface_end]
            + insertion
            + items_source[interface_end:]
        )

    # ============================================================
    # 3. HELPERS DE COMPATIBILIDADE
    # ============================================================

    if "getCompanionItemKind" not in items_source:

        compatibility = '''

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
'''

        items_source = (
            items_source.rstrip()
            + compatibility
            + "\n"
        )

    # ============================================================
    # 4. STORAGE — LEITURA SEGURA
    # ============================================================

    if "safeParseIdList" not in storage_source:

        storage_marker = (
            'const EQUIPPED_KEY = "home_equipped";'
        )

        marker_pos = storage_source.find(storage_marker)

        if marker_pos == -1:
            raise RuntimeError(
                "EQUIPPED_KEY não encontrada"
            )

        insert_pos = marker_pos + len(storage_marker)

        helper = '''

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
'''

        storage_source = (
            storage_source[:insert_pos]
            + helper
            + storage_source[insert_pos:]
        )

    # ============================================================
    # 5. TROCAR APENAS JSON.PARSE DIRETO DAS DUAS LISTAS
    # ============================================================

    old_inventory_return = (
        "return saved ? JSON.parse(saved) : [];"
    )

    # O ficheiro tem esta construção em getInventory e getEquipped.
    # Substituímos todas as ocorrências equivalentes pela leitura segura.
    storage_source = storage_source.replace(
        old_inventory_return,
        "return safeParseIdList(saved);"
    )

    # ============================================================
    # 6. GARANTIR UNICIDADE SEM MUDAR CONTRATO
    # ============================================================

    # buyItem já protege contra duplicados.
    if "if (!inventory.includes(id))" not in storage_source:
        raise RuntimeError(
            "proteção contra duplicados de buyItem desapareceu"
        )

    # toggleEquip deve continuar intacto.
    if "if (equipped.includes(id))" not in storage_source:
        raise RuntimeError(
            "toggleEquip esperado não encontrado"
        )

    # ============================================================
    # 7. GUARDAR
    # ============================================================

    ITEMS.write_text(
        items_source,
        encoding="utf-8"
    )

    STORAGE.write_text(
        storage_source,
        encoding="utf-8"
    )

    written_items = ITEMS.read_text(encoding="utf-8")
    written_storage = STORAGE.read_text(encoding="utf-8")

    # ============================================================
    # 8. VALIDAÇÕES
    # ============================================================

    checks = {
        "tipo CompanionItemKind":
            "export type CompanionItemKind" in written_items,

        "slots acessórios":
            "export type CompanionAccessorySlot"
            in written_items,

        "legacy suportado":
            '"legacy"' in written_items,

        "accessory suportado":
            '"accessory"' in written_items,

        "treat suportado":
            '"treat"' in written_items,

        "effect suportado":
            '"effect"' in written_items,

        "HomeItem compatível":
            "companionKind?: CompanionItemKind"
            in written_items,

        "slot opcional":
            "companionSlot?: CompanionAccessorySlot"
            in written_items,

        "nível opcional":
            "minCompanionLevel?: number"
            in written_items,

        "helper legacy":
            "isLegacyHomeItem" in written_items,

        "helper acessórios":
            "getCompanionAccessories" in written_items,

        "storage defensivo":
            "function safeParseIdList"
            in written_storage,

        "inventory key preservada":
            '"home_inventory"' in written_storage,

        "equipped key preservada":
            '"home_equipped"' in written_storage,

        "oferta flower1 preservada":
            '"flower1"' in written_storage,

        "buyItem preservado":
            "export function buyItem"
            in written_storage,

        "toggleEquip preservado":
            "export function toggleEquip"
            in written_storage,

        "sem nova storage key":
            "companion_inventory" not in written_storage
            and "companion_equipped" not in written_storage,

        "sem timers":
            "setTimeout(" not in written_items
            and "setInterval(" not in written_items
            and "setTimeout(" not in written_storage
            and "setInterval(" not in written_storage,

        "sem rAF":
            "requestAnimationFrame(" not in written_items
            and "requestAnimationFrame(" not in written_storage,
    }

    failed = [
        name
        for name, ok in checks.items()
        if not ok
    ]

    if failed:
        raise RuntimeError(
            "Validação falhou:\n - "
            + "\n - ".join(failed)
        )

except Exception as exc:

    shutil.copy2(
        BACKUP_ITEMS,
        ITEMS
    )

    shutil.copy2(
        BACKUP_STORAGE,
        STORAGE
    )

    print("ERRO:", exc)
    print()
    print(
        "homeItems.ts e homeInventory.ts "
        "restaurados automaticamente."
    )
    sys.exit(1)


print("=" * 76)
print("CONFIA — COMPANHEIRO PREMIUM A5.1")
print("=" * 76)
print()
print("✓ Contrato novo de itens criado")
print("✓ legacy / accessory / treat / effect")
print("✓ Slots de acessórios preparados")
print("✓ HomeItem antigo continua compatível")
print("✓ IDs antigos preservados")
print("✓ flower1 inicial preservada")
print("✓ home_inventory preservado")
print("✓ home_equipped preservado")
print("✓ buyItem preservado")
print("✓ toggleEquip preservado")
print("✓ Leitura de storage mais defensiva")
print("✓ Nenhuma migração destrutiva")
print("✓ Nenhuma nova chave de localStorage")
print("✓ Nenhum timer")
print("✓ Nenhum requestAnimationFrame")
print("✓ Nenhuma dependência nova")
print()
print("Backups:")
print(f"  {BACKUP_ITEMS}")
print(f"  {BACKUP_STORAGE}")
print()
print("A5.1 aplicado.")
print("=" * 76)
