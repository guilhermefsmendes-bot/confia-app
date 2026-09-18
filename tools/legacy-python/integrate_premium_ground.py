from pathlib import Path

path = Path("src/components/HomeWorld.tsx")
text = path.read_text()

import_line = 'import PremiumGround from "./world/PremiumGround";'

if import_line not in text:
    marker = 'import PremiumDepth from "./world/PremiumDepth";'
    text = text.replace(
        marker,
        marker + "\n" + import_line
    )

component = "<PremiumGround />"

if component not in text:
    marker = "<PremiumDepth />"
    text = text.replace(
        marker,
        marker + "\n" + component
    )

path.write_text(text)

print("✓ PremiumGround integrado no HomeWorld.")
