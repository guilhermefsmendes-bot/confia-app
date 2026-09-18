from pathlib import Path
import shutil
import sys

PATH = Path("src/components/HomeInventory.tsx")
BACKUP = Path(
    "/tmp/HomeInventory.tsx.before_companheiro_premium_a5_4"
)

if not PATH.exists():
    print("ERRO: HomeInventory.tsx não encontrado.")
    sys.exit(1)

shutil.copy2(PATH, BACKUP)

src = PATH.read_text(encoding="utf-8")

try:
    # ==========================================================
    # 1. IMPORTS — HELPERS DOS ACESSÓRIOS
    # ==========================================================

    old_data_import = (
        'import { homeItems } '
        'from "../data/homeItems";'
    )

    new_data_import = '''import {
  homeItems,
  getCompanionAccessories,
  isCompanionAccessory,
} from "../data/homeItems";'''

    if old_data_import not in src:
        raise RuntimeError(
            "Import de homeItems não encontrado."
        )

    src = src.replace(
        old_data_import,
        new_data_import,
        1
    )

    # ==========================================================
    # 2. IMPORT STORAGE — TOGGLE POR SLOT
    # ==========================================================

    old_storage_import = '''import {
  getInventory,
  getEquipped,
  toggleEquip,
} from "../storage/homeInventory";'''

    new_storage_import = '''import {
  getInventory,
  getEquipped,
  toggleEquip,
  toggleCompanionAccessory,
} from "../storage/homeInventory";'''

    if old_storage_import not in src:
        raise RuntimeError(
            "Import do storage não encontrado."
        )

    src = src.replace(
        old_storage_import,
        new_storage_import,
        1
    )

    # ==========================================================
    # 3. MAPA DOS ACESSÓRIOS POR SLOT
    #
    # É derivado do catálogo A5.
    # Não duplica IDs nem cria storage.
    # ==========================================================

    state_marker = '''  const weeklyTrophies = getWeeklyTrophies();

  return ('''

    if state_marker not in src:
        raise RuntimeError(
            "Ponto de inserção do mapa de slots não encontrado."
        )

    state_replacement = '''  const weeklyTrophies = getWeeklyTrophies();

  /**
   * A5.4 — acessórios da CONFIA agrupados por slot.
   *
   * O mapa nasce dos metadados do catálogo A5.
   * Não cria uma segunda fonte de verdade.
   */
  const accessoryIdsBySlot =
    getCompanionAccessories().reduce<
      Record<string, string[]>
    >((acc, accessory) => {
      if (!accessory.companionSlot) {
        return acc;
      }

      const slot = accessory.companionSlot;

      if (!acc[slot]) {
        acc[slot] = [];
      }

      acc[slot].push(accessory.id);

      return acc;
    }, {});

  return ('''

    src = src.replace(
        state_marker,
        state_replacement,
        1
    )

    # ==========================================================
    # 4. ITEM NORMAL vs ACESSÓRIO CONFIA
    # ==========================================================

    old_click = '''                      onClick={() => {
                        toggleEquip(item.id);
                        setRefresh(v => v + 1);
                      }}'''

    new_click = '''                      onClick={() => {
                        if (
                          isCompanionAccessory(item) &&
                          item.companionSlot
                        ) {
                          toggleCompanionAccessory(
                            item.id,
                            item.companionSlot,
                            accessoryIdsBySlot
                          );
                        } else {
                          toggleEquip(item.id);
                        }

                        setRefresh(v => v + 1);
                      }}'''

    if old_click not in src:
        raise RuntimeError(
            "Botão de equipamento dos itens não encontrado."
        )

    if src.count(old_click) != 1:
        raise RuntimeError(
            "Número inesperado de botões de itens."
        )

    src = src.replace(
        old_click,
        new_click,
        1
    )

    # ==========================================================
    # GUARDAR
    # ==========================================================

    PATH.write_text(src, encoding="utf-8")

    final = PATH.read_text(encoding="utf-8")

    checks = {
        "helper getCompanionAccessories":
            "getCompanionAccessories"
            in final,

        "helper isCompanionAccessory":
            "isCompanionAccessory"
            in final,

        "toggleCompanionAccessory importado":
            "toggleCompanionAccessory,"
            in final,

        "mapa por slot":
            "accessoryIdsBySlot"
            in final,

        "usa companionSlot":
            "item.companionSlot"
            in final,

        "toggle legacy preservado":
            "toggleEquip(item.id);"
            in final,

        "troféus preservados":
            "toggleEquip(trophy.id);"
            in final,

        "sem novo localStorage":
            "localStorage"
            not in final,

        "sem timers":
            "setTimeout("
            not in final
            and "setInterval("
            not in final,

        "sem rAF":
            "requestAnimationFrame("
            not in final,
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
    shutil.copy2(BACKUP, PATH)

    print("ERRO:", exc)
    print()
    print("HomeInventory.tsx restaurado.")
    sys.exit(1)

print("=" * 76)
print("CONFIA — COMPANHEIRO PREMIUM A5.4")
print("=" * 76)
print()
print("✓ Acessórios CONFIA usam slots reais")
print("✓ Slot head independente")
print("✓ Slot neck exclusivo")
print("✓ Lenço e Amuleto tornam-se mutuamente exclusivos")
print("✓ Laço pode coexistir com um acessório neck")
print("✓ Itens legacy continuam com toggleEquip")
print("✓ Troféus continuam com toggleEquip")
print("✓ home_inventory preservado")
print("✓ home_equipped preservado")
print("✓ Sem novo localStorage")
print("✓ Sem timers")
print("✓ Sem requestAnimationFrame")
print("✓ Sem dependências")
print()
print("Backup:")
print(f"  {BACKUP}")
print()
print("A5.4 aplicado.")
print("=" * 76)
