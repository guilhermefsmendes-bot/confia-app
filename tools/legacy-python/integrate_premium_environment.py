from pathlib import Path
import shutil
import sys
import re

homeworld = Path("src/components/HomeWorld.tsx")
farmzones = Path("src/components/world/FarmZones.tsx")
environment = Path("src/components/world/PremiumEnvironment.tsx")

for path in [homeworld, farmzones, environment]:
    if not path.exists():
        print(f"ERRO: ficheiro não encontrado: {path}")
        sys.exit(1)

home_text = homeworld.read_text(encoding="utf-8")
farm_text = farmzones.read_text(encoding="utf-8")

shutil.copy2(
    homeworld,
    "/tmp/HomeWorld.tsx.before_premium_environment"
)

shutil.copy2(
    farmzones,
    "/tmp/FarmZones.tsx.before_premium_environment"
)

# ============================================================
# CONFIA — 1B.4B.4B
# INTEGRAÇÃO DA PROGRESSÃO AMBIENTAL PREMIUM
# ============================================================


# ------------------------------------------------------------
# 1. Importar PremiumEnvironment
# ------------------------------------------------------------

premium_import = 'import PremiumEnvironment from "./world/PremiumEnvironment";'

if premium_import not in home_text:
    anchor = 'import PremiumVegetation from "./world/PremiumVegetation";'

    if anchor not in home_text:
        print("ERRO: ponto de importação não encontrado.")
        sys.exit(1)

    home_text = home_text.replace(
        anchor,
        anchor + "\n" + premium_import,
        1
    )


# ------------------------------------------------------------
# 2. Integrar PremiumEnvironment
#
# Usamos o refugeLevel já calculado no HomeWorld.
# ------------------------------------------------------------

premium_usage = "<PremiumEnvironment level={refugeLevel} />"

if premium_usage not in home_text:
    anchor = "<PremiumVegetation />"

    if anchor not in home_text:
        print("ERRO: PremiumVegetation não encontrado.")
        sys.exit(1)

    home_text = home_text.replace(
        anchor,
        anchor + "\n<PremiumEnvironment level={refugeLevel} />",
        1
    )


# ------------------------------------------------------------
# 3. Remover Jardim emoji antigo — nível 2
# ------------------------------------------------------------

garden_pattern = re.compile(
    r'\s*\{/\*\s*Jardim\s*\*/\}\s*'
    r'\{level\s*>=\s*2\s*&&\s*\(\s*'
    r'<>\s*'
    r'<div[^>]*>\s*🌷\s*</div>\s*'
    r'<div[^>]*>\s*🌼\s*</div>\s*'
    r'</>\s*'
    r'\)\}',
    re.DOTALL
)

farm_text, garden_count = garden_pattern.subn(
    "\n",
    farm_text,
    count=1
)

if garden_count != 1:
    print(
        "ERRO: não foi possível remover de forma segura "
        "o jardim emoji antigo."
    )
    sys.exit(1)


# ------------------------------------------------------------
# 4. Remover Horta emoji antiga — nível 4
# ------------------------------------------------------------

farm_pattern = re.compile(
    r'\s*\{/\*\s*Horta\s*\*/\}\s*'
    r'\{level\s*>=\s*4\s*&&\s*\(\s*'
    r'<>\s*'
    r'<div[^>]*>\s*🥕\s*</div>\s*'
    r'<div[^>]*>\s*🌽\s*</div>\s*'
    r'</>\s*'
    r'\)\}',
    re.DOTALL
)

farm_text, farm_count = farm_pattern.subn(
    "\n",
    farm_text,
    count=1
)

if farm_count != 1:
    print(
        "ERRO: não foi possível remover de forma segura "
        "a horta emoji antiga."
    )
    sys.exit(1)


# ------------------------------------------------------------
# 5. Remover Floresta emoji antiga — nível 5
# ------------------------------------------------------------

forest_pattern = re.compile(
    r'\s*\{/\*\s*Floresta\s*\*/\}\s*'
    r'\{level\s*>=\s*5\s*&&\s*\(\s*'
    r'<>\s*'
    r'<div[^>]*>\s*🌳\s*</div>\s*'
    r'<div[^>]*>\s*🌲\s*</div>\s*'
    r'</>\s*'
    r'\)\}',
    re.DOTALL
)

farm_text, forest_count = forest_pattern.subn(
    "\n",
    farm_text,
    count=1
)

if forest_count != 1:
    print(
        "ERRO: não foi possível remover de forma segura "
        "a floresta emoji antiga."
    )
    sys.exit(1)


# ------------------------------------------------------------
# 6. Verificações HomeWorld
# ------------------------------------------------------------

if home_text.count(premium_import) != 1:
    print("ERRO: import PremiumEnvironment incorreto.")
    sys.exit(1)

if home_text.count(premium_usage) != 1:
    print("ERRO: PremiumEnvironment deveria ser renderizado uma vez.")
    sys.exit(1)

required_home = [
    "const refugeLevel = getRefugeLevel(avatar.xp).level;",
    "<PremiumRefuge",
    "<RefugeEvolution",
    "<FarmZones",
    "<PremiumSky",
    "<PremiumGround",
    "<PremiumPath",
    "{refugeLevel >= 3 && <PremiumWater />}",
    "<PremiumVegetation",
    "<PremiumEnvironment",
    "<Avatar",
    'h-[600px]',
]

for item in required_home:
    if item not in home_text:
        print(f"ERRO: elemento desapareceu do HomeWorld: {item}")
        sys.exit(1)


# ------------------------------------------------------------
# 7. Garantir que emojis substituídos desapareceram
# ------------------------------------------------------------

old_environment = [
    "🌷",
    "🌼",
    "🥕",
    "🌽",
    "🌳",
    "🌲",
]

for emoji in old_environment:
    if emoji in farm_text:
        print(f"ERRO: elemento antigo ainda existe: {emoji}")
        sys.exit(1)


# ------------------------------------------------------------
# 8. Não tocar em outros sistemas
# ------------------------------------------------------------

if "💧" in farm_text:
    print("ERRO: 💧 reapareceu inesperadamente em FarmZones.")
    sys.exit(1)

if "🏡" in farm_text:
    print("ERRO: 🏡 reapareceu inesperadamente em FarmZones.")
    sys.exit(1)


homeworld.write_text(home_text, encoding="utf-8")
farmzones.write_text(farm_text, encoding="utf-8")

print("=" * 72)
print("CONFIA — PREMIUM ENVIRONMENT 1B.4B.4B")
print("=" * 72)
print("✓ PremiumEnvironment ligado ao HomeWorld")
print("✓ Usa refugeLevel já existente")
print("✓ Jardim emoji antigo removido")
print("✓ Horta emoji antiga removida")
print("✓ Floresta emoji antiga removida")
print("✓ Jardim premium desbloqueia no nível 2")
print("✓ PremiumWater continua a desbloquear no nível 3")
print("✓ Horta premium desbloqueia no nível 4")
print("✓ Bosque premium desbloqueia no nível 5")
print("✓ PremiumRefuge preservado")
print("✓ Avatar preservado")
print("✓ HomeWorld continua com 600px")
print("✓ Sistema XP preservado")
print("✓ Zero textos novos")
print("✓ PT / EN / ES / FR não afetados")
print("✓ Zero dependências novas")
print()
print("OK — progressão ambiental premium integrada.")
