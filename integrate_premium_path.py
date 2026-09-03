from pathlib import Path

path = Path("src/components/HomeWorld.tsx")
text = path.read_text()

import_line = 'import PremiumPath from "./world/PremiumPath";'

if import_line not in text:
    marker = 'import PremiumGround from "./world/PremiumGround";'
    if marker in text:
        text = text.replace(
            marker,
            marker + "\n" + import_line
        )
    else:
        raise SystemExit("ERRO: import PremiumGround não encontrado.")

component = "<PremiumPath />"

if component not in text:
    marker = "<PremiumGround />"
    if marker in text:
        text = text.replace(
            marker,
            marker + "\n" + component
        )
    else:
        raise SystemExit("ERRO: PremiumGround não encontrado.")

path.write_text(text)

print("✓ PremiumPath integrado no HomeWorld.")
