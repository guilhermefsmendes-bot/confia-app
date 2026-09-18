from pathlib import Path
import shutil
import sys
import re

PATH = Path(
    "src/components/Companheiro/ConfiaCompanionHome.tsx"
)

BACKUP = Path(
    "/tmp/ConfiaCompanionHome.tsx.before_accessories_v4b"
)

if not PATH.exists():
    print("ERRO: ficheiro não encontrado:")
    print(PATH)
    sys.exit(1)

text = PATH.read_text(encoding="utf-8")

# ============================================================
# SEGURANÇA
# ============================================================

if "CONFIA_ACCESSORIES_V4B" in text:
    print("ERRO: V4B já parece estar aplicada.")
    sys.exit(1)

old_block = '''  const readEquippedAccessoryIds = () =>
    getEquipped().filter(
    id =>
      id === "confia_bow_cream" ||
      id === "confia_scarf_terra" ||
      id === "confia_charm_gold"
  );'''

if old_block not in text:
    print("=" * 72)
    print("ERRO — BLOCO ANTIGO NÃO ENCONTRADO")
    print("=" * 72)
    print()
    print("Nenhum ficheiro foi alterado.")
    print()
    print("Mostra-me:")
    print("sed -n '1,115p' src/components/Companheiro/ConfiaCompanionHome.tsx")
    print("=" * 72)
    sys.exit(1)


# ============================================================
# 1. IMPORT DO CATÁLOGO
# ============================================================

if "getCompanionAccessories" not in text:

    # Inserimos depois do último import existente.
    matches = list(
        re.finditer(
            r'import[\s\S]*?from\s+["\'][^"\']+["\'];',
            text
        )
    )

    if not matches:
        print("ERRO: não consegui localizar os imports.")
        sys.exit(1)

    last_import = matches[-1]

    import_line = (
        '\nimport { getCompanionAccessories } '
        'from "../../data/homeItems";'
    )

    text = (
        text[:last_import.end()]
        + import_line
        + text[last_import.end():]
    )


# ============================================================
# 2. TROCAR O FILTRO MANUAL POR CATÁLOGO REAL
# ============================================================

new_block = '''  // CONFIA_ACCESSORIES_V4B
  // O catálogo é a fonte de verdade para acessórios visuais.
  const readEquippedAccessoryIds = () => {
    const equipped = getEquipped();

    return getCompanionAccessories()
      .filter(accessory =>
        equipped.includes(accessory.id)
      )
      .map(accessory => accessory.id);
  };'''

text = text.replace(
    old_block,
    new_block,
    1
)


# ============================================================
# 3. VALIDAÇÕES
# ============================================================

checks = {
    "marker V4B":
        "CONFIA_ACCESSORIES_V4B",

    "catálogo":
        "getCompanionAccessories()",

    "equipados":
        "const equipped = getEquipped();",

    "filtro real":
        "equipped.includes(accessory.id)",

    "map final":
        ".map(accessory => accessory.id)",

    "evento V3":
        '"confia:equipment-changed"',

    "passagem para Avatar":
        "equippedAccessoryIds={",
}

missing = [
    name
    for name, marker in checks.items()
    if marker not in text
]

if missing:
    print("=" * 72)
    print("ERRO — VALIDAÇÃO FALHOU")
    print("=" * 72)
    for name in missing:
        print("✗", name)
    print()
    print("Nenhum ficheiro foi escrito.")
    sys.exit(1)

# O filtro manual antigo tem obrigatoriamente de desaparecer.
if (
    'id === "confia_bow_cream" ||' in text
    and
    'id === "confia_scarf_terra" ||' in text
):
    print("ERRO: filtro manual antigo ainda presente.")
    sys.exit(1)


# ============================================================
# 4. BACKUP + GRAVAÇÃO
# ============================================================

shutil.copy2(PATH, BACKUP)

PATH.write_text(
    text,
    encoding="utf-8"
)


# ============================================================
# RESULTADO
# ============================================================

print()
print("=" * 72)
print("CONFIA — ACESSÓRIOS V4B")
print("=" * 72)
print()
print("✓ Filtro manual de 3 acessórios removido")
print("✓ Catálogo real passa a definir os acessórios")
print("✓ Todos os acessórios equipados podem chegar ao avatar")
print("✓ confia_beanie_cream incluído automaticamente")
print("✓ confia_hat_garden incluído automaticamente")
print("✓ Cabeça / face / pescoço / corpo preservados")
print("✓ Mão / aura / skin / marca preservados")
print("✓ Chama / olhos preservados")
print("✓ Evento interno da V3 preservado")
print("✓ Atualização imediata preservada")
print("✓ Avatar.tsx não alterado")
print("✓ ConfiaCreature.tsx não alterado")
print("✓ Inventário não alterado")
print("✓ Loja não alterada")
print("✓ Sem novas dependências")
print()
print("Backup:")
print(f"  {BACKUP}")
print()
print("ANTES DO BUILD, confirma com:")
print()
print(
    "grep -n -A 16 -B 4 "
    '"CONFIA_ACCESSORIES_V4B" '
    "src/components/Companheiro/ConfiaCompanionHome.tsx"
)
print("=" * 72)
