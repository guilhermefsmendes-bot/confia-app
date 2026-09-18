from pathlib import Path

file = Path("src/components/HomeWorld.tsx")

text = file.read_text(encoding="utf-8")

# ---------------------------------------------------------
# 1. Adicionar import do PremiumSky
# ---------------------------------------------------------

import_line = 'import PremiumSky from "./world/PremiumSky";'

if import_line not in text:
    marker = 'import GrassTexture from "./world/GrassTexture";'

    if marker not in text:
        raise SystemExit("ERRO: import GrassTexture não encontrado.")

    text = text.replace(
        marker,
        marker + "\n" + import_line,
        1
    )


# ---------------------------------------------------------
# 2. Substituir o sistema antigo de céu
# ---------------------------------------------------------

old_sky = """{/* Céu dinâmico */}
<div
  className={`absolute top-0 left-0 right-0 h-56 z-0 transition-all duration-1000 ${
    isNight
      ? "bg-gradient-to-b from-indigo-900 to-slate-700"
      : "bg-gradient-to-b from-sky-300 to-sky-100"
  }`}
/>

{isNight ? (
  <div className="absolute top-6 right-10 text-5xl animate-pulse">
    🌙
  </div>
) : (
  <div className="absolute top-6 right-10 text-5xl animate-pulse">
    ☀️
  </div>
)}
"""

new_sky = """{/* Céu cinematográfico premium */}
<PremiumSky isNight={isNight} />
"""

if old_sky in text:
    text = text.replace(old_sky, new_sky, 1)

elif "<PremiumSky isNight={isNight} />" not in text:
    raise SystemExit(
        "ERRO: bloco antigo do céu não encontrado. "
        "Nenhuma alteração foi feita."
    )


# ---------------------------------------------------------
# 3. Guardar
# ---------------------------------------------------------

file.write_text(text, encoding="utf-8")

print("✓ PremiumSky integrado no HomeWorld.")
print("✓ Sistema antigo de céu substituído.")
print("✓ Nenhuma outra parte do mundo foi alterada.")
