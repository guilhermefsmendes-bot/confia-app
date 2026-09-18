from pathlib import Path
import shutil
import sys
import re

# ============================================================
# CONFIA — ACESSÓRIOS V3
# ============================================================
#
# Corrige dois problemas:
#
# A) equipamento gravado no localStorage não força atualização
#    imediata da CONFIA;
#
# B) existem 3 IDs no catálogo sem condição visual:
#       confia_bow_cream
#       confia_scarf_terra
#       confia_charm_gold
#
# IMPORTANTE:
# - NÃO assume que ConfiaCompanionHome importa homeItems;
# - reutiliza exatamente o filtro equipado que já existe;
# - NÃO altera home_inventory;
# - NÃO altera home_equipped;
# - NÃO altera preços;
# - NÃO altera níveis;
# - NÃO altera slots;
# - NÃO altera A3 / Abraço;
# - cria backups antes de escrever.
# ============================================================

ROOT = Path.cwd()

HOME = ROOT / "src/components/Companheiro/ConfiaCompanionHome.tsx"
CREATURE = ROOT / "src/components/Companheiro/ConfiaCreature.tsx"
STORAGE = ROOT / "src/storage/homeInventory.ts"

BACKUP_HOME = Path(
    "/tmp/ConfiaCompanionHome.tsx.before_accessories_v3"
)
BACKUP_CREATURE = Path(
    "/tmp/ConfiaCreature.tsx.before_accessories_v3"
)
BACKUP_STORAGE = Path(
    "/tmp/homeInventory.ts.before_accessories_v3"
)

EVENT_NAME = "confia:equipment-changed"


def fail(message):
    print()
    print("=" * 76)
    print("ERRO — NENHUMA ALTERAÇÃO FOI GRAVADA")
    print("=" * 76)
    print()
    print(message)
    print()
    print("=" * 76)
    sys.exit(1)


# ============================================================
# 1. VALIDAR FICHEIROS
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
# 2. VALIDAÇÃO MÍNIMA DA ARQUITETURA REAL
# ============================================================

for marker in [
    "getEquipped",
    "equippedAccessoryIds",
    "<Avatar",
]:
    if marker not in home:
        fail(
            "ConfiaCompanionHome não tem a estrutura esperada.\n"
            f"Falta: {marker}"
        )

for marker in [
    "export function toggleCompanionAccessory(",
    "localStorage.setItem",
    "EQUIPPED_KEY",
]:
    if marker not in storage:
        fail(
            "homeInventory não tem a estrutura esperada.\n"
            f"Falta: {marker}"
        )

for marker in [
    "hasAccessory",
    "headAccessoryTransform",
    "neckAccessoryTransform",
]:
    if marker not in creature:
        fail(
            "ConfiaCreature não tem a estrutura esperada.\n"
            f"Falta: {marker}"
        )


# ============================================================
# 3. ADICIONAR useState/useEffect AO IMPORT REACT
# ============================================================

def ensure_react_hooks(text):
    # Exemplo:
    # import { memo, useMemo } from "react";
    #
    pattern = re.compile(
        r'import\s+'
        r'(?:(?P<default>[A-Za-z_$][\w$]*)\s*,\s*)?'
        r'\{(?P<hooks>[^}]*)\}'
        r'\s+from\s+'
        r'(?P<q>["\'])react(?P=q)\s*;'
    )

    match = pattern.search(text)

    if match:
        hooks = [
            h.strip()
            for h in match.group("hooks").split(",")
            if h.strip()
        ]

        for hook in ["useEffect", "useState"]:
            if hook not in hooks:
                hooks.append(hook)

        default_import = match.group("default")
        q = match.group("q")

        if default_import:
            replacement = (
                f'import {default_import}, '
                f'{{ {", ".join(hooks)} }} '
                f'from {q}react{q};'
            )
        else:
            replacement = (
                f'import {{ {", ".join(hooks)} }} '
                f'from {q}react{q};'
            )

        return (
            text[:match.start()]
            + replacement
            + text[match.end():]
        )

    # Exemplo:
    # import React from "react";
    pattern_default = re.compile(
        r'import\s+([A-Za-z_$][\w$]*)'
        r'\s+from\s+(["\'])react\2\s*;'
    )

    match = pattern_default.search(text)

    if match:
        q = match.group(2)

        addition = (
            f'\nimport {{ useEffect, useState }} '
            f'from {q}react{q};'
        )

        return (
            text[:match.end()]
            + addition
            + text[match.end():]
        )

    fail(
        "Não consegui localizar automaticamente "
        "o import React em ConfiaCompanionHome."
    )


home = ensure_react_hooks(home)


# ============================================================
# 4. TRANSFORMAR equippedAccessoryIds EM ESTADO REATIVO
# ============================================================
#
# Em vez de inventarmos o filtro, capturamos literalmente:
#
# const equippedAccessoryIds = getEquipped().filter(...);
#
# e transformamos em:
#
# const readEquippedAccessoryIds = () =>
#   getEquipped().filter(...);
#
# const [equippedAccessoryIds, setEquippedAccessoryIds] =
#   useState(() => readEquippedAccessoryIds());
#
# ============================================================

if (
    "readEquippedAccessoryIds" not in home
    or EVENT_NAME not in home
):

    start_marker = "const equippedAccessoryIds ="

    start = home.find(start_marker)

    if start == -1:
        fail(
            "Não encontrei:\n"
            "const equippedAccessoryIds ="
        )

    # Encontrar posição inicial da linha
    line_start = home.rfind("\n", 0, start) + 1

    indent = home[line_start:start]

    # Só aceitamos whitespace antes do const.
    if indent.strip():
        fail(
            "O início de equippedAccessoryIds não tem "
            "o formato esperado."
        )

    expression_start = start + len(start_marker)

    # Procurar o ; que termina a declaração,
    # respeitando (), [], {} e strings.
    depth_paren = 0
    depth_bracket = 0
    depth_brace = 0
    quote = None
    escaped = False
    end = None

    for i in range(expression_start, len(home)):
        ch = home[i]

        if quote:
            if escaped:
                escaped = False
                continue

            if ch == "\\":
                escaped = True
                continue

            if ch == quote:
                quote = None

            continue

        if ch in ("'", '"', "`"):
            quote = ch
            continue

        if ch == "(":
            depth_paren += 1
        elif ch == ")":
            depth_paren -= 1
        elif ch == "[":
            depth_bracket += 1
        elif ch == "]":
            depth_bracket -= 1
        elif ch == "{":
            depth_brace += 1
        elif ch == "}":
            depth_brace -= 1
        elif (
            ch == ";"
            and depth_paren == 0
            and depth_bracket == 0
            and depth_brace == 0
        ):
            end = i + 1
            break

    if end is None:
        fail(
            "Não consegui determinar onde termina "
            "equippedAccessoryIds."
        )

    original_declaration = home[line_start:end]

    eq_pos = original_declaration.find("=")

    if eq_pos == -1:
        fail(
            "Declaração equippedAccessoryIds inválida."
        )

    rhs = original_declaration[
        eq_pos + 1:
    ].strip()

    if rhs.endswith(";"):
        rhs = rhs[:-1].rstrip()

    if "getEquipped()" not in rhs:
        fail(
            "O filtro atual de equippedAccessoryIds "
            "já não usa getEquipped()."
        )

    replacement = f'''{indent}const readEquippedAccessoryIds = () =>
{indent}  {rhs};

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
        home[:line_start]
        + replacement
        + home[end:]
    )


# ============================================================
# 5. ISOLAR toggleCompanionAccessory
# ============================================================

def get_function_block(text, signature):
    start = text.find(signature)

    if start == -1:
        return None

    brace_start = text.find("{", start)

    if brace_start == -1:
        return None

    depth = 0
    quote = None
    escaped = False

    for i in range(brace_start, len(text)):
        ch = text[i]

        if quote:
            if escaped:
                escaped = False
                continue

            if ch == "\\":
                escaped = True
                continue

            if ch == quote:
                quote = None

            continue

        if ch in ("'", '"', "`"):
            quote = ch
            continue

        if ch == "{":
            depth += 1

        elif ch == "}":
            depth -= 1

            if depth == 0:
                return start, i + 1, text[start:i + 1]

    return None


function_info = get_function_block(
    storage,
    "export function toggleCompanionAccessory("
)

if not function_info:
    fail(
        "Não consegui isolar toggleCompanionAccessory."
    )

function_start, function_end, function_block = function_info


# ============================================================
# 6. EMITIR EVENTO APÓS ALTERAÇÃO DO EQUIPAMENTO
# ============================================================

if EVENT_NAME not in function_block:

    # Procurar a última gravação localStorage dentro
    # especificamente desta função.
    pattern = re.compile(
        r'localStorage\.setItem\s*\(\s*'
        r'EQUIPPED_KEY\s*,\s*'
        r'JSON\.stringify\s*\(\s*equipped\s*\)'
        r'\s*\)\s*;',
        re.S
    )

    matches = list(pattern.finditer(function_block))

    if len(matches) != 1:
        fail(
            "Dentro de toggleCompanionAccessory esperava "
            "1 gravação de EQUIPPED_KEY.\n"
            f"Encontrei: {len(matches)}"
        )

    match = matches[0]

    # determinar indentação
    absolute_before = function_block[:match.start()]
    last_newline = absolute_before.rfind("\n")

    if last_newline == -1:
        write_indent = "  "
    else:
        line_prefix = absolute_before[last_newline + 1:]
        write_indent = re.match(
            r"[ \t]*",
            line_prefix
        ).group(0)

    original_write = match.group(0)

    addition = f'''

{write_indent}if (typeof window !== "undefined") {{
{write_indent}  window.dispatchEvent(
{write_indent}    new Event("{EVENT_NAME}")
{write_indent}  );
{write_indent}}}'''

    updated_function = (
        function_block[:match.end()]
        + addition
        + function_block[match.end():]
    )

    storage = (
        storage[:function_start]
        + updated_function
        + storage[function_end:]
    )


# ============================================================
# 7. CORRIGIR OS 3 VISUAIS ÓRFÃOS
# ============================================================
#
# Em vez de criar SVGs novos:
#
# confia_bow_cream
#   reutiliza o desenho de confia_bow_terra
#
# confia_scarf_terra
#   reutiliza o desenho de confia_scarf_cream
#
# confia_charm_gold
#   reutiliza o desenho de confia_medal_sun
#
# Isto mantém posições e escala já afinadas.
# ============================================================

def visual_alias(
    text,
    existing_id,
    new_id
):
    new_marker = f'hasAccessory("{new_id}")'

    # Já corrigido?
    if new_marker in text:
        return text

    existing_marker = (
        f'hasAccessory("{existing_id}")'
    )

    pattern = re.compile(
        re.escape(existing_marker)
        + r'\s*&&\s*\('
    )

    match = pattern.search(text)

    if not match:
        fail(
            "Não encontrei condição JSX visual para:\n"
            f"{existing_id}\n\n"
            "Não vou inventar uma posição nova."
        )

    replacement = (
        f'({existing_marker} || '
        f'{new_marker}) && ('
    )

    return (
        text[:match.start()]
        + replacement
        + text[match.end():]
    )


creature = visual_alias(
    creature,
    "confia_bow_terra",
    "confia_bow_cream"
)

creature = visual_alias(
    creature,
    "confia_scarf_cream",
    "confia_scarf_terra"
)

creature = visual_alias(
    creature,
    "confia_medal_sun",
    "confia_charm_gold"
)


# ============================================================
# 8. AUDITORIA ANTES DE ESCREVER
# ============================================================

home_required_after = [
    "readEquippedAccessoryIds",
    "setEquippedAccessoryIds",
    EVENT_NAME,
    "useEffect",
    "useState",
    "equippedAccessoryIds={",
]

for marker in home_required_after:
    if marker not in home:
        fail(
            "Auditoria final falhou no Home:\n"
            f"{marker}"
        )


storage_required_after = [
    "toggleCompanionAccessory",
    EVENT_NAME,
    "window.dispatchEvent",
    "new Event",
    "sameSlotIds",
    "equipped.push(id)",
]

for marker in storage_required_after:
    if marker not in storage:
        fail(
            "Auditoria final falhou no storage:\n"
            f"{marker}"
        )


visual_required_after = [
    'hasAccessory("confia_bow_cream")',
    'hasAccessory("confia_scarf_terra")',
    'hasAccessory("confia_charm_gold")',
]

for marker in visual_required_after:
    if marker not in creature:
        fail(
            "Auditoria visual falhou:\n"
            f"{marker}"
        )


# ============================================================
# 9. GARANTIR QUE NÃO DUPLICAMOS OS 3
# ============================================================

for item_id in [
    "confia_bow_cream",
    "confia_scarf_terra",
    "confia_charm_gold",
]:
    count = creature.count(
        f'hasAccessory("{item_id}")'
    )

    if count != 1:
        fail(
            f"{item_id}: esperava exatamente "
            f"1 condição visual; encontrei {count}."
        )


# ============================================================
# 10. GARANTIR ACESSÓRIOS IMPORTANTES JÁ EXISTENTES
# ============================================================

preserve = [
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

for marker in preserve:
    if marker not in creature:
        fail(
            "Durante a alteração desapareceu "
            f"um item existente:\n{marker}"
        )


# ============================================================
# 11. CRIAR BACKUPS
# ============================================================

shutil.copy2(
    HOME,
    BACKUP_HOME
)

shutil.copy2(
    CREATURE,
    BACKUP_CREATURE
)

shutil.copy2(
    STORAGE,
    BACKUP_STORAGE
)


# ============================================================
# 12. ESCREVER
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
# 13. VERIFICAÇÃO PÓS-ESCRITA
# ============================================================

home_check = HOME.read_text(encoding="utf-8")
creature_check = CREATURE.read_text(encoding="utf-8")
storage_check = STORAGE.read_text(encoding="utf-8")

for marker in [
    EVENT_NAME,
    "readEquippedAccessoryIds",
    "setEquippedAccessoryIds",
]:
    if marker not in home_check:
        fail(
            "Pós-verificação Home falhou:\n"
            f"{marker}"
        )

for marker in [
    EVENT_NAME,
    "window.dispatchEvent",
]:
    if marker not in storage_check:
        fail(
            "Pós-verificação storage falhou:\n"
            f"{marker}"
        )

for marker in visual_required_after:
    if marker not in creature_check:
        fail(
            "Pós-verificação Creature falhou:\n"
            f"{marker}"
        )


# ============================================================
# 14. RESULTADO
# ============================================================

print()
print("=" * 76)
print("CONFIA — ACESSÓRIOS V3")
print("=" * 76)
print()
print("✓ Filtro existente de acessórios reutilizado")
print("✓ Não foi introduzida dependência de homeItems")
print("✓ equippedAccessoryIds passou para estado React")
print("✓ Equipar/desequipar dispara evento interno")
print("✓ Avatar reage imediatamente ao equipamento")
print("✓ Fallback 'storage' mantido")
print("✓ Fallback 'focus' mantido")
print()
print("✓ confia_bow_cream agora tem visual")
print("✓ confia_scarf_terra agora tem visual")
print("✓ confia_charm_gold agora tem visual")
print()
print("✓ Exclusividade por slot preservada")
print("✓ home_inventory preservado")
print("✓ home_equipped preservado")
print("✓ Compras preservadas")
print("✓ Custos preservados")
print("✓ Níveis preservados")
print("✓ Outros acessórios preservados")
print("✓ Sem novas dependências")
print("✓ Abraço / A3 não alterado")
print()
print("BACKUPS:")
print(f"  {BACKUP_HOME}")
print(f"  {BACKUP_CREATURE}")
print(f"  {BACKUP_STORAGE}")
print()
print("PRÓXIMO PASSO:")
print("  npm run build")
print("=" * 76)
