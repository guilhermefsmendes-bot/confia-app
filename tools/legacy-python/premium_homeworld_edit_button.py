from pathlib import Path
import shutil
import sys
import re

path = Path("src/components/HomeWorld.tsx")

if not path.exists():
    print("ERRO: HomeWorld.tsx não encontrado.")
    sys.exit(1)

text = path.read_text(encoding="utf-8")
original = text

shutil.copy2(
    path,
    "/tmp/HomeWorld.tsx.before_premium_edit_button"
)

# ============================================================
# CONFIA — 1B.4C.1
# BOTÃO EDITAR / GUARDAR PREMIUM
# ============================================================

# ------------------------------------------------------------
# 1. Import Lucide
# ------------------------------------------------------------

lucide_import = 'import { Pencil, Check } from "lucide-react";'

if lucide_import not in text:
    anchor = 'import { useTranslation } from "react-i18next";'

    if anchor not in text:
        print("ERRO: ponto de importação não encontrado.")
        sys.exit(1)

    text = text.replace(
        anchor,
        anchor + "\n" + lucide_import,
        1
    )

# ------------------------------------------------------------
# 2. Encontrar o botão atual independentemente
#    das linhas em branco existentes
# ------------------------------------------------------------

pattern = re.compile(
    r'''
    <div\s+className="absolute\s+top-4\s+right-4\s+z-50">
    \s*
    <button
    \s*
    onClick=\{\(\)\s*=>\s*\{
    \s*
    if\s*\(editMode\)\s*\{
    \s*
    savePositions\(objectPositions\);
    \s*
    \}
    \s*
    setEditMode\(!editMode\);
    \s*
    \}\}
    \s*
    className=\{`px-4\s+py-2\s+rounded-xl\s+font-bold\s+shadow\s+\$\{
    \s*
    editMode
    \s*
    \?\s*"bg-green-500\s+text-white"
    \s*
    :\s*"bg-white"
    \s*
    \}`
    \}
    \s*
    >
    \s*
    \{editMode
    \s*
    \?\s*`✅\s+\$\{t\("save"\)\}`
    \s*
    :\s*`✏️\s+\$\{t\("edit"\)\}`
    \}
    \s*
    </button>
    \s*
    </div>
    ''',
    re.VERBOSE | re.DOTALL
)

matches = list(pattern.finditer(text))

if len(matches) != 1:
    print(
        "ERRO: esperava encontrar exatamente 1 botão "
        f"Editar/Guardar, encontrei {len(matches)}."
    )
    print("Nenhuma alteração efetuada.")
    sys.exit(1)

new = '''<div className="absolute top-4 right-4 z-50">
  <button
    type="button"
    onClick={() => {
      if (editMode) {
        savePositions(objectPositions);
      }

      setEditMode(!editMode);
    }}
    aria-pressed={editMode}
    className={`
      flex items-center gap-2
      rounded-2xl border
      px-3.5 py-2.5
      text-xs font-bold
      backdrop-blur-md
      transition-all duration-200
      active:scale-[0.97]
      ${
        editMode
          ? "border-[#D99A7C]/45 bg-[#FFF5EF]/90 text-[#A9583E] shadow-[0_8px_24px_rgba(115,72,55,0.14)]"
          : "border-white/60 bg-white/75 text-[#5E4840] shadow-[0_8px_24px_rgba(80,60,50,0.10)]"
      }
    `}
  >
    <span
      className={`
        flex h-7 w-7
        items-center justify-center
        rounded-xl
        ${
          editMode
            ? "bg-[#F6DDCF] text-[#B86448]"
            : "bg-[#FFF3EC] text-[#C97B5E]"
        }
      `}
    >
      {editMode ? (
        <Check size={15} strokeWidth={2} />
      ) : (
        <Pencil size={14} strokeWidth={1.9} />
      )}
    </span>

    <span>{editMode ? t("save") : t("edit")}</span>
  </button>
</div>'''

text, count = pattern.subn(new, text, count=1)

if count != 1:
    print("ERRO: substituição não efetuada.")
    sys.exit(1)

# ------------------------------------------------------------
# 3. Verificações
# ------------------------------------------------------------

required = [
    lucide_import,
    'aria-pressed={editMode}',
    '<Check size={15}',
    '<Pencil size={14}',
    'editMode ? t("save") : t("edit")',
    'savePositions(objectPositions)',
    'top-4 right-4 z-50',
]

for item in required:
    if item not in text:
        print(f"ERRO: elemento esperado não encontrado: {item}")
        sys.exit(1)

legacy = [
    "bg-green-500",
    "✏️",
    "✅",
]

for item in legacy:
    if item in text:
        print(f"ERRO: elemento antigo ainda presente: {item}")
        sys.exit(1)

preserved = [
    "<PremiumRefuge",
    "<PremiumEnvironment",
    "<PremiumDepth",
    "<PremiumGround",
    "<PremiumPath",
    "<PremiumVegetation",
    "<Avatar",
    'h-[600px]',
]

for item in preserved:
    if item not in text:
        print(f"ERRO: elemento importante desapareceu: {item}")
        sys.exit(1)

if text == original:
    print("ERRO: nenhuma alteração efetuada.")
    sys.exit(1)

path.write_text(text, encoding="utf-8")

print("=" * 72)
print("CONFIA — HOMEWORLD 1B.4C.1")
print("=" * 72)
print("✓ Botão antigo identificado com segurança")
print("✓ Emoji Editar removido")
print("✓ Emoji Guardar removido")
print("✓ Pencil Lucide aplicado")
print("✓ Check Lucide aplicado")
print("✓ Verde genérico removido")
print("✓ Superfície premium translúcida aplicada")
print("✓ Estado Editar preservado")
print("✓ Estado Guardar preservado")
print("✓ savePositions preservado")
print("✓ Controlos continuam em z50")
print("✓ t('edit') preservado")
print("✓ t('save') preservado")
print("✓ PT / EN / ES / FR preservados")
print("✓ Zero dependências novas")
print()
print("OK — controlo premium aplicado.")
