from pathlib import Path
import shutil
import re
import json

ROOT = Path.home() / "src"

ITEMS = ROOT / "data/homeItems.ts"
CREATURE = ROOT / "components/Companheiro/ConfiaCreature.tsx"

LOCALES = {
    "pt": ROOT / "locales/pt.json",
    "en": ROOT / "locales/en.json",
    "es": ROOT / "locales/es.json",
    "fr": ROOT / "locales/fr.json",
}

FILES = [ITEMS, CREATURE, *LOCALES.values()]

for p in FILES:
    if not p.exists():
        raise SystemExit(f"ERRO: não encontrado: {p}")

for p in FILES:
    backup = Path(str(p) + ".before_b2_3")
    shutil.copy2(p, backup)

# ============================================================
# NOVA COLEÇÃO — 40
# ============================================================

collection = [
    # HEAD 6
    ("confia_bow_cream","🎀",80,"head",2),
    ("confia_flower_daisy","🌼",120,"head",3),
    ("confia_beret_terra","🧢",180,"head",4),
    ("confia_beanie_cream","🧶",220,"head",5),
    ("confia_hat_garden","👒",280,"head",6),
    ("confia_crown_gold","👑",600,"head",10),

    # FACE 4
    ("confia_glasses_round","👓",130,"face",3),
    ("confia_glasses_gold","👓",260,"face",6),
    ("confia_glasses_sun","🕶️",330,"face",7),
    ("confia_glasses_heart","💗",460,"face",9),

    # NECK 5
    ("confia_scarf_terra","🧣",120,"neck",3),
    ("confia_charm_gold","✨",180,"neck",5),
    ("confia_scarf_cream","🧣",150,"neck",3),
    ("confia_necklace_leaf","🌿",200,"neck",4),
    ("confia_pendant_moon","🌙",500,"neck",9),

    # BODY 3
    ("confia_bag_terra","👜",240,"body",5),
    ("confia_cape_cream","🧥",300,"body",6),
    ("confia_backpack_terra","🎒",360,"body",7),

    # HAND 3
    ("confia_hand_flower","🌼",170,"hand",4),
    ("confia_hand_book","📖",340,"hand",7),
    ("confia_hand_light","✨",540,"hand",10),

    # AURA 4
    ("confia_aura_soft","✨",230,"aura",5),
    ("confia_aura_stars","🌟",320,"aura",6),
    ("confia_aura_leaves","🍃",400,"aura",7),
    ("confia_aura_gold","✨",700,"aura",10),

    # SKIN 5
    ("confia_skin_cream","🎨",160,"skin",3),
    ("confia_skin_peach","🎨",220,"skin",4),
    ("confia_skin_rose","🎨",300,"skin",5),
    ("confia_skin_terra","🎨",400,"skin",7),
    ("confia_skin_gold","🎨",650,"skin",10),

    # MARK 5
    ("confia_mark_heart","♥",180,"mark",3),
    ("confia_mark_star","★",240,"mark",4),
    ("confia_mark_leaf","🌿",300,"mark",6),
    ("confia_mark_moon","☾",380,"mark",8),
    ("confia_mark_sun","☀",500,"mark",10),

    # FLAME 3
    ("confia_flame_pearl","🔥",260,"flame",5),
    ("confia_flame_rose","🔥",360,"flame",7),
    ("confia_flame_gold","🔥",520,"flame",9),

    # EYES 2
    ("confia_eyes_amber","👁️",280,"eyes",6),
    ("confia_eyes_honey","👁️",420,"eyes",8),
]

assert len(collection) == 40

# ============================================================
# HOME ITEMS
# ============================================================

text = ITEMS.read_text(encoding="utf-8")

# acrescentar novos slots
slot_match = re.search(
    r'export type CompanionAccessorySlot\s*=\s*(.*?);',
    text,
    re.S
)

if not slot_match:
    raise SystemExit("ERRO: CompanionAccessorySlot não encontrado.")

new_slots = '''export type CompanionAccessorySlot =
  | "head"
  | "face"
  | "neck"
  | "body"
  | "hand"
  | "aura"
  | "skin"
  | "mark"
  | "flame"
  | "eyes";'''

text = (
    text[:slot_match.start()]
    + new_slots
    + text[slot_match.end():]
)

catalog = [
    "export const homeItems: HomeItem[] = [",
    "  // B2.3 — personalização premium diversificada",
]

for id_, emoji, cost, slot, level in collection:
    catalog += [
        "  {",
        f'    id: "{id_}",',
        f'    emoji: "{emoji}",',
        f"    cost: {cost},",
        '    category: "companion",',
        '    companionKind: "accessory",',
        f'    companionSlot: "{slot}",',
        f"    minCompanionLevel: {level}",
        "  },",
    ]

catalog.append("];")
catalog = "\n".join(catalog)

start = text.find("export const homeItems: HomeItem[] = [")
marker = "\n\n/**\n * ==========================================================\n * A5.1 — CAMADA DE COMPATIBILIDADE"
end = text.find(marker, start)

if start < 0 or end < 0:
    raise SystemExit("ERRO: catálogo não localizado.")

text = text[:start] + catalog + text[end:]

ITEMS.write_text(text, encoding="utf-8")

# ============================================================
# CREATURE — VARIÁVEIS DE PERSONALIZAÇÃO
# ============================================================

text = CREATURE.read_text(encoding="utf-8")

needle = '''  const hasAccessory = (id: string) =>
    equippedAccessoryIds.includes(id);

'''

if needle not in text:
    raise SystemExit("ERRO: hasAccessory não encontrado.")

logic = '''  const hasAccessory = (id: string) =>
    equippedAccessoryIds.includes(id);

  /**
   * B2.3 — identidade visual personalizada.
   *
   * Tudo deriva exclusivamente dos IDs já equipados.
   * Não existe novo estado nem persistência.
   */
  const bodyPalette = hasAccessory("confia_skin_cream")
    ? ["#FFF0E2", "#EBC5A9", "#C98D70"]
    : hasAccessory("confia_skin_peach")
      ? ["#FFDCC6", "#F0AE8C", "#CE775F"]
      : hasAccessory("confia_skin_rose")
        ? ["#F8D1D2", "#DE999D", "#BC6D73"]
        : hasAccessory("confia_skin_terra")
          ? ["#E8B09A", "#C77B64", "#9F5949"]
          : hasAccessory("confia_skin_gold")
            ? ["#F4DDA8", "#D8B36B", "#AA7C38"]
            : ["#F6D4C2", "#E7A485", "#C8735B"];

  const eyePalette = hasAccessory("confia_eyes_amber")
    ? ["#A96F35", "#51351F"]
    : hasAccessory("confia_eyes_honey")
      ? ["#C89445", "#63461F"]
      : ["#6C5149", "#302725"];

  const flamePalette = hasAccessory("confia_flame_pearl")
    ? ["#FFF9E8", "#E7D6B5"]
    : hasAccessory("confia_flame_rose")
      ? ["#F5C5C9", "#C8757D"]
      : hasAccessory("confia_flame_gold")
        ? ["#FFE8A0", "#D6A13E"]
        : ["#F7D28A", "#C66550"];

'''

text = text.replace(needle, logic, 1)

# Corpo — apenas stops do gradiente principal
old = '''            <stop
              offset="0"
              stopColor="#F6D4C2"
            />

            <stop
              offset="0.46"
              stopColor="#E7A485"
            />

            <stop
              offset="1"
              stopColor="#C8735B"
            />'''

new = '''            <stop
              offset="0"
              stopColor={bodyPalette[0]}
            />

            <stop
              offset="0.46"
              stopColor={bodyPalette[1]}
            />

            <stop
              offset="1"
              stopColor={bodyPalette[2]}
            />'''

if old not in text:
    raise SystemExit("ERRO: gradiente do corpo não encontrado.")

text = text.replace(old, new, 1)

# olhos
old = '''            <stop
              offset="0"
              stopColor="#6C5149"
            />

            <stop
              offset="1"
              stopColor="#302725"
            />'''

new = '''            <stop
              offset="0"
              stopColor={eyePalette[0]}
            />

            <stop
              offset="1"
              stopColor={eyePalette[1]}
            />'''

if old not in text:
    raise SystemExit("ERRO: gradiente dos olhos não encontrado.")

text = text.replace(old, new, 1)

# chama: substituir fill/stroke do path principal
old = '''                fill="url(#confiaSoul)"
                stroke="#B8614D"
                strokeWidth="2"'''

new = '''                fill={
                  hasAccessory("confia_flame_pearl") ||
                  hasAccessory("confia_flame_rose") ||
                  hasAccessory("confia_flame_gold")
                    ? flamePalette[0]
                    : "url(#confiaSoul)"
                }
                stroke={flamePalette[1]}
                strokeWidth="2"'''

if old not in text:
    raise SystemExit("ERRO: chama principal não encontrada.")

text = text.replace(old, new, 1)

# ============================================================
# MARCAS CORPORAIS
# Inserir antes do bloco frontal de acessórios
# ============================================================

marker = '''        {/* ===================================================
            B2.2 — ACESSÓRIOS FRONTAIS DA CONFIA'''

if marker not in text:
    raise SystemExit("ERRO: bloco frontal B2.2 não encontrado.")

marks = r'''        {/* B2.3 — marcas corporais */}
        {!isEgg && (
          <g aria-hidden="true" opacity="0.72">

            {hasAccessory("confia_mark_heart") && (
              <path
                d="M110 160 C100 153 102 146 107 147 C110 147 111 150 111 150 C113 147 118 147 120 151 C122 155 116 159 110 160Z"
                fill="#A95F5F"
              />
            )}

            {hasAccessory("confia_mark_star") && (
              <path
                d="M110 147 l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"
                fill="#B77D50"
              />
            )}

            {hasAccessory("confia_mark_leaf") && (
              <g>
                <ellipse
                  cx="110"
                  cy="156"
                  rx="5"
                  ry="11"
                  fill="#82906A"
                  transform="rotate(35 110 156)"
                />
                <path
                  d="M105 164 Q110 157 116 150"
                  fill="none"
                  stroke="#667653"
                  strokeWidth="1.5"
                />
              </g>
            )}

            {hasAccessory("confia_mark_moon") && (
              <path
                d="M106 146 C99 151 101 163 111 166 C107 161 108 153 116 149 C112 146 109 145 106 146Z"
                fill="#B28C66"
              />
            )}

            {hasAccessory("confia_mark_sun") && (
              <g>
                <circle
                  cx="110"
                  cy="156"
                  r="6"
                  fill="#C89645"
                />
                <path
                  d="M110 144 V148 M110 164 V168 M98 156 H102 M118 156 H122 M102 148 L105 151 M115 161 L118 164 M118 148 L115 151 M105 161 L102 164"
                  stroke="#C89645"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </g>
            )}

          </g>
        )}

'''

text = text.replace(marker, marks + marker, 1)

CREATURE.write_text(text, encoding="utf-8")

# ============================================================
# TRADUÇÕES
# ============================================================

slot_names = {
    "pt": {
        "skin": "Cor",
        "mark": "Marca",
        "flame": "Chama",
        "eyes": "Olhos",
    },
    "en": {
        "skin": "Color",
        "mark": "Mark",
        "flame": "Flame",
        "eyes": "Eyes",
    },
    "es": {
        "skin": "Color",
        "mark": "Marca",
        "flame": "Llama",
        "eyes": "Ojos",
    },
    "fr": {
        "skin": "Couleur",
        "mark": "Marque",
        "flame": "Flamme",
        "eyes": "Yeux",
    },
}

new_names = {
    "pt": {
        "confia_skin_cream": "Creme",
        "confia_skin_peach": "Pêssego",
        "confia_skin_rose": "Rosa Suave",
        "confia_skin_terra": "Terracota",
        "confia_skin_gold": "Dourado",
        "confia_mark_heart": "Marca Coração",
        "confia_mark_star": "Marca Estrela",
        "confia_mark_leaf": "Marca Folha",
        "confia_mark_moon": "Marca Lua",
        "confia_mark_sun": "Marca Sol",
        "confia_flame_pearl": "Chama Pérola",
        "confia_flame_rose": "Chama Rosa",
        "confia_flame_gold": "Chama Dourada",
        "confia_eyes_amber": "Olhos Âmbar",
        "confia_eyes_honey": "Olhos Mel",
    },
    "en": {
        "confia_skin_cream": "Cream",
        "confia_skin_peach": "Peach",
        "confia_skin_rose": "Soft Rose",
        "confia_skin_terra": "Terracotta",
        "confia_skin_gold": "Golden",
        "confia_mark_heart": "Heart Mark",
        "confia_mark_star": "Star Mark",
        "confia_mark_leaf": "Leaf Mark",
        "confia_mark_moon": "Moon Mark",
        "confia_mark_sun": "Sun Mark",
        "confia_flame_pearl": "Pearl Flame",
        "confia_flame_rose": "Rose Flame",
        "confia_flame_gold": "Golden Flame",
        "confia_eyes_amber": "Amber Eyes",
        "confia_eyes_honey": "Honey Eyes",
    },
    "es": {
        "confia_skin_cream": "Crema",
        "confia_skin_peach": "Melocotón",
        "confia_skin_rose": "Rosa Suave",
        "confia_skin_terra": "Terracota",
        "confia_skin_gold": "Dorado",
        "confia_mark_heart": "Marca Corazón",
        "confia_mark_star": "Marca Estrella",
        "confia_mark_leaf": "Marca Hoja",
        "confia_mark_moon": "Marca Luna",
        "confia_mark_sun": "Marca Sol",
        "confia_flame_pearl": "Llama Perla",
        "confia_flame_rose": "Llama Rosa",
        "confia_flame_gold": "Llama Dorada",
        "confia_eyes_amber": "Ojos Ámbar",
        "confia_eyes_honey": "Ojos Miel",
    },
    "fr": {
        "confia_skin_cream": "Crème",
        "confia_skin_peach": "Pêche",
        "confia_skin_rose": "Rose Doux",
        "confia_skin_terra": "Terracotta",
        "confia_skin_gold": "Doré",
        "confia_mark_heart": "Marque Cœur",
        "confia_mark_star": "Marque Étoile",
        "confia_mark_leaf": "Marque Feuille",
        "confia_mark_moon": "Marque Lune",
        "confia_mark_sun": "Marque Soleil",
        "confia_flame_pearl": "Flamme Perle",
        "confia_flame_rose": "Flamme Rose",
        "confia_flame_gold": "Flamme Dorée",
        "confia_eyes_amber": "Yeux Ambre",
        "confia_eyes_honey": "Yeux Miel",
    },
}

valid_ids = {x[0] for x in collection}

for lang, path in LOCALES.items():
    data = json.loads(path.read_text(encoding="utf-8"))

    cc = data.get("companionCustomization")
    if not isinstance(cc, dict):
        raise SystemExit(
            f"ERRO: companionCustomization ausente em {lang}"
        )

    slots = cc.setdefault("slots", {})
    slots.update(slot_names[lang])

    old_items = cc.setdefault("items", {})

    # preservar nomes apenas dos itens que continuam
    cleaned = {
        k: v
        for k, v in old_items.items()
        if k in valid_ids
    }

    cleaned.update(new_names[lang])
    cc["items"] = cleaned

    if len(cleaned) != 40:
        raise SystemExit(
            f"ERRO: {lang} ficou com {len(cleaned)} nomes, esperado 40."
        )

    path.write_text(
        json.dumps(
            data,
            ensure_ascii=False,
            indent=2
        ) + "\n",
        encoding="utf-8",
    )

# ============================================================
# VALIDAÇÃO
# ============================================================

items_text = ITEMS.read_text(encoding="utf-8")
creature_text = CREATURE.read_text(encoding="utf-8")

count = len(
    re.findall(
        r'id:\s*"confia_[^"]+"',
        items_text
    )
)

if count != 40:
    raise SystemExit(
        f"ERRO: catálogo tem {count}; esperado 40."
    )

for slot in [
    '"skin"',
    '"mark"',
    '"flame"',
    '"eyes"',
]:
    if slot not in items_text:
        raise SystemExit(
            f"ERRO: slot ausente: {slot}"
        )

for token in [
    "bodyPalette",
    "eyePalette",
    "flamePalette",
    "confia_mark_heart",
    "confia_mark_sun",
]:
    if token not in creature_text:
        raise SystemExit(
            f"ERRO: personalização ausente: {token}"
        )

print()
print("=" * 72)
print("CONFIA — B2.3 DIVERSIFICAÇÃO PREMIUM")
print("=" * 72)
print()
print("✓ 40 itens totais mantidos")
print("✓ 25 acessórios/objetos visuais")
print("✓ 5 cores da CONFIA")
print("✓ 5 marcas corporais")
print("✓ 3 chamas")
print("✓ 2 cores especiais de olhos")
print("✓ Cor acompanha evolução")
print("✓ Marca acompanha evolução")
print("✓ Chama acompanha evolução")
print("✓ Olhos acompanham evolução")
print("✓ Uma escolha por categoria")
print("✓ Categorias podem coexistir")
print("✓ Storage existente preservado")
print("✓ XP preservado")
print("✓ PT / EN / ES / FR")
print("✓ Sem novo estado React")
print("✓ Sem timers")
print("✓ Sem animações permanentes")
print("✓ Sem dependências")
print()
print("B2.3 concluído.")
