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
    "/tmp/HomeWorld.tsx.before_remove_refuge_evolution"
)

# ============================================================
# CONFIA — 1B.4B.5
# REMOÇÃO DO REFUGEEVOLUTION LEGADO
# ============================================================

old_import = 'import RefugeEvolution from "./world/RefugeEvolution";'
old_usage = '<RefugeEvolution xp={avatar.xp} />'

if text.count(old_import) != 1:
    print("ERRO: import RefugeEvolution ausente ou duplicado.")
    sys.exit(1)

if text.count(old_usage) != 1:
    print("ERRO: renderização RefugeEvolution ausente ou duplicada.")
    sys.exit(1)

# Remover apenas import e utilização
text = text.replace(old_import + "\n", "", 1)
text = text.replace(old_usage + "\n", "", 1)

# ============================================================
# VERIFICAÇÕES
# ============================================================

if "RefugeEvolution" in text:
    print("ERRO: ainda existe referência a RefugeEvolution no HomeWorld.")
    sys.exit(1)

required = [
    "const refugeLevel = getRefugeLevel(avatar.xp).level;",
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

# Garantir que não reintroduzimos sistemas antigos
for legacy in ["FarmZones", "RefugeEvolution"]:
    if legacy in text:
        print(f"ERRO: sistema legado ainda presente: {legacy}")
        sys.exit(1)

if text == original:
    print("ERRO: nenhuma alteração efetuada.")
    sys.exit(1)

path.write_text(text, encoding="utf-8")

print("=" * 72)
print("CONFIA — HOMEWORLD 1B.4B.5")
print("=" * 72)
print("✓ Import RefugeEvolution removido")
print("✓ Renderização RefugeEvolution removida")
print("✓ Emojis antigos deixam de fazer parte do HomeWorld")
print("✓ PremiumRefuge preservado")
print("✓ PremiumEnvironment preservado")
print("✓ PremiumWater progressivo preservado")
print("✓ Progressão continua ligada ao XP")
print("✓ Avatar preservado")
print("✓ Céu, iluminação e profundidade preservados")
print("✓ HomeWorld continua com 600px")
print("✓ RefugeEvolution.tsx mantido no projeto por segurança")
print("✓ FarmZones continua desligado")
print("✓ Zero textos novos")
print("✓ PT / EN / ES / FR não afetados")
print("✓ Zero dependências novas")
print()
print("OK — RefugeEvolution desligado do HomeWorld.")
