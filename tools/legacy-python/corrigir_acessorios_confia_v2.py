from pathlib import Path
import shutil
import sys
import re

# ============================================================
# CONFIA — CORREÇÃO GLOBAL DOS ACESSÓRIOS V2
#
# Corrige:
# 1. Equipamento passa a atualizar imediatamente o avatar
# 2. Evento próprio após equipar/desequipar
# 3. ConfiaCompanionHome reage ao evento
# 4. confia_bow_cream ganha representação
# 5. confia_scarf_terra ganha representação
# 6. confia_charm_gold ganha representação
#
# Estratégia visual:
# - bow_cream reutiliza geometria do bow_terra
# - scarf_terra reutiliza geometria do scarf_cream
# - charm_gold reutiliza geometria do medal_sun
#
# Não altera:
# - compras
# - XP
# - preços
# - níveis
# - slots
# - catálogo
# - Abraço / A3
# - restantes acessórios
# ============================================================

ROOT = Path.cwd()

HOME = ROOT / "src/components/Companheiro/ConfiaCompanionHome.tsx"
CREATURE = ROOT / "src/components/Companheiro/ConfiaCreature.tsx"
STORAGE = ROOT / "src/storage/homeInventory.ts"

BACKUPS = {
    HOME: Path("/tmp/ConfiaCompanionHome.tsx.before_accessory_fix_v2"),
    CREATURE: Path("/tmp/ConfiaCreature.tsx.before_accessory_fix_v2"),
    STORAGE: Path("/tmp/homeInventory.ts.before_accessory_fix_v2"),
}


def fail(message: str):
    print()
    print("=" * 76)
    print("ERRO — CORREÇÃO NÃO APLICADA")
    print("=" * 76)
    print()
    print(message)
    print()
    print("Nenhum ficheiro foi escrito por este script.")
    print("=" * 76)
    sys.exit(1)


# ============================================================
# 1. CARREGAR
# ============================================================

for path in [HOME, CREATURE, STORAGE]:
    if not path.exists():
        fail(f"Não encontrei:\n{path}")

home_original = HOME.read_text(encoding="utf-8")
creature_original = CREATURE.read_text(encoding="utf-8")
storage_original = STORAGE.read_text(encoding="utf-8")

home = home_original
creature = creature_original
storage = storage_original


# ============================================================
# 2. AUDITORIA PRÉVIA
# ============================================================

required_home = [
    "getEquipped",
    "homeItems",
    "equippedAccessoryIds",
    "<Avatar",
]

for marker in required_home:
    if marker not in home:
        fail(
            "ConfiaCompanionHome inesperado.\n\n"
            f"Falta:\n{marker}"
        )

required_creature = [
    'hasAccessory("confia_bow_terra")',
    'hasAccessory("confia_scarf_cream")',
    'hasAccessory("confia_medal_sun")',
    "headAccessoryTransform",
    "neckAccessoryTransform",
]

for marker in required_creature:
    if marker not in creature:
        fail(
            "ConfiaCreature inesperado.\n\n"
            f"Falta:\n{marker}"
        )

required_storage = [
    "export function toggleCompanionAccessory(",
    "EQUIPPED_KEY",
    "localStorage.setItem",
]

for marker in required_storage:
    if marker not in storage:
        fail(
            "homeInventory inesperado.\n\n"
            f"Falta:\n{marker}"
        )


# ============================================================
# 3. GARANTIR useState + useEffect NO IMPORT REACT
# ============================================================

def ensure_react_hooks(text: str) -> str:
    """
    Adiciona useState/useEffect ao import React existente.
    Tolera:
      import { memo } from "react";
      import React, { memo } from "react";
    """

    pattern = re.compile(
        r'import\s+'
        r'(?:(?P<default>[A-Za-z_$][\w$]*)\s*,\s*)?'
        r'\{(?P<hooks>[^}]*)\}'
        r'\s+from\s+'
        r'(?P<quote>["\'])react(?P=quote)\s*;'
    )

    match = pattern.search(text)

    if match:
        hooks = [
            item.strip()
            for item in match.group("hooks").split(",")
            if item.strip()
        ]

        for needed in ["useEffect", "useState"]:
            if needed not in hooks:
                hooks.append(needed)

        default_import = match.group("default")
        quote = match.group("quote")

        if default_import:
            replacement = (
                f'import {default_import}, '
                f'{{ {", ".join(hooks)} }} '
                f'from {quote}react{quote};'
            )
        else:
            replacement = (
                f'import {{ {", ".join(hooks)} }} '
                f'from {quote}react{quote};'
            )

        return (
            text[:match.start()]
            + replacement
            + text[match.end():]
        )

    # Caso raro: import React from "react";
    default_only = re.compile(
        r'import\s+([A-Za-z_$][\w$]*)\s+'
        r'from\s+(["\'])react\2\s*;'
    )

    match = default_only.search(text)

    if match:
        quote = match.group(2)

        insert = (
            f'\nimport {{ useEffect, useState }} '
            f'from {quote}react{quote};'
        )

        return (
            text[:match.end()]
            + insert
            + text[match.end():]
        )

    fail(
        "Não consegui localizar o import React "
        "em ConfiaCompanionHome.tsx."
    )


home = ensure_react_hooks(home)


# ============================================================
# 4. TORNAR equippedAccessoryIds REATIVO
# ============================================================

EVENT_NAME = "confia:equipment-changed"

# Se já existir a V2, não duplicar.
already_reactive = (
    EVENT_NAME in home
    and "setEquippedAccessoryIds" in home
)

if not already_reactive:

    # Encontrar bloco atual:
    #
    # const equippedAccessoryIds = getEquipped().filter(
    #   id =>
    #     homeItems.some(...)
    # );
    #
    pattern = re.compile(
        r'(?P<indent>[ \t]*)const\s+equippedAccessoryIds'
        r'\s*=\s*getEquipped\(\)\.filter\('
        r'.*?'
        r'\n(?P=indent)\);',
        re.S
    )

    match = pattern.search(home)

    if not match:
        fail(
            "Não consegui localizar com segurança o bloco atual "
            "de equippedAccessoryIds."
        )

    indent = match.group("indent")

    replacement = f'''{indent}const readEquippedAccessoryIds = () =>
{indent}  getEquipped().filter(id =>
{indent}    homeItems.some(
{indent}      item =>
{indent}        item.id === id &&
{indent}        item.companionKind === "accessory"
{indent}    )
{indent}  );

{indent}const [
{indent}  equippedAccessoryIds,
{indent}  setEquippedAccessoryIds
{indent}] = useState<string[]>(
{indent}  () => readEquippedAccessoryIds()
{indent});

{indent}useEffect(() => {{
{indent}  const refreshEquippedAccessories = () => {{
{indent}    setEquippedAccessoryIds(
{indent}      readEquippedAccessoryIds()
{indent}    );
{indent}  }};

{indent}  window.addEventListener(
{indent}    "{EVENT_NAME}",
{indent}    refreshEquippedAccessories
{indent}  );

{indent}  window.addEventListener(
{indent}    "storage",
{indent}    refreshEquippedAccessories
{indent}  );

{indent}  window.addEventListener(
{indent}    "focus",
{indent}    refreshEquippedAccessories
{indent}  );

{indent}  return () => {{
{indent}    window.removeEventListener(
{indent}      "{EVENT_NAME}",
{indent}      refreshEquippedAccessories
{indent}    );

{indent}    window.removeEventListener(
{indent}      "storage",
{indent}      refreshEquippedAccessories
{indent}    );

{indent}    window.removeEventListener(
{indent}      "focus",
{indent}      refreshEquippedAccessories
{indent}    );
{indent}  }};
{indent}}}, []);'''

    home = (
        home[:match.start()]
        + replacement
        + home[match.end():]
    )


# ============================================================
# 5. EVENTO APÓS toggleCompanionAccessory
# ============================================================

def extract_function_block(
    text: str,
    signature: str
):
    start = text.find(signature)

    if start == -1:
        return None

    brace_start = text.find("{", start)

    if brace_start == -1:
        return None

    depth = 0

    for index in range(brace_start, len(text)):
        char = text[index]

        if char == "{":
            depth += 1

        elif char == "}":
            depth -= 1

            if depth == 0:
                return (
                    start,
                    index + 1,
                    text[start:index + 1]
                )

    return None


function_info = extract_function_block(
    storage,
    "export function toggleCompanionAccessory("
)

if not function_info:
    fail(
        "Não consegui isolar toggleCompanionAccessory."
    )

function_start, function_end, function_block = function_info

if EVENT_NAME not in function_block:

    storage_write_pattern = re.compile(
        r'(?P<indent>[ \t]*)localStorage\.setItem\('
        r'\s*EQUIPPED_KEY\s*,'
        r'\s*JSON\.stringify\(equipped\)'
        r'\s*\);',
        re.S
    )

    matches = list(
        storage_write_pattern.finditer(function_block)
    )

    if len(matches) != 1:
        fail(
            "Esperava exatamente uma gravação de "
            "EQUIPPED_KEY dentro de "
            "toggleCompanionAccessory.\n"
            f"Encontrei: {len(matches)}"
        )

    write_match = matches[0]
    indent = write_match.group("indent")

    old_write = write_match.group(0)

    new_write = old_write + f'''

{indent}if (typeof window !== "undefined") {{
{indent}  window.dispatchEvent(
{indent}    new Event("{EVENT_NAME}")
{indent}  );
{indent}}}'''

    function_block_updated = (
        function_block[:write_match.start()]
        + new_write
        + function_block[write_match.end():]
    )

    storage = (
        storage[:function_start]
        + function_block_updated
        + storage[function_end:]
    )


# ============================================================
# 6. COMPLETAR OS 3 ACESSÓRIOS ÓRFÃOS
# ============================================================
#
# Não inventamos novos SVGs.
#
# Cada item reutiliza uma geometria já desenhada e
# posicionada corretamente no mesmo slot.
#
# bow_cream   -> bow_terra
# scarf_terra -> scarf_cream
# charm_gold  -> medal_sun
# ============================================================

def add_visual_alias(
    text: str,
    existing_id: str,
    missing_id: str
) -> str:

    desired = (
        f'hasAccessory("{existing_id}") || '
        f'hasAccessory("{missing_id}")'
    )

    reverse = (
        f'hasAccessory("{missing_id}") || '
        f'hasAccessory("{existing_id}")'
    )

    if desired in text or reverse in text:
        return text

    target = f'hasAccessory("{existing_id}")'

    count = text.count(target)

    if count == 0:
        fail(
            f"Não encontrei o visual-base {existing_id}."
        )

    # É possível que o mesmo ID apareça também em lógica
    # auxiliar. Para alterar apenas a expressão visual,
    # procuramos uma ocorrência imediatamente seguida por && (
    visual_pattern = re.compile(
        re.escape(target)
        + r'\s*&&\s*\('
    )

    match = visual_pattern.search(text)

    if not match:
        fail(
            "Encontrei o ID mas não a condição visual JSX:\n"
            f"{existing_id}"
        )

    original_condition = match.group(0)

    replacement_condition = (
        f'({target} || '
        f'hasAccessory("{missing_id}")) && ('
    )

    return (
        text[:match.start()]
        + replacement_condition
        + text[match.end():]
    )


creature = add_visual_alias(
    creature,
    "confia_bow_terra",
    "confia_bow_cream"
)

creature = add_visual_alias(
    creature,
    "confia_scarf_cream",
    "confia_scarf_terra"
)

creature = add_visual_alias(
    creature,
    "confia_medal_sun",
    "confia_charm_gold"
)


# ============================================================
# 7. AUDITORIA FINAL EM MEMÓRIA
# ============================================================

home_checks = [
    "useEffect",
    "useState",
    "readEquippedAccessoryIds",
    "setEquippedAccessoryIds",
    EVENT_NAME,
    'window.addEventListener(',
    'window.removeEventListener(',
    "equippedAccessoryIds={",
]

for marker in home_checks:
    if marker not in home:
        fail(
            "Falhou auditoria de ConfiaCompanionHome:\n"
            f"{marker}"
        )

storage_checks = [
    "export function toggleCompanionAccessory(",
    EVENT_NAME,
    "window.dispatchEvent",
    "new Event(",
]

for marker in storage_checks:
    if marker not in storage:
        fail(
            "Falhou auditoria de homeInventory:\n"
            f"{marker}"
        )

visual_checks = [
    'hasAccessory("confia_bow_cream")',
    'hasAccessory("confia_scarf_terra")',
    'hasAccessory("confia_charm_gold")',
]

for marker in visual_checks:
    if marker not in creature:
        fail(
            "Falhou auditoria visual:\n"
            f"{marker}"
        )


# ============================================================
# 8. GARANTIR QUE NÃO DUPLICÁMOS IDs
# ============================================================

# Os 3 IDs devem existir agora pelo menos uma vez
# no ConfiaCreature, mas não queremos dezenas de cópias.

for missing_id in [
    "confia_bow_cream",
    "confia_scarf_terra",
    "confia_charm_gold",
]:
    count = creature.count(
        f'hasAccessory("{missing_id}")'
    )

    if count != 1:
        fail(
            f"{missing_id}: esperava 1 condição "
            f"visual, encontrei {count}."
        )


# ============================================================
# 9. GARANTIR FUNCIONALIDADE EXISTENTE
# ============================================================

preserved_home = [
    "<Avatar",
    "equippedAccessoryIds={",
    "companionReaction",
    "handlePetAvatar",
]

for marker in preserved_home:
    if marker not in home:
        fail(
            "Funcionalidade do Companion desapareceu:\n"
            f"{marker}"
        )

preserved_storage = [
    "getEquipped()",
    "sameSlotIds",
    "equipped.push(id)",
    "EQUIPPED_KEY",
]

for marker in preserved_storage:
    if marker not in storage:
        fail(
            "Lógica do inventário desapareceu:\n"
            f"{marker}"
        )

preserved_creature = [
    "confia_flower_daisy",
    "confia_beret_terra",
    "confia_beanie_cream",
    "confia_hat_garden",
    "confia_crown_gold",
    "confia_glasses_round",
    "confia_scarf_cream",
    "confia_necklace_leaf",
    "confia_aura_soft",
    "confia_skin_cream",
    "confia_mark_heart",
    "confia_flame_pearl",
    "confia_eyes_amber",
]

for marker in preserved_creature:
    if marker not in creature:
        fail(
            "Acessório existente desapareceu:\n"
            f"{marker}"
        )


# ============================================================
# 10. BACKUPS
# ============================================================

for original_path, backup_path in BACKUPS.items():
    shutil.copy2(
        original_path,
        backup_path
    )


# ============================================================
# 11. ESCREVER
# ============================================================

HOME.write_text(
    home,
    encoding="utf-8"
)

CREATURE.write_text(
    creature,
    encoding="utf-8"
)

STORAGE.write_text(
    storage,
    encoding="utf-8"
)


# ============================================================
# 12. VERIFICAÇÃO PÓS-ESCRITA
# ============================================================

home_written = HOME.read_text(encoding="utf-8")
creature_written = CREATURE.read_text(encoding="utf-8")
storage_written = STORAGE.read_text(encoding="utf-8")

if EVENT_NAME not in home_written:
    fail(
        "Evento não ficou escrito em "
        "ConfiaCompanionHome."
    )

if EVENT_NAME not in storage_written:
    fail(
        "Evento não ficou escrito em homeInventory."
    )

for marker in visual_checks:
    if marker not in creature_written:
        fail(
            "Acessório não ficou escrito:\n"
            f"{marker}"
        )


# ============================================================
# 13. RESULTADO
# ============================================================

print()
print("=" * 76)
print("CONFIA — CORREÇÃO GLOBAL DOS ACESSÓRIOS V2")
print("=" * 76)
print()
print("✓ Equipamento passou a estado React")
print("✓ Evento próprio após equipar/desequipar")
print("✓ Atualização imediata no mesmo separador/app")
print("✓ Fallback por storage preservado")
print("✓ Fallback por focus preservado")
print()
print("✓ confia_bow_cream ligado ao visual bow")
print("✓ confia_scarf_terra ligado ao visual scarf")
print("✓ confia_charm_gold ligado ao visual gold")
print()
print("✓ Slots existentes preservados")
print("✓ Compras preservadas")
print("✓ home_equipped preservado")
print("✓ Exclusividade por slot preservada")
print("✓ Restantes acessórios preservados")
print("✓ Sem nova dependência")
print("✓ Abraço / A3 não alterado")
print()
print("Backups:")
print(f"  {BACKUPS[HOME]}")
print(f"  {BACKUPS[CREATURE]}")
print(f"  {BACKUPS[STORAGE]}")
print()
print("PRÓXIMO PASSO:")
print("  npm run build")
print("=" * 76)
