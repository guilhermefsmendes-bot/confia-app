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
    "/tmp/HomeWorld.tsx.before_legacy_import_cleanup"
)

# ============================================================
# CONFIA — 1B.4C.3
# LIMPEZA SEGURA DE IMPORTS LEGADO
# ============================================================

legacy_imports = [
    'import FarmCare from "./world/FarmCare";',
    'import GardenZone from "./world/GardenZone";',
    'import FarmAnimals from "./world/FarmAnimals";',
    'import HouseEvolution from "./world/HouseEvolution";',
]

for imp in legacy_imports:
    if text.count(imp) != 1:
        print(f"ERRO: import ausente ou duplicado: {imp}")
        sys.exit(1)

for imp in legacy_imports:
    text = text.replace(imp + "\n", "", 1)

# ------------------------------------------------------------
# Verificações
# ------------------------------------------------------------

for name in [
    "FarmCare",
    "GardenZone",
    "FarmAnimals",
    "HouseEvolution",
]:
    if name in text:
        print(f"ERRO: referência legado ainda existe no HomeWorld: {name}")
        sys.exit(1)

required = [
    "<PremiumRefuge",
    "<PremiumEnvironment",
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
print("CONFIA — HOMEWORLD 1B.4C.3")
print("=" * 72)
print("✓ Import FarmCare removido")
print("✓ Import GardenZone removido")
print("✓ Import FarmAnimals removido")
print("✓ Import HouseEvolution removido")
print("✓ Ficheiros físicos mantidos")
print("✓ Mundo premium preservado")
print("✓ Avatar preservado")
print("✓ XP preservado")
print("✓ Nenhuma alteração visual")
print("✓ Nenhum texto novo")
print("✓ PT / EN / ES / FR não afetados")
print("✓ Zero dependências novas")
print()
print("OK — imports legado removidos do HomeWorld.")
