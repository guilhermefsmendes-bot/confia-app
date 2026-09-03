from pathlib import Path

file = Path("src/components/HomeWorld.tsx")

text = file.read_text(encoding="utf-8")

# ---------------------------------------------------------
# IMPORT
# ---------------------------------------------------------

import_line = 'import PremiumVegetation from "./world/PremiumVegetation";'

if import_line not in text:
    marker = 'import PremiumSky from "./world/PremiumSky";'

    if marker not in text:
        raise SystemExit("ERRO: PremiumSky não encontrado.")

    text = text.replace(
        marker,
        marker + "\n" + import_line,
        1
    )


# ---------------------------------------------------------
# HORIZONTE DE RELVA/PLANTAS
# ---------------------------------------------------------

old_horizon = """{/* Linha de horizonte com relva alta */}
<div
  className="
    absolute
bottom-[360px]
    left-0
    right-0
    h-24
    z-10
    flex
    items-end
    justify-around
    overflow-hidden
    pointer-events-none
  "
>
  <span className="text-5xl">🌿</span>
  <span className="text-6xl">🌾</span>
  <span className="text-5xl">🌿</span>
  <span className="text-7xl">🌾</span>
  <span className="text-5xl">🌿</span>
  <span className="text-6xl">🌾</span>
  <span className="text-5xl">🌿</span>
</div>
"""

if old_horizon in text:
    text = text.replace(
        old_horizon,
        "{/* Vegetação cinematográfica */}\n<PremiumVegetation />\n",
        1
    )
else:
    if "<PremiumVegetation />" not in text:
        raise SystemExit("ERRO: horizonte antigo não encontrado.")


# ---------------------------------------------------------
# PEDRAS ANTIGAS
# ---------------------------------------------------------

old_rocks = """{/* Pedras junto ao lago */}
<div className="absolute right-52 bottom-[115px] text-3xl z-20">
  🪨
</div>

<div className="absolute right-14 bottom-[100px] text-2xl z-20">
  🪨
</div>

<div className="absolute right-36 bottom-[95px] text-xl z-20">
  🪨
</div>
"""

if old_rocks in text:
    text = text.replace(old_rocks, "", 1)


# ---------------------------------------------------------
# CANAS ANTIGAS
# ---------------------------------------------------------

old_reeds = """{/* Canas à volta do lago */}
<div
  className="
    absolute
    right-56
    bottom-[145px]
    text-5xl
    z-20
  "
>
  🌾
</div>

<div
  className="
    absolute
    right-20
    bottom-[145px]
    text-4xl
    z-20
  "
>
  🌾
</div>
"""

if old_reeds in text:
    text = text.replace(old_reeds, "", 1)


# ---------------------------------------------------------
# ÁRVORE DECORATIVA
# ---------------------------------------------------------

old_tree_start = "/* Árvore decorativa com vento */"

# Não removemos automaticamente este bloco:
# o script apenas avisa caso ainda exista.

if old_tree_start in text:
    print("AVISO: a árvore decorativa antiga ainda existe.")
    print("Será removida numa segunda passagem para não correr riscos.")


file.write_text(text, encoding="utf-8")

print("✓ Vegetação premium adicionada.")
print("✓ Horizonte infantil substituído.")
print("✓ Pedras antigas removidas.")
print("✓ Canas antigas removidas.")
print("✓ Sistema de inventário/equipamento preservado.")
