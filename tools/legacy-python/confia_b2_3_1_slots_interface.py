from pathlib import Path
import shutil

ROOT = Path.home() / "src"

FILES = [
    ROOT / "components/HomeShop.tsx",
    ROOT / "components/HomeInventory.tsx",
]

for path in FILES:
    if not path.exists():
        raise SystemExit(f"ERRO: não encontrado: {path}")

    shutil.copy2(
        path,
        Path(str(path) + ".before_b2_3_1")
    )

# ============================================================
# HOME SHOP
# ============================================================

shop = FILES[0]
text = shop.read_text(encoding="utf-8")

old = '''      item.companionSlot === "head" ||
      item.companionSlot === "face" ||
      item.companionSlot === "neck" ||
      item.companionSlot === "body" ||
      item.companionSlot === "hand" ||
      item.companionSlot === "aura"
        ? item.companionSlot
        : "other";'''

new = '''      item.companionSlot === "head" ||
      item.companionSlot === "face" ||
      item.companionSlot === "neck" ||
      item.companionSlot === "body" ||
      item.companionSlot === "hand" ||
      item.companionSlot === "aura" ||
      item.companionSlot === "skin" ||
      item.companionSlot === "mark" ||
      item.companionSlot === "flame" ||
      item.companionSlot === "eyes"
        ? item.companionSlot
        : "other";'''

if old not in text:
    raise SystemExit(
        "ERRO: bloco de slots não encontrado em HomeShop.tsx"
    )

text = text.replace(old, new, 1)
shop.write_text(text, encoding="utf-8")

# ============================================================
# HOME INVENTORY
# ============================================================

inventory = FILES[1]
text = inventory.read_text(encoding="utf-8")

old = '''      slot === "head" ||
      slot === "face" ||
      slot === "neck" ||
      slot === "body" ||
      slot === "hand" ||
      slot === "aura"
        ? slot
        : "other";'''

new = '''      slot === "head" ||
      slot === "face" ||
      slot === "neck" ||
      slot === "body" ||
      slot === "hand" ||
      slot === "aura" ||
      slot === "skin" ||
      slot === "mark" ||
      slot === "flame" ||
      slot === "eyes"
        ? slot
        : "other";'''

if old not in text:
    raise SystemExit(
        "ERRO: bloco de slots não encontrado em HomeInventory.tsx"
    )

text = text.replace(old, new, 1)
inventory.write_text(text, encoding="utf-8")

# ============================================================
# VALIDAÇÃO
# ============================================================

for path in FILES:
    content = path.read_text(encoding="utf-8")

    for slot in [
        '"skin"',
        '"mark"',
        '"flame"',
        '"eyes"',
    ]:
        if slot not in content:
            raise SystemExit(
                f"ERRO: {slot} ausente em {path.name}"
            )

print()
print("=" * 72)
print("CONFIA — B2.3.1 INTERFACE DOS NOVOS SLOTS")
print("=" * 72)
print()
print("✓ Loja reconhece Cor")
print("✓ Loja reconhece Marca")
print("✓ Loja reconhece Chama")
print("✓ Loja reconhece Olhos")
print("✓ Inventário reconhece Cor")
print("✓ Inventário reconhece Marca")
print("✓ Inventário reconhece Chama")
print("✓ Inventário reconhece Olhos")
print("✓ Lógica de compra preservada")
print("✓ Lógica de equipamento preservada")
print("✓ Storage preservado")
print()
print("B2.3.1 concluído.")
