from pathlib import Path
from datetime import datetime

FILE = Path("src/components/Companheiro/ConfiaCreature.tsx")

if not FILE.exists():
    raise SystemExit(f"ERRO: não encontrei {FILE}")

text = FILE.read_text(encoding="utf-8")
original = text

# ============================================================
# BACKUP
# ============================================================

stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
backup = FILE.with_name(
    FILE.name + f".before_accessory_alignment_{stamp}"
)
backup.write_text(text, encoding="utf-8")

# ============================================================
# 1. CRIAR TRANSFORMS ESPECÍFICOS
# ============================================================

anchor = '''          : "translate(110 82) scale(1.02) translate(-110 -82)";

  const neckAccessoryTransform ='''

replacement = '''          : "translate(110 82) scale(1.02) translate(-110 -82)";

  /*
   * CONFIA — alinhamento fino dos acessórios.
   *
   * A transformação base continua responsável pela evolução
   * e escala da criatura. Estas duas âncoras apenas ajustam
   * verticalmente cada família visual.
   */
  const headTopAccessoryTransform =
    `${headAccessoryTransform} translate(0 6)`;

  const faceAccessoryTransform =
    `${headAccessoryTransform} translate(0 7)`;

  const neckAccessoryTransform ='''

if "const headTopAccessoryTransform" not in text:
    if anchor not in text:
        raise SystemExit(
            "ERRO: não encontrei o ponto de inserção dos transforms."
        )

    text = text.replace(anchor, replacement, 1)

# ============================================================
# FUNÇÃO AUXILIAR
# ============================================================

def replace_transform_after(
    source: str,
    marker: str,
    old_transform: str,
    new_transform: str,
    max_distance: int = 800,
):
    start = source.find(marker)

    if start == -1:
        raise SystemExit(f"ERRO: não encontrei {marker}")

    pos = source.find(old_transform, start)

    if pos == -1 or pos - start > max_distance:
        raise SystemExit(
            f"ERRO: não encontrei o transform esperado após {marker}"
        )

    return (
        source[:pos]
        + new_transform
        + source[pos + len(old_transform):]
    )

# ============================================================
# 2. LAÇO CREME ESPECIAL
# ============================================================

old_cream_bow = (
    '<g transform={`${headAccessoryTransform} translate(0 1)`}>'
)

new_cream_bow = (
    '<g transform={`${headTopAccessoryTransform} translate(0 1)`}>'
)

if old_cream_bow in text:
    text = text.replace(old_cream_bow, new_cream_bow, 1)

# ============================================================
# 3. ACESSÓRIOS SOBRE A CABEÇA
# ============================================================

head_markers = [
    'hasAccessory("confia_bow_terra")',
    'hasAccessory("confia_flower_daisy")',
    'hasAccessory("confia_headband_cream")',
    'hasAccessory("confia_beret_terra")',
    'hasAccessory("confia_beanie_cream")',
    'hasAccessory("confia_hat_garden")',
    'hasAccessory("confia_tiara_star")',
    'hasAccessory("confia_crown_leaf")',
    'hasAccessory("confia_crown_gold")',
]

for marker in head_markers:
    text = replace_transform_after(
        text,
        marker,
        "<g transform={headAccessoryTransform}>",
        "<g transform={headTopAccessoryTransform}>",
    )

# ============================================================
# 4. ÓCULOS / FACE
# ============================================================

face_markers = [
    'hasAccessory("confia_glasses_round")',
    'hasAccessory("confia_glasses_terra")',
    'hasAccessory("confia_glasses_gold")',
    'hasAccessory("confia_glasses_sun")',
    'hasAccessory("confia_glasses_heart")',
]

for marker in face_markers:
    text = replace_transform_after(
        text,
        marker,
        "<g transform={headAccessoryTransform}>",
        "<g transform={faceAccessoryTransform}>",
    )

# ============================================================
# 5. VALIDAÇÕES
# ============================================================

if text == original:
    raise SystemExit("ERRO: nenhuma alteração foi necessária.")

checks = [
    "const headTopAccessoryTransform",
    "const faceAccessoryTransform",
    '<g transform={headTopAccessoryTransform}>',
    '<g transform={faceAccessoryTransform}>',
]

for check in checks:
    if check not in text:
        raise SystemExit(
            f"ERRO DE VALIDAÇÃO: não encontrei {check}"
        )

FILE.write_text(text, encoding="utf-8")

print("=" * 72)
print("CONFIA — ALINHAMENTO DOS ACESSÓRIOS")
print("=" * 72)
print()
print("✓ transform base preservado")
print("✓ chapéus/coroas/tiaras/flores/laços: +6 Y")
print("✓ todos os óculos: +7 Y")
print("✓ fases de evolução preservadas")
print("✓ SVG dos acessórios não alterado")
print("✓ inventário não alterado")
print()
print(f"Backup: {backup}")
print()
print("CORREÇÃO CONCLUÍDA ✓")
