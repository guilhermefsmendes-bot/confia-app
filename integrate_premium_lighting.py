from pathlib import Path

path = Path("src/components/HomeWorld.tsx")
text = path.read_text()

# ---------------------------------------------------------
# Import
# ---------------------------------------------------------

import_line = 'import PremiumLighting from "./world/PremiumLighting";'

if import_line not in text:
    marker = 'import PremiumWater from "./world/PremiumWater";'

    if marker not in text:
        raise SystemExit(
            "ERRO: não encontrei o import de PremiumWater."
        )

    text = text.replace(
        marker,
        marker + "\n" + import_line
    )

# ---------------------------------------------------------
# Componente
# ---------------------------------------------------------

if "<PremiumLighting" not in text:
    marker = "<PremiumSky isNight={isNight} />"

    if marker not in text:
        raise SystemExit(
            "ERRO: não encontrei PremiumSky."
        )

    text = text.replace(
        marker,
        marker + "\n<PremiumLighting isNight={isNight} />"
    )

path.write_text(text)

print("✓ PremiumLighting integrado no HomeWorld.")
print("✓ Backup lighting criado.")
