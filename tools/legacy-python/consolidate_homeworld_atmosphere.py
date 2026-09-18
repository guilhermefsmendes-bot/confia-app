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
    "/tmp/HomeWorld.tsx.before_atmosphere_1B4C2"
)

# ============================================================
# CONFIA — 1B.4C.2
# CONSOLIDAÇÃO DA ATMOSFERA E ILUMINAÇÃO
# ============================================================

# ------------------------------------------------------------
# 1. Remover import do AtmosphereLayer legado
# ------------------------------------------------------------

old_import = 'import AtmosphereLayer from "./AtmosphereLayer";'

if text.count(old_import) != 1:
    print("ERRO: import AtmosphereLayer ausente ou duplicado.")
    sys.exit(1)

text = text.replace(old_import + "\n", "", 1)

# ------------------------------------------------------------
# 2. Remover renderização AtmosphereLayer
# ------------------------------------------------------------

old_usage = "<AtmosphereLayer />"

if text.count(old_usage) != 1:
    print("ERRO: AtmosphereLayer deveria aparecer exatamente uma vez.")
    sys.exit(1)

text = text.replace(old_usage + "\n", "", 1)

# ------------------------------------------------------------
# 3. Remover blur solar manual do HomeWorld
#
# PremiumSky mantém o corpo celeste.
# PremiumLighting mantém a iluminação/halo.
# ------------------------------------------------------------

blur_pattern = re.compile(
    r'''
    \s*
    \{/\*\s*Brilho\s+suave\s+do\s+sol\s*\*/\}
    \s*
    <div
    \s*
    className="
    \s*
    absolute
    \s*
    top-\[-80px\]
    \s*
    left-\[-80px\]
    \s*
    w-72
    \s*
    h-72
    \s*
    rounded-full
    \s*
    bg-yellow-200/30
    \s*
    blur-3xl
    \s*
    z-10
    \s*
    pointer-events-none
    \s*
    "
    \s*
    />
    ''',
    re.VERBOSE | re.DOTALL
)

text, blur_count = blur_pattern.subn("\n", text, count=1)

if blur_count != 1:
    print("ERRO: blur solar manual não foi encontrado exatamente uma vez.")
    sys.exit(1)

# ------------------------------------------------------------
# 4. Verificações
# ------------------------------------------------------------

for legacy in [
    "AtmosphereLayer",
    "bg-yellow-200/30",
    "Brilho suave do sol",
]:
    if legacy in text:
        print(f"ERRO: camada antiga ainda presente: {legacy}")
        sys.exit(1)

required = [
    "<Clouds",
    "<Butterflies",
    "<PremiumSky",
    "<PremiumLighting",
    "<PremiumDepth",
    "<PremiumGround",
    "<PremiumPath",
    "<PremiumRefuge",
    "<PremiumEnvironment",
    "<PremiumVegetation",
    "<Avatar",
    'h-[600px]',
]

for item in required:
    if item not in text:
        print(f"ERRO: elemento importante desapareceu: {item}")
        sys.exit(1)

# Garantir que céu e iluminação aparecem uma única vez
if text.count("<PremiumSky") != 1:
    print("ERRO: PremiumSky deveria existir exatamente uma vez.")
    sys.exit(1)

if text.count("<PremiumLighting") != 1:
    print("ERRO: PremiumLighting deveria existir exatamente uma vez.")
    sys.exit(1)

if text == original:
    print("ERRO: nenhuma alteração efetuada.")
    sys.exit(1)

path.write_text(text, encoding="utf-8")

print("=" * 72)
print("CONFIA — HOMEWORLD 1B.4C.2")
print("=" * 72)
print("✓ AtmosphereLayer legado desligado")
print("✓ Nuvens emoji duplicadas deixam de ser renderizadas")
print("✓ Partículas emoji deixam de ser renderizadas")
print("✓ animate-pulse legado deixa de ser renderizado")
print("✓ animate-bounce legado deixa de ser renderizado")
print("✓ Blur solar manual removido")
print("✓ PremiumSky preservado")
print("✓ PremiumLighting preservado")
print("✓ Clouds preservado")
print("✓ Butterflies preservado")
print("✓ Mundo premium preservado")
print("✓ Menos animações permanentes")
print("✓ Menos sobreposição visual")
print("✓ Nenhuma alteração ao XP")
print("✓ Nenhum texto novo")
print("✓ PT / EN / ES / FR não afetados")
print("✓ Zero dependências novas")
print()
print("OK — atmosfera premium consolidada.")
