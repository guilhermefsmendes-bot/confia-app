from pathlib import Path
import shutil
import sys

home = Path("src/components/HomeWorld.tsx")
depth = Path("src/components/world/PremiumDepth.tsx")

for path in [home, depth]:
    if not path.exists():
        print(f"ERRO: ficheiro não encontrado: {path}")
        sys.exit(1)

home_text = home.read_text(encoding="utf-8")
depth_text = depth.read_text(encoding="utf-8")

shutil.copy2(home, "/tmp/HomeWorld.tsx.before_depth_1B4B7")
shutil.copy2(depth, "/tmp/PremiumDepth.tsx.before_depth_1B4B7")

# ============================================================
# 1. AVATAR
# z20 -> z35
# Fica acima de:
# - refúgio z22
# - terreno detalhado z24/25
# - objetos/troféus z30
#
# Continua abaixo dos controlos z50.
# ============================================================

old_avatar = 'className="absolute z-20 cursor-move"'
new_avatar = 'className="absolute z-[35] cursor-move"'

if home_text.count(old_avatar) != 1:
    print("ERRO: z-index atual do Avatar não encontrado exatamente uma vez.")
    sys.exit(1)

home_text = home_text.replace(old_avatar, new_avatar, 1)

# ============================================================
# 2. PREMIUM DEPTH — FOREGROUND
# z45 -> z28
#
# Continua à frente do terreno/refúgio em alguns pontos,
# mas deixa de cobrir objetos, Avatar e controlos.
# ============================================================

old_depth = 'className="absolute bottom-0 pointer-events-none origin-bottom z-[45]"'
new_depth = 'className="absolute bottom-0 pointer-events-none origin-bottom z-[28]"'

if depth_text.count(old_depth) != 1:
    print("ERRO: foreground z45 de PremiumDepth não encontrado exatamente uma vez.")
    sys.exit(1)

depth_text = depth_text.replace(old_depth, new_depth, 1)

# ============================================================
# VERIFICAÇÕES
# ============================================================

if 'z-[35] cursor-move' not in home_text:
    print("ERRO: Avatar não ficou em z35.")
    sys.exit(1)

if 'z-[28]' not in depth_text:
    print("ERRO: PremiumDepth não ficou em z28.")
    sys.exit(1)

if 'z-[45]' in depth_text:
    print("ERRO: z45 ainda existe em PremiumDepth.")
    sys.exit(1)

# Controlos continuam no topo
if 'top-4 right-4 z-50' not in home_text:
    print("ERRO: z50 dos controlos foi alterado.")
    sys.exit(1)

# Objetos continuam em z30
if home_text.count("z-30") < 2:
    print("ERRO: z30 dos objetos/troféus parece ter sido alterado.")
    sys.exit(1)

# Elementos premium essenciais continuam presentes
required = [
    "<PremiumRefuge",
    "<PremiumEnvironment",
    "<PremiumPath",
    "<PremiumGround",
    "<PremiumVegetation",
    "<PremiumDepth",
    "<Avatar",
]

for item in required:
    if item not in home_text:
        print(f"ERRO: elemento importante desapareceu: {item}")
        sys.exit(1)

home.write_text(home_text, encoding="utf-8")
depth.write_text(depth_text, encoding="utf-8")

print("=" * 72)
print("CONFIA — HOMEWORLD 1B.4B.7")
print("=" * 72)
print("✓ Avatar elevado de z20 para z35")
print("✓ Avatar acima dos objetos equipados z30")
print("✓ Foreground ambiental reduzido de z45 para z28")
print("✓ Profundidade ambiental preservada")
print("✓ Objetos e troféus continuam em z30")
print("✓ Controlos continuam em z50")
print("✓ Refúgio preservado")
print("✓ Terreno, caminho e água preservados")
print("✓ Nenhuma alteração ao XP")
print("✓ Nenhum texto novo")
print("✓ PT / EN / ES / FR não afetados")
print("✓ Zero dependências novas")
print()
print("OK — hierarquia de profundidade corrigida.")
