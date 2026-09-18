from pathlib import Path
import shutil
import sys

ROOT = Path.cwd()

HOME = ROOT / "src/components/Companheiro/ConfiaCompanionHome.tsx"
CREATURE = ROOT / "src/components/Companheiro/ConfiaCreature.tsx"

BACKUP_HOME = Path("/tmp/ConfiaCompanionHome.tsx.before_accessory_fix")
BACKUP_CREATURE = Path("/tmp/ConfiaCreature.tsx.before_accessory_fix")


def fail(msg):
    print("\nERRO\n")
    print(msg)
    sys.exit(1)


if not HOME.exists():
    fail(f"Não encontrei {HOME}")

if not CREATURE.exists():
    fail(f"Não encontrei {CREATURE}")

home = HOME.read_text(encoding="utf-8")
creature = CREATURE.read_text(encoding="utf-8")

if "const equippedAccessoryIds = getEquipped().filter(" not in home:
    fail("Não encontrei o cálculo atual de equippedAccessoryIds.")

if 'from "react"' not in home and "from 'react'" not in home:
    fail("Não encontrei o import do React.")

if "confia_bow_cream" in creature:
    fail("A correção já parece estar aplicada.")

shutil.copy2(HOME, BACKUP_HOME)
shutil.copy2(CREATURE, BACKUP_CREATURE)

# ------------------------------------------------------------
# 1. Tornar o equipamento reativo
# ------------------------------------------------------------

if "useState" not in home.split("\n")[0:20].__str__():
    home = home.replace(
        'import { memo } from "react";',
        'import { memo, useState } from "react";'
    )
    home = home.replace(
        "import { memo } from 'react';",
        "import { memo, useState } from 'react';"
    )

anchor = """  const equippedAccessoryIds = getEquipped().filter(
    id => homeItems.some(item =>
      item.id === id && item.companionKind === "accessory"
    )
  );"""

if anchor not in home:
    fail("Não encontrei o bloco equipado esperado.")

replacement = """  const [equippedAccessoryIds, setEquippedAccessoryIds] = useState(
    () =>
      getEquipped().filter(
        id =>
          homeItems.some(
            item =>
              item.id === id &&
              item.companionKind === "accessory"
          )
      )
  );

  const refreshEquippedAccessories = () => {
    setEquippedAccessoryIds(
      getEquipped().filter(
        id =>
          homeItems.some(
            item =>
              item.id === id &&
              item.companionKind === "accessory"
          )
      )
    );
  };"""

home = home.replace(anchor, replacement, 1)

# escutar mudanças de storage quando regressa ao separador
insert_anchor = "  const progress ="

if insert_anchor not in home:
    fail("Não encontrei ponto de inserção.")

home = home.replace(
    insert_anchor,
    """  useEffect(() => {
    const refresh = () => refreshEquippedAccessories();

    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

""" + insert_anchor,
    1
)

home = home.replace(
    'import { memo, useState } from "react";',
    'import { memo, useEffect, useState } from "react";'
)

home = home.replace(
    "import { memo, useState } from 'react';",
    "import { memo, useEffect, useState } from 'react';"
)

# ------------------------------------------------------------
# 2. Adicionar os 3 acessórios em falta
# ------------------------------------------------------------

head_anchor = '            {/* HEAD */}'

if head_anchor not in creature:
    fail("Não encontrei a secção HEAD.")

head_insert = '''            {hasAccessory("confia_bow_cream") && (
              <g transform={headAccessoryTransform}>
                <path
                  d="M92 54 C78 42 62 46 64 60 C66 74 84 72 96 62
                     C108 72 126 74 128 60 C130 46 114 42 100 54
                     Z"
                  fill="#F3E4D8"
                  stroke="#C9A38E"
                  strokeWidth="3"
                />
                <circle
                  cx="96"
                  cy="60"
                  r="7"
                  fill="#D7B29D"
                />
              </g>
            )}

'''

creature = creature.replace(
    head_anchor,
    head_insert + head_anchor,
    1
)

neck_anchor = '            {/* NECK */}'

neck_insert = '''            {hasAccessory("confia_scarf_terra") && (
              <g transform={neckAccessoryTransform}>
                <path
                  d="M72 126 Q96 144 120 126 L126 144 Q96 160 66 144 Z"
                  fill="#B96F56"
                  stroke="#8E4F3D"
                  strokeWidth="3"
                />
              </g>
            )}

            {hasAccessory("confia_charm_gold") && (
              <g transform={neckAccessoryTransform}>
                <line
                  x1="96"
                  y1="128"
                  x2="96"
                  y2="150"
                  stroke="#C99B3D"
                  strokeWidth="3"
                />
                <circle
                  cx="96"
                  cy="154"
                  r="7"
                  fill="#E5C45A"
                  stroke="#B98A28"
                  strokeWidth="2"
                />
              </g>
            )}

'''

if neck_anchor not in creature:
    fail("Não encontrei a secção NECK.")

creature = creature.replace(
    neck_anchor,
    neck_insert + neck_anchor,
    1
)

HOME.write_text(home, encoding="utf-8")
CREATURE.write_text(creature, encoding="utf-8")

print("\n" + "=" * 72)
print("CONFIA — CORREÇÃO DOS ACESSÓRIOS")
print("=" * 72)
print("✓ Avatar passa a atualizar o equipamento ao regressar ao separador")
print("✓ confia_bow_cream adicionado")
print("✓ confia_scarf_terra adicionado")
print("✓ confia_charm_gold adicionado")
print("✓ Restantes acessórios preservados")
print("✓ Abraço A3 não alterado")
print()
print("Backups:")
print(BACKUP_HOME)
print(BACKUP_CREATURE)
print()
print("Próximo passo:")
print("  npm run build")
print("=" * 72)
