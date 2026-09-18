from pathlib import Path
import shutil
import json
import re
import sys

INVENTORY = Path("src/components/HomeInventory.tsx")

LOCALES = {
    "pt": Path("src/locales/pt.json"),
    "en": Path("src/locales/en.json"),
    "es": Path("src/locales/es.json"),
    "fr": Path("src/locales/fr.json"),
}

BACKUPS = {
    INVENTORY:
        Path("/tmp/HomeInventory.tsx.before_companheiro_premium_a5_5a"),
    LOCALES["pt"]:
        Path("/tmp/pt.json.before_companheiro_premium_a5_5a"),
    LOCALES["en"]:
        Path("/tmp/en.json.before_companheiro_premium_a5_5a"),
    LOCALES["es"]:
        Path("/tmp/es.json.before_companheiro_premium_a5_5a"),
    LOCALES["fr"]:
        Path("/tmp/fr.json.before_companheiro_premium_a5_5a"),
}

for path in BACKUPS:
    if not path.exists():
        print(f"ERRO: ficheiro não encontrado: {path}")
        sys.exit(1)

for path, backup in BACKUPS.items():
    shutil.copy2(path, backup)


translations = {
    "pt": {
        "title": "Personaliza a tua CONFIA",
        "subtitle": "Escolhe pequenos detalhes que tornam a tua CONFIA mais tua.",
        "accessoriesTitle": "Acessórios da CONFIA",
        "accessoriesSubtitle": "Os acessórios equipados aparecem na tua companheira.",
        "accessoriesEmpty": "Ainda não tens acessórios para a tua CONFIA.",
        "collectionTitle": "A tua coleção",
        "collectionSubtitle": "Objetos que já conquistaste continuam guardados aqui.",
        "trophiesTitle": "Troféus",
        "objectiveCompleted": "Objetivo concluído",
        "equip": "Equipar",
        "equipped": "Equipado",
        "head": "Cabeça",
        "neck": "Pescoço",
        "other": "Acessório",
        "confia_bow_cream": "Laço Creme",
        "confia_scarf_terra": "Lenço Terracota",
        "confia_charm_gold": "Amuleto Dourado",
    },
    "en": {
        "title": "Customise your CONFIA",
        "subtitle": "Choose small details that make your CONFIA feel more like yours.",
        "accessoriesTitle": "CONFIA accessories",
        "accessoriesSubtitle": "Equipped accessories appear on your companion.",
        "accessoriesEmpty": "You do not have any accessories for your CONFIA yet.",
        "collectionTitle": "Your collection",
        "collectionSubtitle": "Objects you have already earned remain safely stored here.",
        "trophiesTitle": "Trophies",
        "objectiveCompleted": "Objective completed",
        "equip": "Equip",
        "equipped": "Equipped",
        "head": "Head",
        "neck": "Neck",
        "other": "Accessory",
        "confia_bow_cream": "Cream Bow",
        "confia_scarf_terra": "Terracotta Scarf",
        "confia_charm_gold": "Golden Charm",
    },
    "es": {
        "title": "Personaliza tu CONFIA",
        "subtitle": "Elige pequeños detalles que hagan que tu CONFIA sea más tuya.",
        "accessoriesTitle": "Accesorios de CONFIA",
        "accessoriesSubtitle": "Los accesorios equipados aparecen en tu compañera.",
        "accessoriesEmpty": "Todavía no tienes accesorios para tu CONFIA.",
        "collectionTitle": "Tu colección",
        "collectionSubtitle": "Los objetos que ya has conseguido siguen guardados aquí.",
        "trophiesTitle": "Trofeos",
        "objectiveCompleted": "Objetivo completado",
        "equip": "Equipar",
        "equipped": "Equipado",
        "head": "Cabeza",
        "neck": "Cuello",
        "other": "Accesorio",
        "confia_bow_cream": "Lazo Crema",
        "confia_scarf_terra": "Bufanda Terracota",
        "confia_charm_gold": "Amuleto Dorado",
    },
    "fr": {
        "title": "Personnalise ta CONFIA",
        "subtitle": "Choisis de petits détails qui rendent ta CONFIA encore plus personnelle.",
        "accessoriesTitle": "Accessoires de CONFIA",
        "accessoriesSubtitle": "Les accessoires équipés apparaissent sur ta compagne.",
        "accessoriesEmpty": "Tu n’as pas encore d’accessoires pour ta CONFIA.",
        "collectionTitle": "Ta collection",
        "collectionSubtitle": "Les objets que tu as déjà obtenus restent conservés ici.",
        "trophiesTitle": "Trophées",
        "objectiveCompleted": "Objectif accompli",
        "equip": "Équiper",
        "equipped": "Équipé",
        "head": "Tête",
        "neck": "Cou",
        "other": "Accessoire",
        "confia_bow_cream": "Nœud Crème",
        "confia_scarf_terra": "Écharpe Terracotta",
        "confia_charm_gold": "Amulette Dorée",
    },
}


def restore_all():
    for path, backup in BACKUPS.items():
        shutil.copy2(backup, path)


try:

    # ==========================================================
    # 1. TRADUÇÕES
    # ==========================================================

    for lang, path in LOCALES.items():
        src = path.read_text(encoding="utf-8")

        if '"companionCustomization"' in src:
            raise RuntimeError(
                f"{lang}: companionCustomization já existe."
            )

        data = translations[lang]

        block = (
            '  "companionCustomization": {\n'
            f'    "title": {json.dumps(data["title"], ensure_ascii=False)},\n'
            f'    "subtitle": {json.dumps(data["subtitle"], ensure_ascii=False)},\n'
            f'    "accessoriesTitle": {json.dumps(data["accessoriesTitle"], ensure_ascii=False)},\n'
            f'    "accessoriesSubtitle": {json.dumps(data["accessoriesSubtitle"], ensure_ascii=False)},\n'
            f'    "accessoriesEmpty": {json.dumps(data["accessoriesEmpty"], ensure_ascii=False)},\n'
            f'    "collectionTitle": {json.dumps(data["collectionTitle"], ensure_ascii=False)},\n'
            f'    "collectionSubtitle": {json.dumps(data["collectionSubtitle"], ensure_ascii=False)},\n'
            f'    "trophiesTitle": {json.dumps(data["trophiesTitle"], ensure_ascii=False)},\n'
            f'    "objectiveCompleted": {json.dumps(data["objectiveCompleted"], ensure_ascii=False)},\n'
            f'    "equip": {json.dumps(data["equip"], ensure_ascii=False)},\n'
            f'    "equipped": {json.dumps(data["equipped"], ensure_ascii=False)},\n'
            '    "slots": {\n'
            f'      "head": {json.dumps(data["head"], ensure_ascii=False)},\n'
            f'      "neck": {json.dumps(data["neck"], ensure_ascii=False)},\n'
            f'      "other": {json.dumps(data["other"], ensure_ascii=False)}\n'
            '    },\n'
            '    "items": {\n'
            f'      "confia_bow_cream": {json.dumps(data["confia_bow_cream"], ensure_ascii=False)},\n'
            f'      "confia_scarf_terra": {json.dumps(data["confia_scarf_terra"], ensure_ascii=False)},\n'
            f'      "confia_charm_gold": {json.dumps(data["confia_charm_gold"], ensure_ascii=False)}\n'
            '    }\n'
            '  },\n'
        )

        # Inserir depois da primeira chave global "inventory".
        pattern = r'(^  "inventory":\s*".*?",\s*$)'

        match = re.search(
            pattern,
            src,
            flags=re.MULTILINE
        )

        if not match:
            raise RuntimeError(
                f"{lang}: chave global inventory não encontrada."
            )

        src = (
            src[:match.end()]
            + "\n"
            + block
            + src[match.end():]
        )

        # Validar JSON antes de gravar.
        json.loads(src)

        path.write_text(
            src,
            encoding="utf-8"
        )

    # ==========================================================
    # 2. NOVO HOME INVENTORY VISUAL
    # ==========================================================

    inventory_src = '''import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  homeItems,
  getCompanionAccessories,
  isCompanionAccessory,
} from "../data/homeItems";

import {
  getInventory,
  getEquipped,
  toggleEquip,
  toggleCompanionAccessory,
} from "../storage/homeInventory";

import { getWeeklyTrophies } from "../storage/weeklyTrophies";

interface HomeInventoryProps {
  onBack: () => void;
}

/**
 * ============================================================
 * CONFIA — PERSONALIZAÇÃO PREMIUM A5.5A
 * ============================================================
 *
 * A mochila antiga passa a ser uma área de personalização.
 *
 * A lógica A5.4 mantém-se:
 * - home_inventory preservado
 * - home_equipped preservado
 * - acessórios por slot preservados
 * - itens legacy preservados
 * - troféus preservados
 *
 * Este passo altera apenas apresentação e organização.
 */
const HomeInventory: React.FC<HomeInventoryProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const [, setRefresh] = useState(0);

  const inventory = getInventory();
  const equipped = getEquipped();

  const items = homeItems.filter(item =>
    inventory.includes(item.id)
  );

  const companionItems =
    items.filter(isCompanionAccessory);

  const legacyItems =
    items.filter(item => !isCompanionAccessory(item));

  const weeklyTrophies = getWeeklyTrophies();

  /**
   * A5.4 — acessórios da CONFIA agrupados por slot.
   *
   * Continua derivado diretamente do catálogo.
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

  const getSlotLabel = (
    slot?: string
  ): string => {
    if (slot === "head") {
      return t(
        "companionCustomization.slots.head"
      );
    }

    if (slot === "neck") {
      return t(
        "companionCustomization.slots.neck"
      );
    }

    return t(
      "companionCustomization.slots.other"
    );
  };

  const getAccessoryName = (
    id: string
  ): string =>
    t(`companionCustomization.items.${id}`);

  return (
    <div className="space-y-7 pb-8">

      {/* =====================================================
          CABEÇALHO
      ===================================================== */}

      <div className="relative overflow-hidden rounded-[30px] border border-[#E7D8CC] bg-gradient-to-br from-[#FFF9F3] via-white to-[#F8ECE4] px-5 pb-6 pt-5 shadow-[0_14px_36px_rgba(118,81,67,0.09)]">

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-[#E9B99F]/20 blur-2xl"
        />

        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#E7D8CC] bg-white/80 text-xl text-[#654A42] shadow-sm"
        >
          ←
        </button>

        <div className="relative mt-5 text-center">

          <div
            aria-hidden="true"
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#E7CDBD] bg-white/80 text-3xl shadow-sm"
          >
            ✦
          </div>

          <h1 className="mt-4 text-xl font-extrabold tracking-tight text-[#4E3B36]">
            {t("companionCustomization.title")}
          </h1>

          <p className="mx-auto mt-2 max-w-[310px] text-sm leading-relaxed text-[#826D65]">
            {t("companionCustomization.subtitle")}
          </p>

        </div>
      </div>

      {/* =====================================================
          ACESSÓRIOS DA CONFIA
      ===================================================== */}

      <section className="space-y-4">

        <div className="px-1">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="text-lg"
            >
              ✦
            </span>

            <h2 className="font-extrabold text-[#4E3B36]">
              {t(
                "companionCustomization.accessoriesTitle"
              )}
            </h2>
          </div>

          <p className="mt-1 text-sm leading-relaxed text-[#8A756D]">
            {t(
              "companionCustomization.accessoriesSubtitle"
            )}
          </p>
        </div>

        {companionItems.length === 0 ? (

          <div className="rounded-[24px] border border-dashed border-[#DFC8B9] bg-[#FFF9F5] px-5 py-7 text-center">
            <div
              aria-hidden="true"
              className="text-3xl"
            >
              ✧
            </div>

            <p className="mt-2 text-sm font-medium text-[#8A756D]">
              {t(
                "companionCustomization.accessoriesEmpty"
              )}
            </p>
          </div>

        ) : (

          <div className="grid grid-cols-2 gap-3">

            {companionItems.map(item => {
              const isEquipped =
                equipped.includes(item.id);

              return (
                <div
                  key={item.id}
                  className={`relative overflow-hidden rounded-[24px] border p-4 transition-colors ${
                    isEquipped
                      ? "border-[#D6A283] bg-[#FFF7F1] shadow-[0_10px_24px_rgba(177,112,82,0.12)]"
                      : "border-[#E9DDD5] bg-white shadow-[0_8px_22px_rgba(92,67,58,0.06)]"
                  }`}
                >

                  {isEquipped && (
                    <div className="absolute right-3 top-3 rounded-full bg-[#C87960] px-2.5 py-1 text-[10px] font-extrabold text-white">
                      {t(
                        "companionCustomization.equipped"
                      )}
                    </div>
                  )}

                  <div className="flex h-16 w-16 items-center justify-center rounded-[20px] border border-[#EFE0D6] bg-gradient-to-br from-[#FFFDFB] to-[#F8E9DF] text-4xl shadow-inner">
                    {item.emoji}
                  </div>

                  <div className="mt-4 min-h-[58px]">
                    <p className="pr-1 text-sm font-extrabold leading-snug text-[#4E3B36]">
                      {getAccessoryName(item.id)}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-[#B07760]">
                      {getSlotLabel(
                        item.companionSlot
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (
                        item.companionSlot
                      ) {
                        toggleCompanionAccessory(
                          item.id,
                          item.companionSlot,
                          accessoryIdsBySlot
                        );
                      }

                      setRefresh(v => v + 1);
                    }}
                    className={`mt-3 w-full rounded-xl px-3 py-2.5 text-xs font-extrabold transition-colors ${
                      isEquipped
                        ? "bg-[#C87960] text-white"
                        : "bg-[#F2E8E1] text-[#684F46]"
                    }`}
                  >
                    {isEquipped
                      ? `✓ ${t(
                          "companionCustomization.equipped"
                        )}`
                      : t(
                          "companionCustomization.equip"
                        )}
                  </button>

                </div>
              );
            })}

          </div>
        )}

      </section>

      {/* =====================================================
          COLEÇÃO LEGACY
      ===================================================== */}

      {legacyItems.length > 0 && (

        <section className="space-y-4">

          <div className="px-1">
            <h2 className="font-extrabold text-[#4E3B36]">
              {t(
                "companionCustomization.collectionTitle"
              )}
            </h2>

            <p className="mt-1 text-sm leading-relaxed text-[#8A756D]">
              {t(
                "companionCustomization.collectionSubtitle"
              )}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">

            {legacyItems.map(item => {
              const isEquipped =
                equipped.includes(item.id);

              return (
                <div
                  key={item.id}
                  className={`rounded-[20px] border p-3 text-center ${
                    isEquipped
                      ? "border-[#D8B19A] bg-[#FFF8F3]"
                      : "border-[#EDE3DD] bg-white"
                  }`}
                >

                  <div className="text-4xl">
                    {item.emoji}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      toggleEquip(item.id);
                      setRefresh(v => v + 1);
                    }}
                    className={`mt-3 w-full rounded-lg px-2 py-2 text-[11px] font-bold ${
                      isEquipped
                        ? "bg-[#C87960] text-white"
                        : "bg-[#F1ECE8] text-[#6D5951]"
                    }`}
                  >
                    {isEquipped
                      ? `✓ ${t(
                          "companionCustomization.equipped"
                        )}`
                      : t(
                          "companionCustomization.equip"
                        )}
                  </button>

                </div>
              );
            })}

          </div>

        </section>
      )}

      {/* =====================================================
          TROFÉUS
      ===================================================== */}

      {weeklyTrophies.length > 0 && (

        <section className="space-y-4">

          <div className="px-1">
            <h2 className="font-extrabold text-[#4E3B36]">
              {t(
                "companionCustomization.trophiesTitle"
              )}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">

            {weeklyTrophies.map(trophy => {
              const isEquipped =
                equipped.includes(trophy.id);

              return (
                <div
                  key={trophy.id}
                  className="rounded-[22px] border border-[#E9DED7] bg-white p-4 text-center shadow-[0_8px_20px_rgba(92,67,58,0.05)]"
                >

                  <div className="text-4xl">
                    {trophy.emoji}
                  </div>

                  <p className="mt-3 break-words text-sm font-extrabold text-[#4E3B36]">
                    {trophy.title}
                  </p>

                  <p className="mt-1 text-xs text-[#9A8780]">
                    {t(
                      "companionCustomization.objectiveCompleted"
                    )}
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      toggleEquip(trophy.id);
                      setRefresh(v => v + 1);
                    }}
                    className={`mt-3 w-full rounded-xl py-2 text-xs font-extrabold ${
                      isEquipped
                        ? "bg-[#C87960] text-white"
                        : "bg-[#F1ECE8] text-[#6D5951]"
                    }`}
                  >
                    {isEquipped
                      ? `✓ ${t(
                          "companionCustomization.equipped"
                        )}`
                      : t(
                          "companionCustomization.equip"
                        )}
                  </button>

                </div>
              );
            })}

          </div>

        </section>
      )}

    </div>
  );
};

export default HomeInventory;
'''

    INVENTORY.write_text(
        inventory_src,
        encoding="utf-8"
    )

    # ==========================================================
    # 3. VALIDAÇÕES
    # ==========================================================

    final_inventory = INVENTORY.read_text(
        encoding="utf-8"
    )

    checks = {
        "useTranslation":
            "useTranslation" in final_inventory,

        "secção acessórios":
            "companionItems.map"
            in final_inventory,

        "secção legacy":
            "legacyItems.map"
            in final_inventory,

        "slots A5.4":
            "toggleCompanionAccessory"
            in final_inventory
            and "accessoryIdsBySlot"
            in final_inventory,

        "legacy preservado":
            "toggleEquip(item.id)"
            in final_inventory,

        "troféus preservados":
            "toggleEquip(trophy.id)"
            in final_inventory,

        "sem localStorage direto":
            "localStorage"
            not in final_inventory,

        "sem timers":
            "setTimeout("
            not in final_inventory
            and "setInterval("
            not in final_inventory,

        "sem rAF":
            "requestAnimationFrame("
            not in final_inventory,
    }

    for lang, path in LOCALES.items():
        parsed = json.loads(
            path.read_text(encoding="utf-8")
        )

        checks[f"{lang} companionCustomization"] = (
            "companionCustomization"
            in parsed
        )

        custom = parsed.get(
            "companionCustomization",
            {}
        )

        checks[f"{lang} três acessórios"] = (
            len(custom.get("items", {})) == 3
        )

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
    print("Os 5 ficheiros foram restaurados.")
    sys.exit(1)


print("=" * 76)
print("CONFIA — PERSONALIZAÇÃO PREMIUM A5.5A")
print("=" * 76)
print()
print("✓ Mochila transformada em área de personalização")
print("✓ Acessórios CONFIA em secção premium")
print("✓ Laço Creme identificado")
print("✓ Lenço Terracota identificado")
print("✓ Amuleto Dourado identificado")
print("✓ Slots Cabeça / Pescoço visíveis")
print("✓ Estado Equipado visível")
print("✓ Coleção legacy separada")
print("✓ Troféus preservados")
print("✓ Lógica A5.4 preservada")
print("✓ home_inventory preservado")
print("✓ home_equipped preservado")
print("✓ PT / EN / ES / FR")
print("✓ JSON dos 4 idiomas validado")
print("✓ Sem novo storage")
print("✓ Sem timers")
print("✓ Sem requestAnimationFrame")
print("✓ Sem dependências")
print()
print("Backups:")
for backup in BACKUPS.values():
    print(f"  {backup}")
print()
print("A5.5A aplicado.")
print("=" * 76)
