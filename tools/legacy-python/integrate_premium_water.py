from pathlib import Path

path = Path("src/components/HomeWorld.tsx")
text = path.read_text()

# ---------------------------------------------------------
# 1. Adicionar import
# ---------------------------------------------------------

import_line = 'import PremiumWater from "./world/PremiumWater";'

if import_line not in text:
    marker = 'import PremiumPath from "./world/PremiumPath";'

    if marker in text:
        text = text.replace(
            marker,
            marker + '\n' + import_line
        )
    else:
        raise SystemExit(
            "ERRO: não encontrei o import de PremiumPath."
        )

# ---------------------------------------------------------
# 2. Adicionar PremiumWater
# ---------------------------------------------------------

if "<PremiumWater />" not in text:

    marker = "<PremiumPath />"

    if marker in text:
        text = text.replace(
            marker,
            marker + '\n<PremiumWater />'
        )
    else:
        raise SystemExit(
            "ERRO: não encontrei <PremiumPath />."
        )

path.write_text(text)

print("✓ PremiumWater integrado no HomeWorld.")
print("✓ O backup water-backup continua intacto.")
