from pathlib import Path
import shutil
import re

ROOT = Path.home() / "src"

FILES = {
    "items": ROOT / "data/homeItems.ts",
    "storage": ROOT / "storage/homeInventory.ts",
    "inventory": ROOT / "components/HomeInventory.tsx",
    "shop": ROOT / "components/HomeShop.tsx",
}

for path in FILES.values():
    if not path.exists():
        raise SystemExit(f"ERRO: ficheiro não encontrado: {path}")

# ============================================================
# BACKUPS
# ============================================================

for path in FILES.values():
    backup = Path(str(path) + ".before_b1_cleanup")
    shutil.copy2(path, backup)
    print(f"Backup: {backup}")

# ============================================================
# 1. homeItems.ts
# Remover catálogo antigo, mantendo acessórios CONFIA.
# ============================================================

path = FILES["items"]
text = path.read_text(encoding="utf-8")

start = text.find("export const homeItems: HomeItem[] = [")
marker = text.find("  // A5.2 — Acessórios da CONFIA", start)

if start == -1 or marker == -1:
    raise SystemExit(
        "ERRO: não encontrei os limites esperados em homeItems.ts"
    )

prefix_end = start + len("export const homeItems: HomeItem[] = [")

text = (
    text[:prefix_end]
    + "\n"
    + text[marker:]
)

path.write_text(text, encoding="utf-8")

# ============================================================
# 2. homeInventory.ts
#
# - novos utilizadores começam sem itens
# - instalações antigas são limpas defensivamente
# - mantém as mesmas storage keys
# ============================================================

path = FILES["storage"]
text = path.read_text(encoding="utf-8")

old = '''  if (saved) {
    return safeParseIdList(saved);
  }


  // Oferta inicial para novos utilizadores
  const initialInventory = ["flower1"];

  localStorage.setItem(
    INVENTORY_KEY,
    JSON.stringify(initialInventory)
  );


  return initialInventory;'''

new = '''  if (saved) {
    const inventory = safeParseIdList(saved);

    // B1 — remove IDs pertencentes ao antigo mundo.
    // Os acessórios CONFIA usam o prefixo "confia_".
    const cleanedInventory = inventory.filter(
      id => id.startsWith("confia_")
    );

    if (
      cleanedInventory.length !== inventory.length
    ) {
      localStorage.setItem(
        INVENTORY_KEY,
        JSON.stringify(cleanedInventory)
      );
    }

    return cleanedInventory;
  }


  // B1 — novos utilizadores começam sem itens antigos.
  const initialInventory: string[] = [];

  localStorage.setItem(
    INVENTORY_KEY,
    JSON.stringify(initialInventory)
  );


  return initialInventory;'''

if old not in text:
    raise SystemExit(
        "ERRO: bloco getInventory esperado não encontrado."
    )

text = text.replace(old, new, 1)

old = '''export function getEquipped(): string[] {

  const saved = localStorage.getItem(EQUIPPED_KEY);

  return safeParseIdList(saved);

}'''

new = '''export function getEquipped(): string[] {

  const saved = localStorage.getItem(EQUIPPED_KEY);

  const equipped = safeParseIdList(saved);

  // B1 — remove equipamento pertencente ao antigo mundo.
  const cleanedEquipped = equipped.filter(
    id => id.startsWith("confia_")
  );

  if (
    cleanedEquipped.length !== equipped.length
  ) {
    localStorage.setItem(
      EQUIPPED_KEY,
      JSON.stringify(cleanedEquipped)
    );
  }

  return cleanedEquipped;

}'''

if old not in text:
    raise SystemExit(
        "ERRO: bloco getEquipped esperado não encontrado."
    )

text = text.replace(old, new, 1)

path.write_text(text, encoding="utf-8")

# ============================================================
# 3. HomeInventory
#
# Já só existirão acessórios no catálogo.
# Retiramos apenas a variável legacyItems se existir.
# ============================================================

path = FILES["inventory"]
text = path.read_text(encoding="utf-8")

text = re.sub(
    r'\n\s*const legacyItems\s*=\s*\n\s*items\.filter'
    r'\(item => !isCompanionAccessory\(item\)\);\n',
    '\n',
    text,
    count=1,
)

path.write_text(text, encoding="utf-8")

# ============================================================
# 4. HomeShop
# Retirar variável legacyItems.
# ============================================================

path = FILES["shop"]
text = path.read_text(encoding="utf-8")

text = re.sub(
    r'\n\s*const legacyItems\s*=\s*\n\s*homeItems\.filter\('
    r'\s*item => !isCompanionAccessory\(item\)\s*\);\n',
    '\n',
    text,
    count=1,
)

path.write_text(text, encoding="utf-8")

# ============================================================
# VALIDAÇÃO
# ============================================================

items_text = FILES["items"].read_text(encoding="utf-8")

legacy_patterns = [
    "flower1",
    "tree1",
    "animal1",
    "calm1",
    "magic1",
    "water1",
    "rare1",
]

remaining = [
    item for item in legacy_patterns
    if item in items_text
]

if remaining:
    raise SystemExit(
        "ERRO: ainda existem IDs legacy no catálogo: "
        + ", ".join(remaining)
    )

print()
print("=" * 68)
print("CONFIA — B1 LIMPEZA DO MUNDO ANTIGO")
print("=" * 68)
print()
print("✓ Catálogo antigo removido")
print("✓ flower1 deixou de ser oferta inicial")
print("✓ home_inventory preservado")
print("✓ home_equipped preservado")
print("✓ IDs antigos são limpos em instalações existentes")
print("✓ Acessórios CONFIA preservados")
print("✓ XP preservado")
print("✓ Sem novo storage")
print("✓ Sem timers")
print("✓ Sem dependências")
print()
print("B1 concluído.")
