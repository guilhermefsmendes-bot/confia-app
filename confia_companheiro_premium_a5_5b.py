from pathlib import Path
import shutil
import sys

INVENTORY = Path("src/components/HomeInventory.tsx")
APP = Path("src/App.tsx")

BACKUPS = {
    INVENTORY:
        Path("/tmp/HomeInventory.tsx.before_companheiro_premium_a5_5b"),
    APP:
        Path("/tmp/App.tsx.before_companheiro_premium_a5_5b"),
}

for path in BACKUPS:
    if not path.exists():
        print(f"ERRO: ficheiro não encontrado: {path}")
        sys.exit(1)

for path, backup in BACKUPS.items():
    shutil.copy2(path, backup)


def restore_all():
    for path, backup in BACKUPS.items():
        shutil.copy2(backup, path)


try:

    # ==========================================================
    # HOME INVENTORY
    # ==========================================================

    src = INVENTORY.read_text(encoding="utf-8")

    # ----------------------------------------------------------
    # 1. Import da criatura real
    # ----------------------------------------------------------

    marker = '''import { getWeeklyTrophies } from "../storage/weeklyTrophies";
'''

    replacement = '''import { getWeeklyTrophies } from "../storage/weeklyTrophies";
import ConfiaCreature from "./Companheiro/ConfiaCreature";
'''

    if marker not in src:
        raise RuntimeError(
            "Import de weeklyTrophies não encontrado."
        )

    if "ConfiaCreature" in src:
        raise RuntimeError(
            "ConfiaCreature já está importada no HomeInventory."
        )

    src = src.replace(
        marker,
        replacement,
        1
    )

    # ----------------------------------------------------------
    # 2. Prop mínima: companionLevel
    # ----------------------------------------------------------

    old_props = '''interface HomeInventoryProps {
  onBack: () => void;
}'''

    new_props = '''interface HomeInventoryProps {
  onBack: () => void;
  companionLevel: number;
}'''

    if old_props not in src:
        raise RuntimeError(
            "Interface HomeInventoryProps esperada não encontrada."
        )

    src = src.replace(
        old_props,
        new_props,
        1
    )

    # ----------------------------------------------------------
    # 3. Receber companionLevel
    # ----------------------------------------------------------

    old_component = '''const HomeInventory: React.FC<HomeInventoryProps> = ({ onBack }) => {'''

    new_component = '''const HomeInventory: React.FC<HomeInventoryProps> = ({
  onBack,
  companionLevel,
}) => {'''

    if old_component not in src:
        raise RuntimeError(
            "Declaração do HomeInventory não encontrada."
        )

    src = src.replace(
        old_component,
        new_component,
        1
    )

    # ----------------------------------------------------------
    # 4. IDs atualmente equipados que pertencem à CONFIA
    # ----------------------------------------------------------

    marker = '''  const weeklyTrophies = getWeeklyTrophies();

  /**
   * A5.4 — acessórios da CONFIA agrupados por slot.'''

    replacement = '''  const weeklyTrophies = getWeeklyTrophies();

  /**
   * A5.5B — acessórios atualmente visíveis na CONFIA.
   *
   * A lista continua derivada do catálogo + home_equipped.
   * IDs legacy e troféus não são enviados para o preview.
   */
  const equippedCompanionAccessoryIds =
    getCompanionAccessories()
      .filter(accessory =>
        equipped.includes(accessory.id)
      )
      .map(accessory => accessory.id);

  /**
   * A5.4 — acessórios da CONFIA agrupados por slot.'''

    if marker not in src:
        raise RuntimeError(
            "Ponto de inserção dos acessórios equipados não encontrado."
        )

    src = src.replace(
        marker,
        replacement,
        1
    )

    # ----------------------------------------------------------
    # 5. Preview dentro do cabeçalho premium
    # ----------------------------------------------------------

    old_header_end = '''          <p className="mx-auto mt-2 max-w-[310px] text-sm leading-relaxed text-[#826D65]">
            {t("companionCustomization.subtitle")}
          </p>

        </div>
      </div>'''

    new_header_end = '''          <p className="mx-auto mt-2 max-w-[310px] text-sm leading-relaxed text-[#826D65]">
            {t("companionCustomization.subtitle")}
          </p>

          {/* A5.5B — preview real da CONFIA */}
          <div className="relative mx-auto mt-5 flex h-[210px] max-w-[260px] items-center justify-center overflow-hidden rounded-[28px] border border-[#EBD8CC] bg-white/55 shadow-inner">

            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F2D4BD]/25 blur-2xl"
            />

            <div className="relative flex h-[195px] w-[195px] items-center justify-center">
              <ConfiaCreature
                level={companionLevel}
                equippedAccessoryIds={
                  equippedCompanionAccessoryIds
                }
              />
            </div>

          </div>

        </div>
      </div>'''

    if old_header_end not in src:
        raise RuntimeError(
            "Final do cabeçalho premium não encontrado."
        )

    src = src.replace(
        old_header_end,
        new_header_end,
        1
    )

    INVENTORY.write_text(
        src,
        encoding="utf-8"
    )

    # ==========================================================
    # APP.TSX
    # ==========================================================

    app_src = APP.read_text(encoding="utf-8")

    old_call = '''  <HomeInventory
    onBack={() => setHomeScreen("home")}
  />'''

    new_call = '''  <HomeInventory
    onBack={() => setHomeScreen("home")}
    companionLevel={avatar.level}
  />'''

    if old_call not in app_src:
        raise RuntimeError(
            "Chamada de HomeInventory no App.tsx não encontrada."
        )

    if app_src.count(old_call) != 1:
        raise RuntimeError(
            "Número inesperado de chamadas HomeInventory."
        )

    app_src = app_src.replace(
        old_call,
        new_call,
        1
    )

    APP.write_text(
        app_src,
        encoding="utf-8"
    )

    # ==========================================================
    # VALIDAÇÃO
    # ==========================================================

    final_inventory = INVENTORY.read_text(
        encoding="utf-8"
    )

    final_app = APP.read_text(
        encoding="utf-8"
    )

    checks = {
        "ConfiaCreature importada":
            'from "./Companheiro/ConfiaCreature"'
            in final_inventory,

        "prop companionLevel":
            "companionLevel: number;"
            in final_inventory,

        "nível passado à criatura":
            "level={companionLevel}"
            in final_inventory,

        "acessórios passados à criatura":
            "equippedAccessoryIds={"
            in final_inventory
            and "equippedCompanionAccessoryIds"
            in final_inventory,

        "catálogo como fonte":
            "getCompanionAccessories()"
            in final_inventory,

        "App passa avatar.level":
            "companionLevel={avatar.level}"
            in final_app,

        "A5.4 preservado":
            "toggleCompanionAccessory("
            in final_inventory
            and "accessoryIdsBySlot"
            in final_inventory,

        "legacy preservado":
            "toggleEquip(item.id)"
            in final_inventory,

        "troféus preservados":
            "toggleEquip(trophy.id)"
            in final_inventory,

        "sem localStorage novo no inventário":
            "localStorage"
            not in final_inventory,

        "sem timer":
            "setTimeout("
            not in final_inventory
            and "setInterval("
            not in final_inventory,

        "sem requestAnimationFrame":
            "requestAnimationFrame("
            not in final_inventory,
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
    restore_all()

    print("ERRO:", exc)
    print()
    print("HomeInventory.tsx e App.tsx restaurados.")
    sys.exit(1)


print("=" * 76)
print("CONFIA — PERSONALIZAÇÃO PREMIUM A5.5B")
print("=" * 76)
print()
print("✓ Preview da CONFIA adicionado")
print("✓ Usa a ConfiaCreature real")
print("✓ Usa o nível atual do avatar")
print("✓ Usa os acessórios atualmente equipados")
print("✓ Atualização imediata ao equipar/desativar")
print("✓ Sem duplicação de SVG")
print("✓ Sem usar Avatar.tsx no preview")
print("✓ Sem novo estado de acessórios")
print("✓ Sem novo localStorage")
print("✓ Lógica A5.4 preservada")
print("✓ Itens legacy preservados")
print("✓ Troféus preservados")
print("✓ Sem timers")
print("✓ Sem requestAnimationFrame")
print("✓ Sem dependências")
print()
print("Backups:")
for backup in BACKUPS.values():
    print(f"  {backup}")
print()
print("A5.5B aplicado.")
print("=" * 76)
