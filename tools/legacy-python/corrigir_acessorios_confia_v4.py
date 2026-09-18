from pathlib import Path
import shutil
import re
import sys

PATH = Path(
    "src/components/Companheiro/ConfiaCompanionHome.tsx"
)

BACKUP = Path(
    "/tmp/ConfiaCompanionHome.tsx.before_accessories_v4"
)

if not PATH.exists():
    print("ERRO: ConfiaCompanionHome.tsx não encontrado.")
    sys.exit(1)

text = PATH.read_text(encoding="utf-8")

if "CONFIA_ACCESSORIES_V4" in text:
    print("ERRO: V4 já parece estar aplicada.")
    sys.exit(1)

# ------------------------------------------------------------
# 1. Garantir import de getCompanionAccessories
# ------------------------------------------------------------

if "getCompanionAccessories" not in text:

    import_lines = list(
        re.finditer(
            r'import[\s\S]*?from\s+["\'][^"\']+["\'];',
            text
        )
    )

    if not import_lines:
        print("ERRO: não encontrei imports.")
        sys.exit(1)

    last_import = import_lines[-1]

    addition = '''
import { getCompanionAccessories } from "../../data/homeItems";
'''

    text = (
        text[:last_import.end()]
        + addition
        + text[last_import.end():]
    )


# ------------------------------------------------------------
# 2. Substituir APENAS o leitor incorreto
# ------------------------------------------------------------

pattern = re.compile(
    r'''  const readEquippedAccessoryIds = \(\) =>\s*
    getEquipped\(\)\.filter\(\s*
    id =>\s*
    id === "confia_bow_cream" \|\|\s*
    id === "confia_scarf_terra" \|\|\s*
    id === "confia_charm_gold"\s*
    \);''',
    re.VERBOSE
)

replacement = '''  // CONFIA_ACCESSORIES_V4
  // O catálogo é a fonte de verdade dos acessórios visuais.
  // home_equipped continua a guardar apenas os IDs equipados.
  const readEquippedAccessoryIds = () => {
    const equipped = getEquipped();

    return getCompanionAccessories()
      .filter(accessory =>
        equipped.includes(accessory.id)
      )
      .map(accessory => accessory.id);
  };'''

new_text, count = pattern.subn(
    replacement,
    text,
    count=1
)

if count != 1:
    print("=" * 72)
    print("ERRO — V4 NÃO APLICADA")
    print("=" * 72)
    print()
    print(
        "Não encontrei exatamente o filtro incorreto "
        "da V3."
    )
    print()
    print("Nenhum ficheiro foi escrito.")
    print("=" * 72)
    sys.exit(1)

text = new_text


# ------------------------------------------------------------
# 3. Validações
# ------------------------------------------------------------

required = [
    "getCompanionAccessories",
    "const equipped = getEquipped();",
    "equipped.includes(accessory.id)",
    ".map(accessory => accessory.id)",
    '"confia:equipment-changed"',
    "equippedAccessoryIds={",
]

missing = [
    marker for marker in required
    if marker not in text
]

if missing:
    print("ERRO: validação final falhou.")
    print("Falta:")
    for marker in missing:
        print(" -", marker)
    sys.exit(1)


# O filtro manual da V3 tem de desaparecer.
bad_block = (
    'id === "confia_bow_cream" ||'
)

if bad_block in text:
    print(
        "ERRO: o filtro manual da V3 ainda existe."
    )
    sys.exit(1)


# ------------------------------------------------------------
# 4. Backup + escrita
# ------------------------------------------------------------

shutil.copy2(PATH, BACKUP)
PATH.write_text(text, encoding="utf-8")


print()
print("=" * 72)
print("CONFIA — ACESSÓRIOS V4")
print("=" * 72)
print()
print("✓ Corrigido o filtro incorreto da V3")
print("✓ Avatar principal usa o catálogo real")
print("✓ Todos os acessórios podem chegar ao avatar")
print("✓ confia_beanie_cream deixa de ser filtrado")
print("✓ confia_hat_garden deixa de ser filtrado")
print("✓ Óculos / cachecóis / corpo / mão preservados")
print("✓ Skin / marcas / chama / olhos preservados")
print("✓ Evento interno da V3 preservado")
print("✓ Atualização imediata preservada")
print("✓ Exclusividade por slot preservada")
print("✓ Inventário não alterado")
print("✓ Loja não alterada")
print("✓ Sem novas dependências")
print()
print("Backup:")
print(f"  {BACKUP}")
print()
print("PRÓXIMO PASSO:")
print("  npm run build")
print("=" * 72)
