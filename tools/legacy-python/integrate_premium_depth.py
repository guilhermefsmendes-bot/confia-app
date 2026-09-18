from pathlib import Path

path = Path("src/components/HomeWorld.tsx")
text = path.read_text()

import_line = 'import PremiumDepth from "./world/PremiumDepth";'

if import_line not in text:
    marker = 'import PremiumVegetation from "./world/PremiumVegetation";'
    text = text.replace(
        marker,
        marker + "\n" + import_line
    )

component = "<PremiumDepth />"

if component not in text:
    marker = "<PremiumVegetation />"
    text = text.replace(
        marker,
        component + "\n" + marker
    )

path.write_text(text)

print("✓ PremiumDepth integrado no HomeWorld.")
