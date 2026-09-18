from pathlib import Path
import shutil
import sys

path = Path("src/components/HomeWorld.tsx")

if not path.exists():
    print("ERRO: HomeWorld.tsx não encontrado.")
    sys.exit(1)

text = path.read_text(encoding="utf-8")
original = text

shutil.copy2(
    path,
    "/tmp/HomeWorld.tsx.before_remove_farmzones"
)

# ============================================================
# CONFIA — 1B.4B.4C
# REMOÇÃO DO FARMZONES LEGADO
# ============================================================

farm_import = 'import FarmZones from "./world/FarmZones";'
farm_usage = '<FarmZones xp={avatar.xp} />'

if farm_import not in text:
    print("ERRO: import FarmZones não encontrado.")
    sys.exit(1)

if farm_usage not in text:
    print("ERRO: utilização FarmZones não encontrada.")
    sys.exit(1)

if text.count(farm_import) != 1:
    print("ERRO: número inesperado de imports FarmZones.")
    sys.exit(1)

if text.count(farm_usage) != 1:
    print("ERRO: número inesperado de utilizações FarmZones.")
    sys.exit(1)

text = text.replace(farm_import + "\n", "", 1)
text = text.replace(farm_usage + "\n", "", 1)

# ============================================================
# VERIFICAÇÕES
# ============================================================

if "FarmZones" in text:
    print("ERRO: ainda existe referência a FarmZones no HomeWorld.")
    sys.exit(1)

required = [
    "const refugeLevel = getRefugeLevel(avatar.xp).level;",
    "<RefugeEvolution",
    "<PremiumRefuge",
    "<PremiumEnvironment",
    "{refugeLevel >= 3 && <PremiumWater />}",
    "<PremiumSky",
    "<PremiumLighting",
    "<PremiumDepth",
    "<PremiumGround",
    "<PremiumPath",
    "<PremiumVegetation",
    "<Avatar",
    'h-[600px]',
]

for item in required:
    if item not in text:
        print(f"ERRO: elemento importante desapareceu: {item}")
        sys.exit(1)

if text == original:
    print("ERRO: nenhuma alteração efetuada.")
    sys.exit(1)

path.write_text(text, encoding="utf-8")

print("=" * 72)
print("CONFIA — HOMEWORLD 1B.4B.4C")
print("=" * 72)
print("✓ Import FarmZones removido")
print("✓ Renderização FarmZones removida")
print("✓ PremiumRefuge preservado")
print("✓ PremiumEnvironment preservado")
print("✓ PremiumWater progressivo preservado")
print("✓ RefugeEvolution preservado")
print("✓ Avatar preservado")
print("✓ Mundo premium preservado")
print("✓ HomeWorld continua com 600px")
print("✓ FarmZones.tsx ainda mantido no projeto por segurança")
print("✓ Zero alteração visual esperada")
print("✓ Zero textos novos")
print("✓ PT / EN / ES / FR não afetados")
print("✓ Zero dependências novas")
print()
print("OK — FarmZones desligado do HomeWorld.")
