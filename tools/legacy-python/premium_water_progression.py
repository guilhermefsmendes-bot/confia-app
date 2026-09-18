from pathlib import Path
import shutil
import sys

homeworld = Path("src/components/HomeWorld.tsx")
farmzones = Path("src/components/world/FarmZones.tsx")

if not homeworld.exists() or not farmzones.exists():
    print("ERRO: ficheiro necessário não encontrado.")
    sys.exit(1)

home_text = homeworld.read_text(encoding="utf-8")
farm_text = farmzones.read_text(encoding="utf-8")

shutil.copy2(
    homeworld,
    "/tmp/HomeWorld.tsx.before_premium_water_progression"
)

shutil.copy2(
    farmzones,
    "/tmp/FarmZones.tsx.before_premium_water_progression"
)

# ------------------------------------------------------------
# 1. Garantir que HomeWorld usa getRefugeLevel
# ------------------------------------------------------------

if 'import { getRefugeLevel } from "../data/refugeProgress";' not in home_text:
    print("ERRO: import getRefugeLevel não encontrado.")
    sys.exit(1)

# ------------------------------------------------------------
# 2. Criar refugeLevel dentro do componente
# ------------------------------------------------------------

level_line = "const refugeLevel = getRefugeLevel(avatar.xp).level;"

if level_line not in home_text:
    anchor = "const hour = new Date().getHours();"

    if anchor not in home_text:
        print("ERRO: ponto de inserção do refugeLevel não encontrado.")
        sys.exit(1)

    home_text = home_text.replace(
        anchor,
        level_line + "\n\n" + anchor,
        1
    )

# ------------------------------------------------------------
# 3. PremiumWater passa a aparecer apenas no nível 3+
# ------------------------------------------------------------

if "{refugeLevel >= 3 && <PremiumWater />}" not in home_text:
    if "<PremiumWater />" not in home_text:
        print("ERRO: PremiumWater não encontrado.")
        sys.exit(1)

    home_text = home_text.replace(
        "<PremiumWater />",
        "{refugeLevel >= 3 && <PremiumWater />}",
        1
    )

# ------------------------------------------------------------
# 4. Remover apenas o lago emoji antigo de FarmZones
# ------------------------------------------------------------

old_lake = '''{/* Lago */}
{level >= 3 && (
<div className="absolute bottom-16 right-32 text-7xl">
💧
</div>
)}


'''

if old_lake not in farm_text:
    print("ERRO: bloco do lago antigo não encontrado em FarmZones.")
    sys.exit(1)

farm_text = farm_text.replace(old_lake, "", 1)

# ------------------------------------------------------------
# Verificações
# ------------------------------------------------------------

if home_text.count("const refugeLevel = getRefugeLevel(avatar.xp).level;") != 1:
    print("ERRO: refugeLevel ausente ou duplicado.")
    sys.exit(1)

if home_text.count("{refugeLevel >= 3 && <PremiumWater />}") != 1:
    print("ERRO: PremiumWater condicional incorreto.")
    sys.exit(1)

if "💧" in farm_text:
    print("ERRO: lago emoji ainda existe.")
    sys.exit(1)

required_home = [
    "<PremiumRefuge",
    "<RefugeEvolution",
    "<FarmZones",
    "<PremiumPath",
    "<PremiumVegetation",
    "<Avatar",
    'h-[600px]',
]

for item in required_home:
    if item not in home_text:
        print(f"ERRO: elemento desapareceu do HomeWorld: {item}")
        sys.exit(1)

required_farm = [
    "level >= 2",
    "level >= 4",
    "level >= 5",
    "🌷",
    "🌼",
    "🥕",
    "🌽",
    "🌳",
    "🌲",
]

for item in required_farm:
    if item not in farm_text:
        print(f"ERRO: elemento desapareceu de FarmZones: {item}")
        sys.exit(1)

homeworld.write_text(home_text, encoding="utf-8")
farmzones.write_text(farm_text, encoding="utf-8")

print("=" * 72)
print("CONFIA — PREMIUM WATER PROGRESSION 1B.4B.3")
print("=" * 72)
print("✓ refugeLevel calculado no HomeWorld")
print("✓ PremiumWater agora desbloqueia no nível 3")
print("✓ Lago emoji antigo removido")
print("✓ PremiumRefuge preservado")
print("✓ FarmZones preservado")
print("✓ Jardim preservado")
print("✓ Horta preservada")
print("✓ Floresta preservada")
print("✓ Avatar preservado")
print("✓ Sistema XP preservado")
print("✓ Zero textos novos")
print("✓ PT / EN / ES / FR não afetados")
print("✓ Zero dependências novas")
print()
print("OK — progressão premium da água aplicada.")
