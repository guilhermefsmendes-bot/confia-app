from pathlib import Path
import shutil
import sys

homeworld = Path("src/components/HomeWorld.tsx")
farmzones = Path("src/components/world/FarmZones.tsx")

if not homeworld.exists():
    print("ERRO: HomeWorld.tsx não encontrado.")
    sys.exit(1)

if not farmzones.exists():
    print("ERRO: FarmZones.tsx não encontrado.")
    sys.exit(1)

home_text = homeworld.read_text(encoding="utf-8")
farm_text = farmzones.read_text(encoding="utf-8")

shutil.copy2(
    homeworld,
    "/tmp/HomeWorld.tsx.before_premium_refuge_integration"
)

shutil.copy2(
    farmzones,
    "/tmp/FarmZones.tsx.before_premium_refuge_integration"
)

# ============================================================
# 1B.4B.2 — INTEGRAÇÃO CONTROLADA DO PREMIUM REFUGE
# ============================================================
#
# Objetivo:
# - ligar PremiumRefuge ao HomeWorld;
# - remover apenas a casa emoji do FarmZones;
# - preservar todas as restantes zonas e progressão;
# - não alterar XP;
# - não alterar layout global;
# ============================================================


# ------------------------------------------------------------
# 1. Adicionar import do PremiumRefuge ao HomeWorld
# ------------------------------------------------------------

premium_import = 'import PremiumRefuge from "./world/PremiumRefuge";'

if premium_import not in home_text:
    anchor = 'import RefugeEvolution from "./world/RefugeEvolution";'

    if anchor not in home_text:
        print("ERRO: ponto de importação não encontrado no HomeWorld.")
        sys.exit(1)

    home_text = home_text.replace(
        anchor,
        anchor + "\n" + premium_import,
        1
    )


# ------------------------------------------------------------
# 2. Inserir PremiumRefuge junto da progressão do mundo
# ------------------------------------------------------------

premium_usage = "<PremiumRefuge xp={avatar.xp} />"

if premium_usage not in home_text:
    anchor = "<RefugeEvolution xp={avatar.xp} />"

    if anchor not in home_text:
        print("ERRO: RefugeEvolution não encontrado no JSX.")
        sys.exit(1)

    home_text = home_text.replace(
        anchor,
        anchor + "\n<PremiumRefuge xp={avatar.xp} />",
        1
    )


# ------------------------------------------------------------
# 3. Remover APENAS a casa emoji de FarmZones
# ------------------------------------------------------------

old_house = '''{/* Casa */}
<div className="absolute bottom-28 left-1/2 -translate-x-1/2 text-7xl">
🏡
</div>


'''

if old_house not in farm_text:
    print("ERRO: bloco da casa emoji não encontrado em FarmZones.")
    sys.exit(1)

farm_text = farm_text.replace(old_house, "", 1)


# ============================================================
# VERIFICAÇÕES
# ============================================================

if home_text.count(premium_import) != 1:
    print("ERRO: import PremiumRefuge duplicado ou ausente.")
    sys.exit(1)

if home_text.count(premium_usage) != 1:
    print("ERRO: PremiumRefuge deveria estar renderizado exatamente uma vez.")
    sys.exit(1)

if "🏡" in farm_text:
    print("ERRO: casa emoji ainda existe em FarmZones.")
    sys.exit(1)

required_farm = [
    "level >= 2",
    "level >= 3",
    "level >= 4",
    "level >= 5",
    "🌷",
    "🌼",
    "💧",
    "🥕",
    "🌽",
    "🌳",
    "🌲",
]

for item in required_farm:
    if item not in farm_text:
        print(f"ERRO: elemento de FarmZones desapareceu: {item}")
        sys.exit(1)

required_home = [
    "<RefugeEvolution",
    "<FarmZones",
    "<PremiumRefuge",
    "<PremiumSky",
    "<PremiumGround",
    "<PremiumPath",
    "<PremiumWater",
    "<PremiumVegetation",
    "<Avatar",
    'h-[600px]',
]

for item in required_home:
    if item not in home_text:
        print(f"ERRO: elemento do HomeWorld desapareceu: {item}")
        sys.exit(1)

homeworld.write_text(home_text, encoding="utf-8")
farmzones.write_text(farm_text, encoding="utf-8")

print("=" * 72)
print("CONFIA — PREMIUM REFUGE 1B.4B.2")
print("=" * 72)
print("✓ PremiumRefuge ligado ao HomeWorld")
print("✓ Casa emoji removida de FarmZones")
print("✓ RefugeEvolution preservado")
print("✓ Jardim preservado")
print("✓ Lago antigo preservado")
print("✓ Horta preservada")
print("✓ Floresta preservada")
print("✓ Sistema de XP preservado")
print("✓ PremiumSky preservado")
print("✓ PremiumGround preservado")
print("✓ PremiumPath preservado")
print("✓ PremiumWater preservado")
print("✓ PremiumVegetation preservada")
print("✓ Avatar preservado")
print("✓ HomeWorld continua com 600px")
print("✓ Zero textos novos")
print("✓ PT / EN / ES / FR não afetados")
print("✓ Zero dependências novas")
print()
print("OBJETIVO:")
print("testar o novo foco visual do mundo sem migrar ainda as restantes zonas.")
print()
print("OK — PremiumRefuge integrado.")
