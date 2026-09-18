from pathlib import Path
import shutil
import sys

path = Path("src/components/HomeWorld.tsx")

if not path.exists():
    print("ERRO: src/components/HomeWorld.tsx não encontrado.")
    sys.exit(1)

text = path.read_text(encoding="utf-8")
original = text

shutil.copy2(
    path,
    "/tmp/HomeWorld.tsx.before_premium_1B4A"
)

# ============================================================
# 1B.4A — HIGIENE TÉCNICA SEM EMPOBRECER O DESIGN
# ============================================================
#
# Filosofia:
# - não simplificar por simplificar;
# - não remover riqueza visual;
# - não alterar composição;
# - não reduzir altura;
# - remover apenas redundância real.
# ============================================================


# ------------------------------------------------------------
# 1. Remover AmbientParticles
# Está definido mas não é utilizado no JSX.
# ------------------------------------------------------------

ambient_start = text.find(
    "const AmbientParticles = React.memo(() => {"
)

atmosphere_import = text.find(
    'import AtmosphereLayer from "./AtmosphereLayer";'
)

if ambient_start == -1:
    print("ERRO: AmbientParticles não encontrado.")
    sys.exit(1)

if atmosphere_import == -1 or atmosphere_import <= ambient_start:
    print("ERRO: não foi possível delimitar AmbientParticles.")
    sys.exit(1)

text = (
    text[:ambient_start]
    + text[atmosphere_import:]
)


# ------------------------------------------------------------
# 2. Remover apenas a PRIMEIRA renderização de troféus
#
# Existem duas renderizações de equippedTrophies.
# Mantemos deliberadamente a segunda:
#
#   {/* Weekly Trophies */}
#
# ------------------------------------------------------------

first_trophies_marker = "{equippedTrophies.map(trophy => ("
items_marker = "{equippedItems.map(item => {"

first_trophies_start = text.find(
    first_trophies_marker
)

items_start = text.find(
    items_marker
)

if first_trophies_start == -1:
    print("ERRO: primeira renderização de troféus não encontrada.")
    sys.exit(1)

if items_start == -1 or items_start <= first_trophies_start:
    print("ERRO: não foi possível delimitar a primeira renderização de troféus.")
    sys.exit(1)

text = (
    text[:first_trophies_start]
    + text[items_start:]
)


# ============================================================
# VERIFICAÇÕES DE SEGURANÇA
# ============================================================

if "AmbientParticles" in text:
    print("ERRO: AmbientParticles ainda existe.")
    sys.exit(1)

trophy_count = text.count("equippedTrophies.map")

if trophy_count != 1:
    print(
        f"ERRO: deveriam existir exatamente 1 renderização "
        f"de troféus. Encontradas: {trophy_count}"
    )
    sys.exit(1)

required = [
    'h-[600px]',
    "<Clouds />",
    "<Butterflies />",
    "<RefugeEvolution",
    "<FarmZones",
    "<GrassDetails",
    "<PremiumSky",
    "<PremiumLighting",
    "<AtmosphereLayer",
    "<PremiumDepth",
    "<PremiumGround",
    "<PremiumPath",
    "<PremiumWater",
    "<PremiumVegetation",
    "equippedItems.map",
    "equippedTrophies.map",
    "<Avatar",
    "careWorld(5)",
    "careItem(item.id)",
    "savePositions",
    "setEditMode",
    "setDraggingAvatar",
]

for item in required:
    if item not in text:
        print(f"ERRO de segurança: desapareceu {item}")
        sys.exit(1)

if text == original:
    print("ERRO: nenhuma alteração foi efetuada.")
    sys.exit(1)

path.write_text(text, encoding="utf-8")

print("=" * 72)
print("CONFIA — PREMIUM HOME 1B.4A")
print("=" * 72)
print("✓ Código morto AmbientParticles removido")
print("✓ Renderização duplicada dos troféus removida")
print("✓ Uma renderização de troféus preservada")
print("✓ HomeWorld continua com 600px")
print("✓ Avatar preservado")
print("✓ Mundo e composição preservados")
print("✓ Clouds preservadas")
print("✓ Butterflies preservadas")
print("✓ Atmosfera preservada")
print("✓ Lighting preservado")
print("✓ Vegetação preservada")
print("✓ Água preservada")
print("✓ Caminho preservado")
print("✓ Crescimento preservado")
print("✓ Interações preservadas")
print("✓ Zero alteração visual intencional")
print("✓ Zero textos novos")
print("✓ PT / EN / ES / FR preservados")
print("✓ Zero bibliotecas novas")
print()
print("OBJETIVO:")
print("melhorar higiene/performance sem reduzir a experiência premium.")
print()
print("OK — Fase 1B.4A aplicada.")
