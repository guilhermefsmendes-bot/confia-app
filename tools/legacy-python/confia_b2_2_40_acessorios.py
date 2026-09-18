from pathlib import Path
import shutil
import re
import json

ROOT = Path.home() / "src"

ITEMS_FILE = ROOT / "data/homeItems.ts"
CREATURE_FILE = ROOT / "components/Companheiro/ConfiaCreature.tsx"
INVENTORY_FILE = ROOT / "components/HomeInventory.tsx"
SHOP_FILE = ROOT / "components/HomeShop.tsx"

LOCALES = {
    "pt": ROOT / "locales/pt.json",
    "en": ROOT / "locales/en.json",
    "es": ROOT / "locales/es.json",
    "fr": ROOT / "locales/fr.json",
}

ALL_FILES = [
    ITEMS_FILE,
    CREATURE_FILE,
    INVENTORY_FILE,
    SHOP_FILE,
    *LOCALES.values(),
]

for path in ALL_FILES:
    if not path.exists():
        raise SystemExit(f"ERRO: ficheiro não encontrado: {path}")

# ============================================================
# BACKUPS
# ============================================================

for path in ALL_FILES:
    backup = Path(str(path) + ".before_b2_2")
    shutil.copy2(path, backup)
    print(f"Backup: {backup}")

# ============================================================
# CATÁLOGO — 40 ACESSÓRIOS
# ============================================================

items = [
    # HEAD — 10
    ("confia_bow_cream", "🎀", 80, "head", 2),
    ("confia_bow_terra", "🎀", 100, "head", 2),
    ("confia_flower_daisy", "🌼", 120, "head", 3),
    ("confia_headband_cream", "〰️", 140, "head", 3),
    ("confia_beret_terra", "🧢", 180, "head", 4),
    ("confia_beanie_cream", "🧶", 220, "head", 5),
    ("confia_hat_garden", "👒", 280, "head", 6),
    ("confia_tiara_star", "⭐", 340, "head", 7),
    ("confia_crown_leaf", "🌿", 420, "head", 8),
    ("confia_crown_gold", "👑", 600, "head", 10),

    # FACE — 5
    ("confia_glasses_round", "👓", 130, "face", 3),
    ("confia_glasses_terra", "👓", 180, "face", 4),
    ("confia_glasses_gold", "👓", 260, "face", 6),
    ("confia_glasses_sun", "🕶️", 330, "face", 7),
    ("confia_glasses_heart", "💗", 460, "face", 9),

    # NECK — 8
    ("confia_scarf_terra", "🧣", 120, "neck", 3),
    ("confia_charm_gold", "✨", 180, "neck", 5),
    ("confia_scarf_cream", "🧣", 150, "neck", 3),
    ("confia_necklace_leaf", "🌿", 200, "neck", 4),
    ("confia_necklace_heart", "💗", 240, "neck", 5),
    ("confia_medal_sun", "☀️", 300, "neck", 6),
    ("confia_collar_star", "⭐", 380, "neck", 8),
    ("confia_pendant_moon", "🌙", 500, "neck", 9),

    # BODY — 6
    ("confia_sash_cream", "🎗️", 180, "body", 4),
    ("confia_bag_terra", "👜", 240, "body", 5),
    ("confia_cape_cream", "🧥", 300, "body", 6),
    ("confia_backpack_terra", "🎒", 360, "body", 7),
    ("confia_cape_star", "✨", 450, "body", 8),
    ("confia_sash_gold", "🏅", 560, "body", 10),

    # HAND — 6
    ("confia_hand_flower", "🌼", 170, "hand", 4),
    ("confia_hand_heart", "💗", 220, "hand", 5),
    ("confia_hand_star", "⭐", 280, "hand", 6),
    ("confia_hand_book", "📖", 340, "hand", 7),
    ("confia_hand_gift", "🎁", 420, "hand", 8),
    ("confia_hand_light", "✨", 540, "hand", 10),

    # AURA — 5
    ("confia_aura_soft", "✨", 230, "aura", 5),
    ("confia_aura_stars", "🌟", 320, "aura", 6),
    ("confia_aura_leaves", "🍃", 400, "aura", 7),
    ("confia_aura_moons", "🌙", 480, "aura", 9),
    ("confia_aura_gold", "✨", 700, "aura", 10),
]

assert len(items) == 40

# ============================================================
# 1. homeItems.ts
# ============================================================

text = ITEMS_FILE.read_text(encoding="utf-8")

# Adicionar face ao union se ainda não existir
old_slots = '''export type CompanionAccessorySlot =
  | "head"
  | "neck"
  | "body"
  | "hand"
  | "aura";'''

new_slots = '''export type CompanionAccessorySlot =
  | "head"
  | "face"
  | "neck"
  | "body"
  | "hand"
  | "aura";'''

if old_slots in text:
    text = text.replace(old_slots, new_slots, 1)
elif '| "face"' not in text:
    raise SystemExit("ERRO: não encontrei CompanionAccessorySlot.")

catalog_lines = [
    "export const homeItems: HomeItem[] = [",
    "  // B2.2 — coleção premium da CONFIA",
]

for item_id, emoji, cost, slot, level in items:
    catalog_lines.extend([
        "  {",
        f'    id: "{item_id}",',
        f'    emoji: "{emoji}",',
        f"    cost: {cost},",
        '    category: "companion",',
        '    companionKind: "accessory",',
        f'    companionSlot: "{slot}",',
        f"    minCompanionLevel: {level}",
        "  },",
    ])

catalog_lines.append("];")
new_catalog = "\n".join(catalog_lines)

start = text.find("export const homeItems: HomeItem[] = [")
end_marker = "\n\n/**\n * ==========================================================\n * A5.1 — CAMADA DE COMPATIBILIDADE"
end = text.find(end_marker, start)

if start == -1 or end == -1:
    raise SystemExit("ERRO: limites do catálogo não encontrados.")

text = text[:start] + new_catalog + text[end:]
ITEMS_FILE.write_text(text, encoding="utf-8")

# ============================================================
# 2. HomeInventory — labels de todos os slots
# ============================================================

text = INVENTORY_FILE.read_text(encoding="utf-8")

start = text.find("  const getSlotLabel = (")
end = text.find("\n\n  const getAccessoryName", start)

if start == -1 or end == -1:
    raise SystemExit("ERRO: getSlotLabel não encontrado em HomeInventory.")

new_get_slot = '''  const getSlotLabel = (
    slot?: string
  ): string => {
    const slotKey =
      slot === "head" ||
      slot === "face" ||
      slot === "neck" ||
      slot === "body" ||
      slot === "hand" ||
      slot === "aura"
        ? slot
        : "other";

    return t(
      `companionCustomization.slots.${slotKey}`
    );
  };'''

text = text[:start] + new_get_slot + text[end:]
INVENTORY_FILE.write_text(text, encoding="utf-8")

# ============================================================
# 3. HomeShop — labels de todos os slots
# ============================================================

text = SHOP_FILE.read_text(encoding="utf-8")

old = '''    const slotLabel =
      item.companionSlot === "head"
        ? t("companionCustomization.slots.head")
        : item.companionSlot === "neck"
          ? t("companionCustomization.slots.neck")
          : t("companionCustomization.slots.other");'''

new = '''    const slotKey =
      item.companionSlot === "head" ||
      item.companionSlot === "face" ||
      item.companionSlot === "neck" ||
      item.companionSlot === "body" ||
      item.companionSlot === "hand" ||
      item.companionSlot === "aura"
        ? item.companionSlot
        : "other";

    const slotLabel =
      t(`companionCustomization.slots.${slotKey}`);'''

if old not in text:
    raise SystemExit("ERRO: slotLabel não encontrado em HomeShop.")

text = text.replace(old, new, 1)
SHOP_FILE.write_text(text, encoding="utf-8")

# ============================================================
# 4. TRADUÇÕES
# ============================================================

translations = {
    "pt": {
        "slots": {
            "head": "Cabeça",
            "face": "Rosto",
            "neck": "Pescoço",
            "body": "Corpo",
            "hand": "Mão",
            "aura": "Aura",
            "other": "Acessório",
        },
        "items": {
            "confia_bow_cream": "Laço Creme",
            "confia_bow_terra": "Laço Terracota",
            "confia_flower_daisy": "Margarida",
            "confia_headband_cream": "Fita Creme",
            "confia_beret_terra": "Boina Terracota",
            "confia_beanie_cream": "Gorro Creme",
            "confia_hat_garden": "Chapéu de Jardim",
            "confia_tiara_star": "Tiara Estrela",
            "confia_crown_leaf": "Coroa de Folhas",
            "confia_crown_gold": "Coroa Dourada",
            "confia_glasses_round": "Óculos Redondos",
            "confia_glasses_terra": "Óculos Terracota",
            "confia_glasses_gold": "Óculos Dourados",
            "confia_glasses_sun": "Óculos de Sol",
            "confia_glasses_heart": "Óculos Coração",
            "confia_scarf_terra": "Lenço Terracota",
            "confia_charm_gold": "Amuleto Dourado",
            "confia_scarf_cream": "Lenço Creme",
            "confia_necklace_leaf": "Colar Folha",
            "confia_necklace_heart": "Colar Coração",
            "confia_medal_sun": "Medalhão Sol",
            "confia_collar_star": "Colar Estrela",
            "confia_pendant_moon": "Pendente Lua",
            "confia_sash_cream": "Faixa Creme",
            "confia_bag_terra": "Bolsa Terracota",
            "confia_cape_cream": "Capa Creme",
            "confia_backpack_terra": "Mochila Terracota",
            "confia_cape_star": "Capa Estrelada",
            "confia_sash_gold": "Faixa Dourada",
            "confia_hand_flower": "Flor",
            "confia_hand_heart": "Coração",
            "confia_hand_star": "Estrela",
            "confia_hand_book": "Livro",
            "confia_hand_gift": "Presente",
            "confia_hand_light": "Luz",
            "confia_aura_soft": "Brilho Suave",
            "confia_aura_stars": "Aura de Estrelas",
            "confia_aura_leaves": "Aura de Folhas",
            "confia_aura_moons": "Aura Lunar",
            "confia_aura_gold": "Aura Dourada",
        },
    },
    "en": {
        "slots": {
            "head": "Head",
            "face": "Face",
            "neck": "Neck",
            "body": "Body",
            "hand": "Hand",
            "aura": "Aura",
            "other": "Accessory",
        },
        "items": {
            "confia_bow_cream": "Cream Bow",
            "confia_bow_terra": "Terracotta Bow",
            "confia_flower_daisy": "Daisy",
            "confia_headband_cream": "Cream Headband",
            "confia_beret_terra": "Terracotta Beret",
            "confia_beanie_cream": "Cream Beanie",
            "confia_hat_garden": "Garden Hat",
            "confia_tiara_star": "Star Tiara",
            "confia_crown_leaf": "Leaf Crown",
            "confia_crown_gold": "Golden Crown",
            "confia_glasses_round": "Round Glasses",
            "confia_glasses_terra": "Terracotta Glasses",
            "confia_glasses_gold": "Golden Glasses",
            "confia_glasses_sun": "Sunglasses",
            "confia_glasses_heart": "Heart Glasses",
            "confia_scarf_terra": "Terracotta Scarf",
            "confia_charm_gold": "Golden Charm",
            "confia_scarf_cream": "Cream Scarf",
            "confia_necklace_leaf": "Leaf Necklace",
            "confia_necklace_heart": "Heart Necklace",
            "confia_medal_sun": "Sun Medallion",
            "confia_collar_star": "Star Necklace",
            "confia_pendant_moon": "Moon Pendant",
            "confia_sash_cream": "Cream Sash",
            "confia_bag_terra": "Terracotta Bag",
            "confia_cape_cream": "Cream Cape",
            "confia_backpack_terra": "Terracotta Backpack",
            "confia_cape_star": "Star Cape",
            "confia_sash_gold": "Golden Sash",
            "confia_hand_flower": "Flower",
            "confia_hand_heart": "Heart",
            "confia_hand_star": "Star",
            "confia_hand_book": "Book",
            "confia_hand_gift": "Gift",
            "confia_hand_light": "Light",
            "confia_aura_soft": "Soft Glow",
            "confia_aura_stars": "Star Aura",
            "confia_aura_leaves": "Leaf Aura",
            "confia_aura_moons": "Moon Aura",
            "confia_aura_gold": "Golden Aura",
        },
    },
    "es": {
        "slots": {
            "head": "Cabeza",
            "face": "Rostro",
            "neck": "Cuello",
            "body": "Cuerpo",
            "hand": "Mano",
            "aura": "Aura",
            "other": "Accesorio",
        },
        "items": {
            "confia_bow_cream": "Lazo Crema",
            "confia_bow_terra": "Lazo Terracota",
            "confia_flower_daisy": "Margarita",
            "confia_headband_cream": "Cinta Crema",
            "confia_beret_terra": "Boina Terracota",
            "confia_beanie_cream": "Gorro Crema",
            "confia_hat_garden": "Sombrero de Jardín",
            "confia_tiara_star": "Tiara Estrella",
            "confia_crown_leaf": "Corona de Hojas",
            "confia_crown_gold": "Corona Dorada",
            "confia_glasses_round": "Gafas Redondas",
            "confia_glasses_terra": "Gafas Terracota",
            "confia_glasses_gold": "Gafas Doradas",
            "confia_glasses_sun": "Gafas de Sol",
            "confia_glasses_heart": "Gafas Corazón",
            "confia_scarf_terra": "Bufanda Terracota",
            "confia_charm_gold": "Amuleto Dorado",
            "confia_scarf_cream": "Bufanda Crema",
            "confia_necklace_leaf": "Collar Hoja",
            "confia_necklace_heart": "Collar Corazón",
            "confia_medal_sun": "Medallón Sol",
            "confia_collar_star": "Collar Estrella",
            "confia_pendant_moon": "Colgante Luna",
            "confia_sash_cream": "Banda Crema",
            "confia_bag_terra": "Bolso Terracota",
            "confia_cape_cream": "Capa Crema",
            "confia_backpack_terra": "Mochila Terracota",
            "confia_cape_star": "Capa Estrellada",
            "confia_sash_gold": "Banda Dorada",
            "confia_hand_flower": "Flor",
            "confia_hand_heart": "Corazón",
            "confia_hand_star": "Estrella",
            "confia_hand_book": "Libro",
            "confia_hand_gift": "Regalo",
            "confia_hand_light": "Luz",
            "confia_aura_soft": "Brillo Suave",
            "confia_aura_stars": "Aura de Estrellas",
            "confia_aura_leaves": "Aura de Hojas",
            "confia_aura_moons": "Aura Lunar",
            "confia_aura_gold": "Aura Dorada",
        },
    },
    "fr": {
        "slots": {
            "head": "Tête",
            "face": "Visage",
            "neck": "Cou",
            "body": "Corps",
            "hand": "Main",
            "aura": "Aura",
            "other": "Accessoire",
        },
        "items": {
            "confia_bow_cream": "Nœud Crème",
            "confia_bow_terra": "Nœud Terracotta",
            "confia_flower_daisy": "Marguerite",
            "confia_headband_cream": "Bandeau Crème",
            "confia_beret_terra": "Béret Terracotta",
            "confia_beanie_cream": "Bonnet Crème",
            "confia_hat_garden": "Chapeau de Jardin",
            "confia_tiara_star": "Tiare Étoile",
            "confia_crown_leaf": "Couronne de Feuilles",
            "confia_crown_gold": "Couronne Dorée",
            "confia_glasses_round": "Lunettes Rondes",
            "confia_glasses_terra": "Lunettes Terracotta",
            "confia_glasses_gold": "Lunettes Dorées",
            "confia_glasses_sun": "Lunettes de Soleil",
            "confia_glasses_heart": "Lunettes Cœur",
            "confia_scarf_terra": "Écharpe Terracotta",
            "confia_charm_gold": "Amulette Dorée",
            "confia_scarf_cream": "Écharpe Crème",
            "confia_necklace_leaf": "Collier Feuille",
            "confia_necklace_heart": "Collier Cœur",
            "confia_medal_sun": "Médaillon Soleil",
            "confia_collar_star": "Collier Étoile",
            "confia_pendant_moon": "Pendentif Lune",
            "confia_sash_cream": "Écharpe Crème",
            "confia_bag_terra": "Sac Terracotta",
            "confia_cape_cream": "Cape Crème",
            "confia_backpack_terra": "Sac à Dos Terracotta",
            "confia_cape_star": "Cape Étoilée",
            "confia_sash_gold": "Écharpe Dorée",
            "confia_hand_flower": "Fleur",
            "confia_hand_heart": "Cœur",
            "confia_hand_star": "Étoile",
            "confia_hand_book": "Livre",
            "confia_hand_gift": "Cadeau",
            "confia_hand_light": "Lumière",
            "confia_aura_soft": "Lueur Douce",
            "confia_aura_stars": "Aura d’Étoiles",
            "confia_aura_leaves": "Aura de Feuilles",
            "confia_aura_moons": "Aura Lunaire",
            "confia_aura_gold": "Aura Dorée",
        },
    },
}

for lang, path in LOCALES.items():
    data = json.loads(path.read_text(encoding="utf-8"))

    if "companionCustomization" not in data:
        raise SystemExit(
            f"ERRO: companionCustomization não encontrado em {lang}"
        )

    data["companionCustomization"]["slots"] = \
        translations[lang]["slots"]

    data["companionCustomization"]["items"] = \
        translations[lang]["items"]

    path.write_text(
        json.dumps(
            data,
            ensure_ascii=False,
            indent=2
        ) + "\n",
        encoding="utf-8",
    )

# ============================================================
# 5. ConfiaCreature — preparação dos IDs
# ============================================================

text = CREATURE_FILE.read_text(encoding="utf-8")

old = '''  const hasGoldCharm =
    equippedAccessoryIds.includes(
      "confia_charm_gold"
    );

'''

new = '''  const hasGoldCharm =
    equippedAccessoryIds.includes(
      "confia_charm_gold"
    );

  /**
   * B2.2 — consulta simples aos acessórios equipados.
   *
   * Sem estado React.
   * Sem efeitos.
   * Sem timers.
   */
  const hasAccessory = (id: string) =>
    equippedAccessoryIds.includes(id);

'''

if old not in text:
    raise SystemExit(
        "ERRO: ponto de inserção hasAccessory não encontrado."
    )

text = text.replace(old, new, 1)

# ============================================================
# 6. CAMADA TRASEIRA
# ============================================================

body_marker = '''            {/* ===============================================
                CORPO PRINCIPAL

                Cabeça/corpo contínuos para criar uma
                silhueta imediatamente reconhecível.
            =============================================== */}'''

if body_marker not in text:
    raise SystemExit(
        "ERRO: marcador CORPO PRINCIPAL não encontrado."
    )

rear_layer = r'''
            {/* ===============================================
                B2.2 — ACESSÓRIOS TRASEIROS

                Auras, capas e mochila ficam atrás do corpo.
            =============================================== */}

            {!isEgg && (
              <g aria-hidden="true">

                {hasAccessory("confia_aura_soft") && (
                  <g transform={auraAccessoryTransform}>
                    <ellipse
                      cx="110"
                      cy="126"
                      rx="72"
                      ry="82"
                      fill="none"
                      stroke="#F2D7BD"
                      strokeWidth="5"
                      opacity="0.32"
                    />
                  </g>
                )}

                {hasAccessory("confia_aura_stars") && (
                  <g transform={auraAccessoryTransform}>
                    <circle cx="48" cy="90" r="3" fill="#E5B85E" />
                    <circle cx="169" cy="78" r="2.8" fill="#E5B85E" />
                    <circle cx="178" cy="145" r="3.2" fill="#E5B85E" />
                    <circle cx="43" cy="151" r="2.5" fill="#E5B85E" />
                    <path d="M55 55 l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#F0D58A" />
                  </g>
                )}

                {hasAccessory("confia_aura_leaves") && (
                  <g transform={auraAccessoryTransform}>
                    <ellipse cx="45" cy="108" rx="5" ry="10" fill="#A8B58A" transform="rotate(-35 45 108)" />
                    <ellipse cx="175" cy="115" rx="5" ry="10" fill="#8EA474" transform="rotate(35 175 115)" />
                    <ellipse cx="58" cy="165" rx="4" ry="8" fill="#B2BD96" transform="rotate(30 58 165)" />
                    <ellipse cx="161" cy="54" rx="4" ry="8" fill="#9AAA7E" transform="rotate(-30 161 54)" />
                  </g>
                )}

                {hasAccessory("confia_aura_moons") && (
                  <g transform={auraAccessoryTransform}>
                    <path d="M43 84 C35 75 39 62 50 59 C45 67 47 77 56 81 C51 86 47 87 43 84Z" fill="#E8D9AA" />
                    <path d="M170 144 C162 135 166 122 177 119 C172 127 174 137 183 141 C178 146 174 147 170 144Z" fill="#E8D9AA" />
                    <circle cx="168" cy="70" r="2.5" fill="#F0D58A" />
                  </g>
                )}

                {hasAccessory("confia_aura_gold") && (
                  <g transform={auraAccessoryTransform}>
                    <ellipse
                      cx="110"
                      cy="126"
                      rx="78"
                      ry="88"
                      fill="none"
                      stroke="#D6AC52"
                      strokeWidth="4"
                      opacity="0.42"
                    />
                    <circle cx="42" cy="82" r="3.5" fill="#F1D37B" />
                    <circle cx="177" cy="94" r="3.5" fill="#F1D37B" />
                    <circle cx="161" cy="176" r="3" fill="#F1D37B" />
                    <circle cx="59" cy="174" r="3" fill="#F1D37B" />
                  </g>
                )}

                {hasAccessory("confia_cape_cream") && (
                  <g transform={bodyAccessoryTransform}>
                    <path
                      d="M77 119 Q110 105 143 119 L151 174 Q110 193 69 174 Z"
                      fill="#F5E5D4"
                      stroke="#C48B72"
                      strokeWidth="2"
                    />
                  </g>
                )}

                {hasAccessory("confia_backpack_terra") && (
                  <g transform={bodyAccessoryTransform}>
                    <rect
                      x="132"
                      y="125"
                      width="31"
                      height="43"
                      rx="12"
                      fill="#B96D57"
                      stroke="#925040"
                      strokeWidth="2"
                    />
                    <path
                      d="M135 137 Q147 126 160 137"
                      fill="none"
                      stroke="#F0C4AA"
                      strokeWidth="2"
                    />
                  </g>
                )}

                {hasAccessory("confia_cape_star") && (
                  <g transform={bodyAccessoryTransform}>
                    <path
                      d="M76 118 Q110 103 144 118 L154 176 Q110 196 66 176 Z"
                      fill="#B98278"
                      stroke="#855850"
                      strokeWidth="2"
                    />
                    <path
                      d="M110 141 l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"
                      fill="#F6E5AE"
                    />
                  </g>
                )}

              </g>
            )}

'''

text = text.replace(
    body_marker,
    rear_layer + body_marker,
    1
)

# ============================================================
# 7. SUBSTITUIR BLOCO FRONTAL A5.3
# ============================================================

front_start = text.find(
    "        {/* ===================================================\n"
    "            A5.3 — ACESSÓRIOS DA CONFIA"
)

if front_start == -1:
    raise SystemExit(
        "ERRO: início do bloco A5.3 não encontrado."
    )

front_end = text.find(
    "\n      </svg>",
    front_start
)

if front_end == -1:
    raise SystemExit(
        "ERRO: fim do SVG não encontrado."
    )

front_layer = r'''        {/* ===================================================
            B2.2 — ACESSÓRIOS FRONTAIS DA CONFIA

            Todos usam SVG estático e âncoras adaptativas.
        =================================================== */}

        {!isEgg && (
          <g aria-hidden="true">

            {/* HEAD */}

            {hasCreamBow && (
              <g transform={`${headAccessoryTransform} translate(0 1)`}>
                <path d="M78 55 C68 48 62 51 64 59 C66 66 72 68 80 62 Z" fill="#F6E6D7" stroke="#B86F5B" strokeWidth="2" />
                <path d="M82 56 C91 49 97 52 95 60 C93 67 87 68 80 62 Z" fill="#F6E6D7" stroke="#B86F5B" strokeWidth="2" />
                <ellipse cx="80" cy="60" rx="5.5" ry="5" fill="#D99A78" stroke="#B86F5B" strokeWidth="1.6" />
              </g>
            )}

            {hasAccessory("confia_bow_terra") && (
              <g transform={headAccessoryTransform}>
                <path d="M137 57 C147 49 154 52 152 61 C150 67 144 69 136 63 Z" fill="#C97861" stroke="#9D5748" strokeWidth="2" />
                <path d="M133 57 C124 50 118 53 120 61 C122 67 128 69 136 63 Z" fill="#D88C72" stroke="#9D5748" strokeWidth="2" />
                <circle cx="136" cy="62" r="5" fill="#A95F4E" />
              </g>
            )}

            {hasAccessory("confia_flower_daisy") && (
              <g transform={headAccessoryTransform}>
                <circle cx="74" cy="62" r="5" fill="#E4AD57" />
                <circle cx="74" cy="53" r="5" fill="#FFF7E8" />
                <circle cx="82" cy="58" r="5" fill="#FFF7E8" />
                <circle cx="81" cy="67" r="5" fill="#FFF7E8" />
                <circle cx="67" cy="67" r="5" fill="#FFF7E8" />
                <circle cx="66" cy="58" r="5" fill="#FFF7E8" />
              </g>
            )}

            {hasAccessory("confia_headband_cream") && (
              <g transform={headAccessoryTransform}>
                <path d="M70 71 Q110 43 150 71" fill="none" stroke="#F3E1CE" strokeWidth="6" strokeLinecap="round" />
              </g>
            )}

            {hasAccessory("confia_beret_terra") && (
              <g transform={headAccessoryTransform}>
                <ellipse cx="105" cy="58" rx="37" ry="15" fill="#B96D57" stroke="#914C3F" strokeWidth="2" />
                <path d="M104 48 Q108 40 116 44" fill="none" stroke="#914C3F" strokeWidth="3" strokeLinecap="round" />
              </g>
            )}

            {hasAccessory("confia_beanie_cream") && (
              <g transform={headAccessoryTransform}>
                <path d="M73 66 Q75 39 110 38 Q145 39 147 66 Z" fill="#F0DDC8" stroke="#BA806A" strokeWidth="2" />
                <rect x="72" y="60" width="76" height="12" rx="6" fill="#E7CBB4" />
                <circle cx="110" cy="34" r="7" fill="#E7CBB4" />
              </g>
            )}

            {hasAccessory("confia_hat_garden") && (
              <g transform={headAccessoryTransform}>
                <ellipse cx="110" cy="65" rx="52" ry="10" fill="#E5C78D" stroke="#AB8651" strokeWidth="2" />
                <path d="M82 62 Q85 34 110 34 Q135 34 138 62 Z" fill="#EED8A6" stroke="#AB8651" strokeWidth="2" />
                <path d="M134 50 Q145 45 151 53" fill="none" stroke="#9AA873" strokeWidth="3" />
              </g>
            )}

            {hasAccessory("confia_tiara_star") && (
              <g transform={headAccessoryTransform}>
                <path d="M76 68 Q110 47 144 68" fill="none" stroke="#C89545" strokeWidth="3" />
                <path d="M110 43 l4 8 9 1-7 6 2 9-8-4-8 4 2-9-7-6 9-1z" fill="#F1D17D" stroke="#B88735" strokeWidth="1.5" />
              </g>
            )}

            {hasAccessory("confia_crown_leaf") && (
              <g transform={headAccessoryTransform}>
                <path d="M73 65 Q110 45 147 65" fill="none" stroke="#8C9D70" strokeWidth="3" />
                <ellipse cx="85" cy="57" rx="5" ry="10" fill="#AAB98B" transform="rotate(-35 85 57)" />
                <ellipse cx="100" cy="51" rx="5" ry="10" fill="#91A373" transform="rotate(-15 100 51)" />
                <ellipse cx="120" cy="51" rx="5" ry="10" fill="#AAB98B" transform="rotate(15 120 51)" />
                <ellipse cx="136" cy="57" rx="5" ry="10" fill="#91A373" transform="rotate(35 136 57)" />
              </g>
            )}

            {hasAccessory("confia_crown_gold") && (
              <g transform={headAccessoryTransform}>
                <path d="M76 65 L84 39 L100 55 L110 32 L121 55 L138 39 L145 65 Z" fill="#E6BE62" stroke="#A97828" strokeWidth="2" />
                <circle cx="110" cy="47" r="4" fill="#FFF2B8" />
              </g>
            )}

            {/* FACE */}

            {hasAccessory("confia_glasses_round") && (
              <g transform={headAccessoryTransform}>
                <circle cx="87" cy="91" r="12" fill="none" stroke="#6D514A" strokeWidth="2.5" />
                <circle cx="133" cy="91" r="12" fill="none" stroke="#6D514A" strokeWidth="2.5" />
                <path d="M99 91 Q110 86 121 91" fill="none" stroke="#6D514A" strokeWidth="2.5" />
              </g>
            )}

            {hasAccessory("confia_glasses_terra") && (
              <g transform={headAccessoryTransform}>
                <rect x="73" y="81" width="28" height="20" rx="8" fill="none" stroke="#B96D57" strokeWidth="3" />
                <rect x="119" y="81" width="28" height="20" rx="8" fill="none" stroke="#B96D57" strokeWidth="3" />
                <path d="M101 89 Q110 85 119 89" fill="none" stroke="#B96D57" strokeWidth="3" />
              </g>
            )}

            {hasAccessory("confia_glasses_gold") && (
              <g transform={headAccessoryTransform}>
                <circle cx="87" cy="91" r="13" fill="none" stroke="#C89A45" strokeWidth="3" />
                <circle cx="133" cy="91" r="13" fill="none" stroke="#C89A45" strokeWidth="3" />
                <path d="M100 91 H120" stroke="#C89A45" strokeWidth="3" />
              </g>
            )}

            {hasAccessory("confia_glasses_sun") && (
              <g transform={headAccessoryTransform}>
                <path d="M72 82 H101 L98 101 Q86 108 76 99 Z" fill="#5B4946" stroke="#3F3331" strokeWidth="2" />
                <path d="M119 82 H148 L144 99 Q134 108 122 101 Z" fill="#5B4946" stroke="#3F3331" strokeWidth="2" />
                <path d="M101 88 Q110 84 119 88" fill="none" stroke="#3F3331" strokeWidth="3" />
              </g>
            )}

            {hasAccessory("confia_glasses_heart") && (
              <g transform={headAccessoryTransform}>
                <path d="M87 102 C69 91 72 78 82 80 C87 81 89 86 89 86 C91 81 97 79 101 83 C108 91 99 99 87 102Z" fill="none" stroke="#C56F76" strokeWidth="3" />
                <path d="M133 102 C115 91 118 78 128 80 C133 81 135 86 135 86 C137 81 143 79 147 83 C154 91 145 99 133 102Z" fill="none" stroke="#C56F76" strokeWidth="3" />
                <path d="M102 88 H118" stroke="#C56F76" strokeWidth="3" />
              </g>
            )}

            {/* NECK */}

            {hasTerraScarf && (
              <g transform={neckAccessoryTransform}>
                <path d="M78 127 Q110 139 142 127 Q139 139 110 143 Q81 139 78 127 Z" fill="#C97861" stroke="#A85C4B" strokeWidth="2" />
                <path d="M124 137 Q134 145 131 160 L121 154 Q125 145 124 137 Z" fill="#B96855" stroke="#A85C4B" strokeWidth="1.7" />
              </g>
            )}

            {hasGoldCharm && (
              <g transform={neckAccessoryTransform}>
                <path d="M91 130 Q110 140 129 130" fill="none" stroke="#C79A45" strokeWidth="2" />
                <circle cx="110" cy="141" r="6" fill="#F2D487" stroke="#B88735" strokeWidth="1.8" />
              </g>
            )}

            {hasAccessory("confia_scarf_cream") && (
              <g transform={neckAccessoryTransform}>
                <path d="M79 127 Q110 139 141 127 Q137 140 110 143 Q83 140 79 127Z" fill="#F1DECB" stroke="#C58B74" strokeWidth="2" />
                <path d="M96 139 Q88 149 91 160 L101 154 Q97 146 96 139Z" fill="#E6CDB8" stroke="#C58B74" strokeWidth="1.7" />
              </g>
            )}

            {hasAccessory("confia_necklace_leaf") && (
              <g transform={neckAccessoryTransform}>
                <path d="M91 130 Q110 141 129 130" fill="none" stroke="#87966C" strokeWidth="2" />
                <ellipse cx="110" cy="143" rx="5" ry="8" fill="#A7B58A" transform="rotate(25 110 143)" />
              </g>
            )}

            {hasAccessory("confia_necklace_heart") && (
              <g transform={neckAccessoryTransform}>
                <path d="M91 130 Q110 141 129 130" fill="none" stroke="#B76D6E" strokeWidth="2" />
                <path d="M110 149 C98 141 101 134 106 135 C109 135 110 138 110 138 C112 135 117 134 119 138 C122 143 116 147 110 149Z" fill="#D98082" />
              </g>
            )}

            {hasAccessory("confia_medal_sun") && (
              <g transform={neckAccessoryTransform}>
                <path d="M92 129 Q110 140 128 129" fill="none" stroke="#B98335" strokeWidth="2" />
                <circle cx="110" cy="143" r="7" fill="#E9B95E" stroke="#B98335" strokeWidth="2" />
                <circle cx="110" cy="143" r="3" fill="#FFF1B1" />
              </g>
            )}

            {hasAccessory("confia_collar_star") && (
              <g transform={neckAccessoryTransform}>
                <path d="M88 130 Q110 143 132 130" fill="none" stroke="#AD7F4B" strokeWidth="2.4" />
                <path d="M110 138 l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="#E8C46D" />
              </g>
            )}

            {hasAccessory("confia_pendant_moon") && (
              <g transform={neckAccessoryTransform}>
                <path d="M92 129 Q110 141 128 129" fill="none" stroke="#AD9568" strokeWidth="2" />
                <path d="M107 138 C101 143 103 152 111 154 C108 150 109 144 115 141 C112 138 110 137 107 138Z" fill="#E9D9A5" />
              </g>
            )}

            {/* BODY */}

            {hasAccessory("confia_sash_cream") && (
              <g transform={bodyAccessoryTransform}>
                <path d="M82 120 Q103 142 139 165" fill="none" stroke="#F0DCC8" strokeWidth="8" strokeLinecap="round" />
              </g>
            )}

            {hasAccessory("confia_bag_terra") && (
              <g transform={bodyAccessoryTransform}>
                <path d="M137 133 Q151 145 151 162" fill="none" stroke="#8F5648" strokeWidth="3" />
                <rect x="140" y="151" width="24" height="23" rx="7" fill="#B96D57" stroke="#8F5648" strokeWidth="2" />
              </g>
            )}

            {hasAccessory("confia_sash_gold") && (
              <g transform={bodyAccessoryTransform}>
                <path d="M81 119 Q104 143 140 167" fill="none" stroke="#D6A94F" strokeWidth="8" strokeLinecap="round" />
                <circle cx="137" cy="164" r="5" fill="#F4D987" />
              </g>
            )}

            {/* HAND — só quando existem braços */}

            {stage >= 3 && hasAccessory("confia_hand_flower") && (
              <g transform={handAccessoryTransform}>
                <path d="M163 147 Q171 135 172 123" fill="none" stroke="#779269" strokeWidth="2" />
                <circle cx="173" cy="120" r="4" fill="#E4AD57" />
                <circle cx="173" cy="113" r="4" fill="#FFF7E8" />
                <circle cx="180" cy="120" r="4" fill="#FFF7E8" />
                <circle cx="173" cy="127" r="4" fill="#FFF7E8" />
                <circle cx="166" cy="120" r="4" fill="#FFF7E8" />
              </g>
            )}

            {stage >= 3 && hasAccessory("confia_hand_heart") && (
              <g transform={handAccessoryTransform}>
                <path d="M169 143 C155 134 158 123 166 124 C170 124 172 129 172 129 C175 124 183 124 185 130 C188 137 179 142 169 143Z" fill="#D97D7D" stroke="#AC5D60" strokeWidth="1.5" />
              </g>
            )}

            {stage >= 3 && hasAccessory("confia_hand_star") && (
              <g transform={handAccessoryTransform}>
                <path d="M171 121 l5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2z" fill="#E8C15F" stroke="#AA7D31" strokeWidth="1.5" />
              </g>
            )}

            {stage >= 3 && hasAccessory("confia_hand_book") && (
              <g transform={handAccessoryTransform}>
                <path d="M151 139 Q163 134 174 141 L174 161 Q163 154 151 160Z" fill="#E7D3B8" stroke="#9F7258" strokeWidth="2" />
                <path d="M174 141 Q185 134 195 139 L195 160 Q184 154 174 161Z" fill="#F3E3CD" stroke="#9F7258" strokeWidth="2" />
              </g>
            )}

            {stage >= 3 && hasAccessory("confia_hand_gift") && (
              <g transform={handAccessoryTransform}>
                <rect x="158" y="137" width="28" height="25" rx="4" fill="#D58D73" stroke="#9F5D4B" strokeWidth="2" />
                <path d="M172 137 V162 M158 147 H186" stroke="#F3D8BD" strokeWidth="3" />
                <path d="M172 137 Q162 128 164 124 Q172 124 174 134 Q177 124 184 125 Q185 131 172 137Z" fill="#F0C7AE" />
              </g>
            )}

            {stage >= 3 && hasAccessory("confia_hand_light") && (
              <g transform={handAccessoryTransform}>
                <circle cx="171" cy="137" r="11" fill="#F5D987" opacity="0.65" />
                <circle cx="171" cy="137" r="5" fill="#FFF3B5" />
                <path d="M171 116 V123 M171 151 V158 M150 137 H157 M185 137 H192" stroke="#E8BA58" strokeWidth="2" strokeLinecap="round" />
              </g>
            )}

          </g>
        )}
'''

text = (
    text[:front_start]
    + front_layer
    + text[front_end:]
)

CREATURE_FILE.write_text(text, encoding="utf-8")

# ============================================================
# VALIDAÇÃO FINAL DO SCRIPT
# ============================================================

items_text = ITEMS_FILE.read_text(encoding="utf-8")
creature_text = CREATURE_FILE.read_text(encoding="utf-8")

catalog_count = len(
    re.findall(
        r'id:\s*"confia_[^"]+"',
        items_text
    )
)

if catalog_count != 40:
    raise SystemExit(
        f"ERRO: catálogo tem {catalog_count} itens, esperado 40."
    )

required_checks = [
    '"face"',
    "confia_glasses_round",
    "confia_crown_gold",
    "confia_backpack_terra",
    "confia_hand_book",
    "confia_aura_gold",
]

for check in required_checks:
    if check not in items_text and check not in creature_text:
        raise SystemExit(
            f"ERRO: validação falhou em {check}"
        )

# Validar JSON dos 4 idiomas
for lang, path in LOCALES.items():
    parsed = json.loads(
        path.read_text(encoding="utf-8")
    )

    translated_items = (
        parsed
        .get("companionCustomization", {})
        .get("items", {})
    )

    if len(translated_items) != 40:
        raise SystemExit(
            f"ERRO: {lang} tem "
            f"{len(translated_items)} traduções, esperado 40."
        )

print()
print("=" * 74)
print("CONFIA — B2.2 COLEÇÃO PREMIUM DE ACESSÓRIOS")
print("=" * 74)
print()
print("✓ 40 acessórios totais")
print("✓ 10 acessórios de cabeça")
print("✓ 5 acessórios de rosto")
print("✓ 8 acessórios de pescoço")
print("✓ 6 acessórios de corpo")
print("✓ 6 acessórios de mão")
print("✓ 5 auras")
print("✓ Novo slot FACE")
print("✓ Chapéu + óculos podem coexistir")
print("✓ Mochilas/capas renderizadas atrás da CONFIA")
print("✓ Acessórios frontais separados")
print("✓ Objetos de mão apenas quando existem braços")
print("✓ Âncoras adaptativas B2.1 preservadas")
print("✓ Níveis 2–10")
print("✓ Custos progressivos em XP")
print("✓ PT / EN / ES / FR")
print("✓ home_inventory preservado")
print("✓ home_equipped preservado")
print("✓ Sem novo estado React")
print("✓ Sem timers")
print("✓ Sem animação permanente")
print("✓ Sem dependências")
print()
print("B2.2 concluído.")
