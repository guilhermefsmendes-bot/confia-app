from pathlib import Path
import shutil
import re

print("=" * 60)
print(" CONFIA — OTIMIZAÇÃO DAS CAMADAS VISUAIS DO MUNDO")
print("=" * 60)

files = [
    "src/components/world/Clouds.tsx",
    "src/components/world/Butterflies.tsx",
    "src/components/world/RefugeEvolution.tsx",
    "src/components/world/FarmZones.tsx",
    "src/components/world/GrassTexture.tsx",
    "src/components/world/GrassDetails.tsx",
    "src/components/world/PremiumSky.tsx",
    "src/components/world/PremiumLighting.tsx",
    "src/components/world/PremiumDepth.tsx",
    "src/components/world/PremiumGround.tsx",
    "src/components/world/PremiumPath.tsx",
    "src/components/world/PremiumWater.tsx",
    "src/components/world/PremiumVegetation.tsx",
]

changed = []
skipped = []

for filename in files:
    path = Path(filename)

    if not path.exists():
        print(f"⚠ Não encontrado: {filename}")
        skipped.append(filename)
        continue

    text = path.read_text(encoding="utf-8")

    # Já otimizado
    if "memo(" in text or "React.memo(" in text:
        print(f"→ Já otimizado: {filename}")
        skipped.append(filename)
        continue

    # Procurar:
    # export default function Nome(...)
    match = re.search(
        r"export\s+default\s+function\s+([A-Za-z_$][\w$]*)\s*\(",
        text
    )

    if not match:
        print(f"⚠ Não foi possível localizar componente: {filename}")
        skipped.append(filename)
        continue

    component_name = match.group(1)

    # Backup
    backup = path.with_suffix(path.suffix + ".memo-backup")

    if not backup.exists():
        shutil.copy2(path, backup)
        print(f"✓ Backup criado: {backup}")

    # Adicionar memo ao import de React.
    # Se já houver import de React, acrescentamos memo.
    react_import = re.search(
        r'import\s+React(?:\s*,\s*\{([^}]*)\})?\s+from\s+[\'"]react[\'"]\s*;?',
        text
    )

    if react_import:
        existing = react_import.group(1)

        if existing:
            names = [x.strip() for x in existing.split(",") if x.strip()]

            if "memo" not in names:
                names.append("memo")

            new_import = (
                'import React, { '
                + ", ".join(names)
                + ' } from "react";'
            )
        else:
            new_import = 'import React, { memo } from "react";'

        text = (
            text[:react_import.start()]
            + new_import
            + text[react_import.end():]
        )

    else:
        # Caso não exista import React
        text = 'import { memo } from "react";\n' + text

    # Retirar "export default" da declaração
    old = f"export default function {component_name}"
    new = f"function {component_name}"

    if old not in text:
        print(f"⚠ Não foi possível alterar export: {filename}")
        skipped.append(filename)
        continue

    text = text.replace(old, new, 1)

    # Adicionar export memo no final.
    text = text.rstrip() + f"\n\nexport default memo({component_name});\n"

    path.write_text(text, encoding="utf-8")

    print(f"✓ React.memo aplicado: {component_name}")
    changed.append(filename)


print()
print("=" * 60)
print(" RESULTADO")
print("=" * 60)

print(f"\nAlterados: {len(changed)}")
for f in changed:
    print(f"  ✓ {f}")

print(f"\nIgnorados: {len(skipped)}")
for f in skipped:
    print(f"  → {f}")

print()
print("Nenhuma lógica foi alterada.")
print("Nenhuma prop foi alterada.")
print("Nenhuma navegação foi alterada.")
print("Nenhum localStorage foi alterado.")
print()
print("=" * 60)
