from pathlib import Path
import shutil
import sys
import re

path = Path("src/components/world/PremiumGround.tsx")

if not path.exists():
    print("ERRO: PremiumGround.tsx não encontrado.")
    sys.exit(1)

text = path.read_text(encoding="utf-8")
original = text

shutil.copy2(
    path,
    "/tmp/PremiumGround.tsx.before_path_consolidation"
)

# ============================================================
# CONFIA — 1B.4B.6
# PREMIUM PATH CONSOLIDATION
#
# PremiumGround fica responsável por:
# - terreno
# - variação
# - sombra
# - pedras
# - vegetação
#
# PremiumPath fica como único responsável pelo caminho.
# ============================================================

pattern = re.compile(
    r'''
      \s*
      \{/\*\s*Caminho\s*\*/\}
      \s*
      <div
      \s*
      className="
      .*?
      "
      \s*
      />
    ''',
    re.DOTALL | re.VERBOSE
)

text, count = pattern.subn("\n", text, count=1)

if count != 1:
    print("ERRO: não foi possível identificar exatamente um caminho em PremiumGround.")
    sys.exit(1)

# ------------------------------------------------------------
# Verificações
# ------------------------------------------------------------

required = [
    "Terreno base",
    "Variação simples do terreno",
    "Sombra inferior",
    "Pedras",
    "Vegetação",
    "stones.map",
    "grassClusters.map",
    "export default memo(PremiumGround)",
]

for item in required:
    if item not in text:
        print(f"ERRO: conteúdo importante desapareceu: {item}")
        sys.exit(1)

# Estas propriedades pertenciam ao caminho antigo.
for old in [
    'left-[38%]',
    'bottom-[-8%]',
    'w-[28%]',
    'h-[62%]',
    'rotate-[7deg]',
]:
    if old in text:
        print(f"ERRO: vestígio do caminho antigo encontrado: {old}")
        sys.exit(1)

if text == original:
    print("ERRO: nenhuma alteração efetuada.")
    sys.exit(1)

path.write_text(text, encoding="utf-8")

print("=" * 72)
print("CONFIA — HOMEWORLD 1B.4B.6")
print("=" * 72)
print("✓ Caminho antigo removido de PremiumGround")
print("✓ PremiumGround continua responsável pelo terreno")
print("✓ Pedras do terreno preservadas")
print("✓ Vegetação do terreno preservada")
print("✓ Sombra e profundidade preservadas")
print("✓ PremiumPath não foi alterado")
print("✓ PremiumPath passa a ser o único caminho principal")
print("✓ Nenhuma alteração ao XP")
print("✓ Nenhuma alteração ao Avatar")
print("✓ Nenhum texto novo")
print("✓ PT / EN / ES / FR não afetados")
print("✓ Zero dependências novas")
print()
print("OK — caminho premium consolidado.")
