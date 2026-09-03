from pathlib import Path
import shutil

path = (
    Path.home()
    / "src/components/Companheiro/ConfiaCreature.tsx"
)

if not path.exists():
    raise SystemExit(f"ERRO: não encontrei {path}")

backup = Path(
    "/tmp/ConfiaCreature.tsx.before_b2_1_accessory_anchors"
)

shutil.copy2(path, backup)

text = path.read_text(encoding="utf-8")

# ============================================================
# 1. INSERIR ÂNCORAS ADAPTATIVAS
# ============================================================

needle = '''  const bodyScale =
    stage === 2
      ? 0.84
      : stage === 3
        ? 0.91
        : stage === 4
          ? 0.97
          : 1.02;

'''

replacement = '''  const bodyScale =
    stage === 2
      ? 0.84
      : stage === 3
        ? 0.91
        : stage === 4
          ? 0.97
          : 1.02;

  /**
   * ==========================================================
   * B2.1 — ÂNCORAS ADAPTATIVAS DOS ACESSÓRIOS
   * ==========================================================
   *
   * Um acessório mantém sempre o mesmo ID.
   *
   * Quando a CONFIA evolui, apenas mudam:
   * - posição
   * - escala
   * - pequeno ajuste visual
   *
   * Não existe novo estado.
   * Não existe animação.
   * Não existe novo storage.
   *
   * As coordenadas continuam no mesmo viewBox da criatura.
   */

  const headAccessoryTransform =
    stage === 2
      ? "translate(110 82) scale(0.84) translate(-110 -82) translate(0 7)"
      : stage === 3
        ? "translate(110 82) scale(0.91) translate(-110 -82) translate(0 4)"
        : stage === 4
          ? "translate(110 82) scale(0.97) translate(-110 -82) translate(0 2)"
          : "translate(110 82) scale(1.02) translate(-110 -82)";

  const neckAccessoryTransform =
    stage === 2
      ? "translate(110 134) scale(0.84) translate(-110 -134) translate(0 -5)"
      : stage === 3
        ? "translate(110 134) scale(0.91) translate(-110 -134) translate(0 -3)"
        : stage === 4
          ? "translate(110 134) scale(0.97) translate(-110 -134) translate(0 -1)"
          : "translate(110 134) scale(1.02) translate(-110 -134)";

  const bodyAccessoryTransform =
    stage === 2
      ? "translate(110 151) scale(0.84) translate(-110 -151)"
      : stage === 3
        ? "translate(110 151) scale(0.91) translate(-110 -151)"
        : stage === 4
          ? "translate(110 151) scale(0.97) translate(-110 -151)"
          : "translate(110 151) scale(1.02) translate(-110 -151)";

  const handAccessoryTransform =
    stage === 2
      ? "translate(110 154) scale(0.84) translate(-110 -154)"
      : stage === 3
        ? "translate(110 154) scale(0.91) translate(-110 -154)"
        : stage === 4
          ? "translate(110 154) scale(0.97) translate(-110 -154)"
          : "translate(110 154) scale(1.02) translate(-110 -154)";

  const auraAccessoryTransform =
    stage === 2
      ? "translate(110 130) scale(0.88) translate(-110 -130)"
      : stage === 3
        ? "translate(110 130) scale(0.94) translate(-110 -130)"
        : stage === 4
          ? "translate(110 130) scale(0.99) translate(-110 -130)"
          : "translate(110 130) scale(1.04) translate(-110 -130)";

'''

if needle not in text:
    raise SystemExit(
        "ERRO: não encontrei o bloco bodyScale esperado."
    )

text = text.replace(needle, replacement, 1)

# ============================================================
# 2. LAÇO -> ÂNCORA DA CABEÇA
# ============================================================

old = '''          <g
            aria-hidden="true"
            transform="translate(0 1)"
          >'''

new = '''          <g
            aria-hidden="true"
            transform={`${headAccessoryTransform} translate(0 1)`}
          >'''

if old not in text:
    raise SystemExit(
        "ERRO: grupo SVG do laço não encontrado."
    )

text = text.replace(old, new, 1)

# ============================================================
# 3. LENÇO -> ÂNCORA DO PESCOÇO
# ============================================================

old = '''        {!isEgg && hasTerraScarf && (
          <g aria-hidden="true">'''

new = '''        {!isEgg && hasTerraScarf && (
          <g
            aria-hidden="true"
            transform={neckAccessoryTransform}
          >'''

if old not in text:
    raise SystemExit(
        "ERRO: grupo SVG do lenço não encontrado."
    )

text = text.replace(old, new, 1)

# ============================================================
# 4. AMULETO -> ÂNCORA DO PESCOÇO
# ============================================================

old = '''        {!isEgg && hasGoldCharm && (
          <g aria-hidden="true">'''

new = '''        {!isEgg && hasGoldCharm && (
          <g
            aria-hidden="true"
            transform={neckAccessoryTransform}
          >'''

if old not in text:
    raise SystemExit(
        "ERRO: grupo SVG do amuleto não encontrado."
    )

text = text.replace(old, new, 1)

path.write_text(text, encoding="utf-8")

# ============================================================
# VALIDAÇÃO
# ============================================================

check = path.read_text(encoding="utf-8")

required = [
    "headAccessoryTransform",
    "neckAccessoryTransform",
    "bodyAccessoryTransform",
    "handAccessoryTransform",
    "auraAccessoryTransform",
    "transform={`${headAccessoryTransform} translate(0 1)`}",
    "transform={neckAccessoryTransform}",
]

missing = [
    item for item in required
    if item not in check
]

if missing:
    raise SystemExit(
        "ERRO: validação incompleta: "
        + ", ".join(missing)
    )

print()
print("=" * 72)
print("CONFIA — B2.1 ÂNCORAS ADAPTATIVAS DE ACESSÓRIOS")
print("=" * 72)
print()
print("✓ Cabeça adaptativa")
print("✓ Pescoço adaptativo")
print("✓ Corpo preparado")
print("✓ Mão preparada")
print("✓ Aura preparada")
print("✓ Laço adaptado às formas")
print("✓ Lenço adaptado às formas")
print("✓ Amuleto adaptado às formas")
print("✓ Mesmo item permanece equipado após evolução")
print("✓ Sem novo estado React")
print("✓ Sem timers")
print("✓ Sem animações permanentes")
print("✓ Sem novo storage")
print("✓ Sem dependências")
print()
print(f"Backup: {backup}")
print()
print("B2.1 concluído.")
