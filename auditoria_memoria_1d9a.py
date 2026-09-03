from pathlib import Path
import shutil
import sys

FILE = Path("src/data/reactive/reactiveEngine.ts")


def fail(message):
    print(f"ERRO: {message}")
    sys.exit(1)


print("=" * 72)
print("CONFIA — AUDITORIA DO MEMORY SCORE — 1D.9A")
print("=" * 72)

if not FILE.exists():
    fail("reactiveEngine.ts não encontrado.")

original = FILE.read_text(encoding="utf-8")
text = original


# ============================================================
# 1. VALIDAR ESTADO ATUAL REAL
# ============================================================

required = [
    "const getMemoryScore = (",
    "1D.8B — MEMÓRIA TRANSVERSAL",
    "if (memory.repeatedNeed) {",
    "const hasImpulseContinuity =",
    "if (continuity.signalCount >= 2) {",
]

for fragment in required:
    if fragment not in text:
        fail(
            "estrutura esperada não encontrada: "
            + fragment
        )

if "1D.9A — SCORING SEM DUPLICAÇÃO" in text:
    fail("A 1D.9A parece já estar aplicada.")


# ============================================================
# 2. DELIMITAR getMemoryScore
# ============================================================

score_start = text.find(
    "const getMemoryScore = ("
)

if score_start == -1:
    fail("getMemoryScore não encontrado.")

# O fim do getMemoryScore está antes do sort dos candidatos.
sort_anchor = text.find(
    ".sort(",
    score_start
)

if sort_anchor == -1:
    fail(
        "não foi possível localizar o ranking "
        "posterior a getMemoryScore."
    )

score_block_before = text[
    score_start:sort_anchor
]

for fragment in [
    "if (memory.repeatedNeed) {",
    "1D.8B — MEMÓRIA TRANSVERSAL",
    "const hasImpulseContinuity =",
    "if (continuity.signalCount >= 2) {",
]:
    if fragment not in score_block_before:
        fail(
            "estrutura esperada não pertence "
            "ao bloco getMemoryScore: "
            + fragment
        )


# ============================================================
# 3. REMOVER SCORING ANTIGO DUPLICADO DO CHECK-IN
# ============================================================

old_checkin = '''    /**
     * Necessidade que tem aparecido repetidamente
     * nos Daily Check-Ins.
     */
    if (memory.repeatedNeed) {
      if (tags.includes(memory.repeatedNeed)) {
        score += 4;
      }

      if (
        memory.repeatedNeed === "well" &&
        tags.includes("continuation")
      ) {
        score += 4;
      }
    }

'''

new_checkin = '''    /**
     * 1D.9A — SCORING SEM DUPLICAÇÃO
     *
     * Necessidades repetidas do Daily Check-In são avaliadas
     * exclusivamente pela memória transversal abaixo.
     *
     * A mesma evidência não deve receber peso duas vezes.
     */

'''

if score_block_before.count(old_checkin) != 1:
    fail(
        "bloco antigo de scoring do Check-In "
        "não encontrado de forma única."
    )

text = text.replace(
    old_checkin,
    new_checkin,
    1
)


# ============================================================
# 4. CORRIGIR SCORING DA CONVERGÊNCIA
# ============================================================

old_convergence = '''      if (continuity.signalCount >= 2) {
        if (tags.includes("learning")) {
          score += 1;
        }

        if (tags.includes("reflection")) {
          score += 1;
        }
      }'''

new_convergence = '''      if (continuity.signalCount >= 2) {
        /**
         * Reflexão é transversal.
         *
         * A convergência entre diferentes fontes pode tornar
         * uma resposta reflexiva ligeiramente mais relevante.
         */
        if (tags.includes("reflection")) {
          score += 1;
        }

        /**
         * Learning representa aprendizagem de estratégia.
         *
         * Por isso só recebe o reforço da convergência quando
         * existe também continuidade real do Impulso.
         *
         * Humor + Check-In, por si só, não são suficientes.
         */
        if (
          hasImpulseContinuity &&
          tags.includes("learning")
        ) {
          score += 1;
        }
      }'''

if text.count(old_convergence) != 1:
    fail(
        "bloco atual de convergência "
        "não encontrado de forma única."
    )

text = text.replace(
    old_convergence,
    new_convergence,
    1
)


# ============================================================
# 5. REDELIMITAR getMemoryScore APÓS ALTERAÇÃO
# ============================================================

score_start = text.find(
    "const getMemoryScore = ("
)

sort_anchor = text.find(
    ".sort(",
    score_start
)

if score_start == -1 or sort_anchor == -1:
    fail(
        "não foi possível redelimitar getMemoryScore."
    )

score_block = text[
    score_start:sort_anchor
]


# ============================================================
# 6. CONFIRMAR QUE DUPLICAÇÃO DESAPARECEU
# ============================================================

if "if (memory.repeatedNeed) {" in score_block:
    fail(
        "scoring antigo de memory.repeatedNeed "
        "ainda permanece."
    )

if "tags.includes(memory.repeatedNeed)" in score_block:
    fail(
        "referência antiga de scoring "
        "a memory.repeatedNeed ainda permanece."
    )


# ============================================================
# 7. CONFIRMAR CHECK-IN TRANSVERSAL
# ============================================================

checkin_required = [
    "const repeatedCheckInNeed =",
    "continuity.repeatedCheckInNeedCount >= 2",
    "tags.includes(repeatedCheckInNeed)",
    'repeatedCheckInNeed === "well"',
    'tags.includes("continuation")',
]

for fragment in checkin_required:
    if fragment not in score_block:
        fail(
            "scoring transversal do Check-In perdeu: "
            + fragment
        )


# ============================================================
# 8. CONFIRMAR IMPULSO
# ============================================================

impulse_required = [
    "const hasImpulseContinuity =",
    "continuity.recentEffectiveImpulseCount >= 2",
    "continuity.repeatedNeedCount >= 2",
    'tags.includes("strategy")',
    'tags.includes("impulse")',
]

for fragment in impulse_required:
    if fragment not in score_block:
        fail(
            "scoring do Impulso perdeu: "
            + fragment
        )


# ============================================================
# 9. CONFIRMAR HUMOR
# ============================================================

mood_required = [
    'continuityMood === "improving"',
    'continuityMood === "declining"',
    'continuityMood === "stable"',
    'memory.moodDirection === "improving"',
    'memory.moodDirection === "declining"',
]

for fragment in mood_required:
    if fragment not in score_block:
        fail(
            "scoring do Humor perdeu: "
            + fragment
        )


# ============================================================
# 10. VALIDAR CONVERGÊNCIA CORRIGIDA
# ============================================================

convergence_start = score_block.find(
    "if (continuity.signalCount >= 2) {"
)

if convergence_start == -1:
    fail("bloco de convergência desapareceu.")

convergence = score_block[
    convergence_start:
    convergence_start + 1500
]

if 'tags.includes("reflection")' not in convergence:
    fail(
        "reflection deixou de receber "
        "reforço transversal."
    )

if "hasImpulseContinuity" not in convergence:
    fail(
        "learning não ficou condicionado "
        "à continuidade do Impulso."
    )

if 'tags.includes("learning")' not in convergence:
    fail(
        "learning desapareceu da convergência."
    )

learning_pos = convergence.find(
    'tags.includes("learning")'
)

impulse_guard_pos = convergence.find(
    "hasImpulseContinuity"
)

if impulse_guard_pos == -1 or learning_pos == -1:
    fail(
        "não foi possível validar o guard "
        "de learning."
    )

if impulse_guard_pos > learning_pos:
    fail(
        "learning aparece antes do guard "
        "hasImpulseContinuity."
    )


# ============================================================
# 11. GARANTIR QUE NÃO ALTERÁMOS O RANKING
# ============================================================

ranking_required = [
    "getMemoryScore(a)",
    "getMemoryScore(b)",
    "return bMemoryScore - aMemoryScore",
]

for fragment in ranking_required:
    if fragment not in text:
        fail(
            "ranking existente perdeu: "
            + fragment
        )


# ============================================================
# 12. GARANTIR QUE NÃO INTRODUZIMOS RESPONSABILIDADES NOVAS
# ============================================================

new_section_start = score_block.find(
    "1D.9A — SCORING SEM DUPLICAÇÃO"
)

if new_section_start == -1:
    fail("marcador 1D.9A não encontrado.")

new_section = score_block[
    new_section_start:
]

for forbidden in [
    "localStorage.setItem(",
    "useEffect(",
    "setState(",
]:
    if forbidden in new_section:
        fail(
            "foi introduzida responsabilidade indevida: "
            + forbidden
        )


# ============================================================
# 13. GARANTIR ALTERAÇÃO REAL
# ============================================================

if text == original:
    fail("nenhuma alteração foi produzida.")


# ============================================================
# 14. BACKUP + ESCRITA
# ============================================================

backup = Path(
    "/tmp/reactiveEngine.ts.before_1d9a"
)

shutil.copy2(
    FILE,
    backup
)

FILE.write_text(
    text,
    encoding="utf-8"
)


print("✓ Scoring duplicado do Check-In removido")
print("✓ Check-In passa a ter uma única fonte de scoring")
print("✓ Necessidade repetida mantém +4")
print("✓ well → continuation mantém reforço transversal")
print("✓ Convergência continua a favorecer reflection")
print("✓ Learning exige continuidade real do Impulso")
print("✓ Humor + Check-In já não favorecem learning sozinhos")
print("✓ Scoring do Impulso preservado")
print("✓ Scoring do Humor preservado")
print("✓ Ranking por memoryScore preservado")
print("✓ Situação não alterada")
print("✓ Intenção não alterada")
print("✓ Candidatos não alterados")
print("✓ Cooldown não alterado")
print("✓ Nenhum storage novo")
print("✓ Nenhum listener novo")
print("✓ Nenhuma dependência nova")
print("✓ Nenhuma tradução necessária")
print(f"✓ Backup: {backup}")
print("=" * 72)
print("OK — 1D.9A APLICADA")
print("=" * 72)
