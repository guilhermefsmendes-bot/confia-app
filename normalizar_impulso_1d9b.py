from pathlib import Path
import shutil
import sys

FILE = Path("src/data/reactive/reactiveEngine.ts")


def fail(message):
    print(f"ERRO: {message}")
    sys.exit(1)


print("=" * 72)
print("CONFIA — NORMALIZAÇÃO DO MEMORY SCORE — 1D.9B")
print("=" * 72)

if not FILE.exists():
    fail("reactiveEngine.ts não encontrado.")

original = FILE.read_text(encoding="utf-8")
text = original


# ============================================================
# 1. VALIDAR BASE
# ============================================================

required = [
    "const getMemoryScore = (",
    "1D.9A — SCORING SEM DUPLICAÇÃO",
    "if (memory.recentEffectiveImpulse) {",
    "if (hasImpulseContinuity) {",
    'tags.includes("strategy")',
    'tags.includes("impulse")',
    "const repeatedImpulseNeed =",
]

for fragment in required:
    if fragment not in text:
        fail("estrutura esperada não encontrada: " + fragment)

if "1D.9B — NORMALIZAÇÃO DO IMPULSO" in text:
    fail("A 1D.9B parece já estar aplicada.")


# ============================================================
# 2. BLOCO ATUAL DA CONTINUIDADE DO IMPULSO
# ============================================================

old = '''      if (hasImpulseContinuity) {
        if (tags.includes("learning")) {
          score += 2;
        }

        if (tags.includes("strategy")) {
          score += 2;
        }

        if (tags.includes("impulse")) {
          score += 2;
        }

        if (
          repeatedImpulseNeed &&
          tags.includes(repeatedImpulseNeed)
        ) {
          score += 3;
        }
      }'''

new = '''      /**
       * 1D.9B — NORMALIZAÇÃO DO IMPULSO
       *
       * Uma estratégia eficaz recente já reforça as tags
       * "impulse" e "strategy" no bloco anterior.
       *
       * A continuidade não deve duplicar automaticamente
       * esse mesmo reforço. Quando existe experiência eficaz
       * recente, usamos a continuidade apenas para acrescentar
       * informação mais específica: aprendizagem e necessidade.
       *
       * Se não existe recentEffectiveImpulse, a continuidade
       * pode continuar a reforçar impulse/strategy por si só.
       */
      if (hasImpulseContinuity) {
        if (tags.includes("learning")) {
          score += 2;
        }

        if (!memory.recentEffectiveImpulse) {
          if (tags.includes("strategy")) {
            score += 2;
          }

          if (tags.includes("impulse")) {
            score += 2;
          }
        }

        if (
          repeatedImpulseNeed &&
          tags.includes(repeatedImpulseNeed)
        ) {
          score += 3;
        }
      }'''

if text.count(old) != 1:
    fail(
        "bloco de continuidade do Impulso "
        "não encontrado de forma única."
    )

text = text.replace(old, new, 1)


# ============================================================
# 3. DELIMITAR MEMORY SCORE
# ============================================================

start = text.find("const getMemoryScore = (")
end = text.find(
    "const rankCandidates = (",
    start
)

if start == -1 or end == -1:
    fail("não foi possível delimitar getMemoryScore.")

score_block = text[start:end]


# ============================================================
# 4. VALIDAR NORMALIZAÇÃO
# ============================================================

required_after = [
    "1D.9B — NORMALIZAÇÃO DO IMPULSO",
    "if (!memory.recentEffectiveImpulse) {",
    'tags.includes("strategy")',
    'tags.includes("impulse")',
    'tags.includes("learning")',
    "repeatedImpulseNeed &&",
]

for fragment in required_after:
    if fragment not in score_block:
        fail(
            "validação da normalização falhou: "
            + fragment
        )


# ============================================================
# 5. GARANTIR QUE RECENT EFFECTIVE CONTINUA
# ============================================================

recent_start = score_block.find(
    "if (memory.recentEffectiveImpulse) {"
)

continuity_start = score_block.find(
    "1D.9B — NORMALIZAÇÃO DO IMPULSO"
)

if recent_start == -1 or continuity_start == -1:
    fail("blocos do Impulso não encontrados.")

recent_block = score_block[
    recent_start:continuity_start
]

for fragment in [
    'tags.includes("impulse")',
    "score += 4",
    'tags.includes("strategy")',
    "score += 3",
]:
    if fragment not in recent_block:
        fail(
            "aprendizagem recente perdeu: "
            + fragment
        )


# ============================================================
# 6. HUMOR E CHECK-IN DEVEM FICAR INTACTOS
# ============================================================

preserved = [
    "continuity.repeatedCheckInNeedCount >= 2",
    "tags.includes(repeatedCheckInNeed)",
    'continuityMood === "improving"',
    'continuityMood === "declining"',
    'continuityMood === "stable"',
    'memory.moodDirection === "improving"',
    'memory.moodDirection === "declining"',
]

for fragment in preserved:
    if fragment not in score_block:
        fail(
            "lógica que devia ser preservada desapareceu: "
            + fragment
        )


# ============================================================
# 7. CONVERGÊNCIA 1D.9A DEVE PERMANECER
# ============================================================

if "continuity.signalCount >= 2" not in score_block:
    fail("convergência desapareceu.")

if (
    "hasImpulseContinuity &&" not in score_block or
    'tags.includes("learning")' not in score_block
):
    fail(
        "proteção de learning da 1D.9A desapareceu."
    )


# ============================================================
# 8. RANKING NÃO É ALTERADO
# ============================================================

ranking = text[end:]

for fragment in [
    "getUseCount(a.id)",
    "getUseCount(b.id)",
    "getMemoryScore(a)",
    "getMemoryScore(b)",
    "return bMemoryScore - aMemoryScore",
]:
    if fragment not in ranking:
        fail(
            "ranking existente perdeu: "
            + fragment
        )


# ============================================================
# 9. GARANTIR QUE NÃO HÁ NOVAS RESPONSABILIDADES
# ============================================================

for forbidden in [
    "localStorage.setItem(",
    "useEffect(",
]:
    if forbidden in score_block:
        fail(
            "getMemoryScore ganhou responsabilidade indevida: "
            + forbidden
        )


if text == original:
    fail("nenhuma alteração foi produzida.")


# ============================================================
# 10. BACKUP + WRITE
# ============================================================

backup = Path(
    "/tmp/reactiveEngine.ts.before_1d9b"
)

shutil.copy2(FILE, backup)

FILE.write_text(
    text,
    encoding="utf-8"
)


print("✓ Sobreposição do Impulso normalizada")
print("✓ Estratégia eficaz recente mantém impulse +4")
print("✓ Estratégia eficaz recente mantém strategy +3")
print("✓ Continuidade deixa de duplicar impulse/strategy")
print("✓ Continuidade isolada continua a ter peso próprio")
print("✓ Learning do Impulso preservado")
print("✓ Necessidade repetida do Impulso preservada")
print("✓ Check-In preservado")
print("✓ Humor preservado")
print("✓ Convergência 1D.9A preservada")
print("✓ Variedade continua acima do memoryScore")
print("✓ Ranking preservado")
print("✓ Nenhum storage novo")
print("✓ Nenhum listener novo")
print("✓ Nenhuma dependência nova")
print("✓ Nenhuma tradução necessária")
print(f"✓ Backup: {backup}")
print("=" * 72)
print("OK — 1D.9B APLICADA")
print("=" * 72)
