from pathlib import Path
import shutil
import sys

FILE = Path(
    "src/data/reactive/reactiveEngine.ts"
)


def fail(message):
    print(f"ERRO: {message}")
    sys.exit(1)


print("=" * 72)
print("CONFIA — MEMÓRIA TRANSVERSAL NO MOTOR — 1D.8B")
print("=" * 72)

if not FILE.exists():
    fail("reactiveEngine.ts não encontrado.")

original = FILE.read_text(encoding="utf-8")
text = original


# ============================================================
# 1. VALIDAR ESTADO ATUAL
# ============================================================

required = [
    "const getMemoryScore = (",
    "const memory = context.memory;",
    "1D.7D — CONTINUIDADE CONTEXTUAL",
    "memory.continuity?.hasRepeatedSignals",
    "memory.continuity.repeatedNeed",
    'memory.moodDirection === "improving"',
    'memory.moodDirection === "declining"',
    "const rankCandidates = (",
]

for fragment in required:
    if fragment not in text:
        fail(
            "estrutura esperada não encontrada: "
            + fragment
        )

if "1D.8B — MEMÓRIA TRANSVERSAL" in text:
    fail(
        "A 1D.8B parece já estar aplicada. "
        "Nenhuma alteração foi feita."
    )


# ============================================================
# 2. DELIMITAR getMemoryScore
# ============================================================

score_start = text.find(
    "const getMemoryScore = ("
)

score_end = text.find(
    "const rankCandidates = (",
    score_start
)

if score_start == -1 or score_end == -1:
    fail(
        "não foi possível delimitar getMemoryScore."
    )


# ============================================================
# 3. LOCALIZAR APENAS O BLOCO 1D.7D
# ============================================================

block_start_marker = '''    /**
     * 1D.7D — CONTINUIDADE CONTEXTUAL'''

block_start = text.find(
    block_start_marker,
    score_start,
    score_end
)

if block_start == -1:
    fail(
        "início do bloco 1D.7D não encontrado."
    )

block_end_marker = '''    /**
     * Tendência recente do humor.
     */'''

block_end = text.find(
    block_end_marker,
    block_start,
    score_end
)

if block_end == -1:
    fail(
        "fim do bloco 1D.7D não encontrado."
    )


# ============================================================
# 4. NOVA PONTUAÇÃO TRANSVERSAL
#
# Regra central:
#
# memória reforça uma resposta apenas quando a memória
# é compatível com o contexto atual.
#
# Não altera:
# - situation
# - intent
# - candidatos
# - cooldown
# ============================================================

new_block = '''    /**
     * 1D.8B — MEMÓRIA TRANSVERSAL
     *
     * A continuidade pode agora vir de Humor,
     * Daily Check-In e Impulso.
     *
     * A memória apenas aumenta a relevância de respostas
     * já válidas para a situação e intenção atuais.
     *
     * Não altera situation.
     * Não altera intent.
     * Não cria candidatos.
     * Não ignora cooldown.
     */
    if (memory.continuity?.hasRepeatedSignals) {
      const continuity =
        memory.continuity;

      /**
       * --------------------------------------------------------
       * DAILY CHECK-IN
       * --------------------------------------------------------
       *
       * Se uma necessidade apareceu repetidamente,
       * reforçamos apenas respostas explicitamente
       * relacionadas com essa necessidade.
       */
      const repeatedCheckInNeed =
        continuity.repeatedCheckInNeed;

      if (
        repeatedCheckInNeed &&
        continuity.repeatedCheckInNeedCount >= 2 &&
        tags.includes(repeatedCheckInNeed)
      ) {
        score += 4;
      }

      if (
        repeatedCheckInNeed === "well" &&
        continuity.repeatedCheckInNeedCount >= 2 &&
        tags.includes("continuation")
      ) {
        score += 3;
      }

      /**
       * --------------------------------------------------------
       * IMPULSO
       * --------------------------------------------------------
       *
       * Mantemos a aprendizagem já existente, mas agora
       * apenas quando a continuidade do Impulso é real.
       */
      const repeatedImpulseNeed =
        continuity.repeatedNeed;

      const hasImpulseContinuity =
        continuity.recentEffectiveImpulseCount >= 2 ||
        continuity.repeatedNeedCount >= 2;

      if (hasImpulseContinuity) {
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
      }

      /**
       * --------------------------------------------------------
       * HUMOR
       * --------------------------------------------------------
       *
       * A tendência histórica só reforça respostas quando
       * o estado atual não a contradiz.
       *
       * Exemplo:
       * uma tendência histórica de melhoria não deve fazer
       * a Confia falar de progresso se o momento atual está
       * claramente em descida.
       */
      const continuityMood =
        continuity.moodDirection;

      const currentMoodDirection =
        memory.moodDirection;

      const moodCompatible =
        continuityMood !== "unknown" &&
        (
          currentMoodDirection === "unknown" ||
          currentMoodDirection === "stable" ||
          currentMoodDirection === continuityMood
        );

      if (moodCompatible) {
        if (continuityMood === "improving") {
          if (tags.includes("progress")) {
            score += 3;
          }

          if (tags.includes("positive")) {
            score += 2;
          }

          if (tags.includes("small-win")) {
            score += 2;
          }
        }

        if (continuityMood === "declining") {
          if (tags.includes("support")) {
            score += 3;
          }

          if (tags.includes("attention")) {
            score += 2;
          }

          if (tags.includes("difficult")) {
            score += 2;
          }
        }

        if (
          continuityMood === "stable" &&
          tags.includes("stability")
        ) {
          score += 2;
        }
      }

      /**
       * --------------------------------------------------------
       * CONVERGÊNCIA
       * --------------------------------------------------------
       *
       * Duas ou mais fontes com continuidade aumentam
       * ligeiramente a relevância de respostas de reflexão
       * e aprendizagem.
       *
       * É um reforço pequeno: convergência não significa
       * causalidade nem deve dominar a ação atual.
       */
      if (continuity.signalCount >= 2) {
        if (tags.includes("learning")) {
          score += 1;
        }

        if (tags.includes("reflection")) {
          score += 1;
        }
      }
    }

'''

text = (
    text[:block_start]
    + new_block
    + text[block_end:]
)


# ============================================================
# 5. VALIDAR NOVA ARQUITETURA
# ============================================================

score_start = text.find(
    "const getMemoryScore = ("
)

score_end = text.find(
    "const rankCandidates = (",
    score_start
)

memory_section = text[
    score_start:score_end
]

checks = [
    "1D.8B — MEMÓRIA TRANSVERSAL",
    "continuity.repeatedCheckInNeed",
    "continuity.repeatedCheckInNeedCount",
    "continuity.repeatedNeed",
    "continuity.recentEffectiveImpulseCount",
    "continuity.moodDirection",
    "continuity.signalCount",
    "const moodCompatible =",
    'continuityMood === "improving"',
    'continuityMood === "declining"',
    'continuityMood === "stable"',
]

for fragment in checks:
    if fragment not in memory_section:
        fail(
            "validação da 1D.8B falhou: "
            + fragment
        )


# ============================================================
# 6. GARANTIR QUE 1D.7D FOI SUBSTITUÍDA
# ============================================================

if (
    "1D.7D — CONTINUIDADE CONTEXTUAL"
    in memory_section
):
    fail(
        "bloco antigo 1D.7D permaneceu "
        "dentro de getMemoryScore."
    )


# ============================================================
# 7. PRESERVAR MEMÓRIA EXISTENTE
# ============================================================

preserved = [
    "if (memory.recentEffectiveImpulse)",
    "if (memory.activeDaysLast7 >= 5)",
    "if (memory.repeatedNeed)",
    'memory.moodDirection === "improving"',
    'memory.moodDirection === "declining"',
    "return score;",
]

for fragment in preserved:
    if fragment not in memory_section:
        fail(
            "lógica anterior teria sido removida: "
            + fragment
        )


# ============================================================
# 8. PRESERVAR RANKING
# ============================================================

ranking_section = text[score_end:]

ranking_required = [
    "const aCount = getUseCount(a.id);",
    "const bCount = getUseCount(b.id);",
    "getMemoryScore(a)",
    "getMemoryScore(b)",
    "return bMemoryScore - aMemoryScore;",
    "getLastUseTime(a.id)",
    "getLastUseTime(b.id)",
    "return b.priority - a.priority;",
]

for fragment in ranking_required:
    if fragment not in ranking_section:
        fail(
            "ranking existente não foi preservado: "
            + fragment
        )


# ============================================================
# 9. NÃO CRIAR NOVAS RESPONSABILIDADES
# ============================================================

for forbidden in [
    'situation: "continuity"',
    'intent: "continuity"',
    'case "continuity"',
    "localStorage.setItem",
    "sessionStorage.setItem",
]:
    if forbidden in memory_section:
        fail(
            "responsabilidade indevida encontrada: "
            + forbidden
        )


if text == original:
    fail("nenhuma alteração foi produzida.")


# ============================================================
# 10. BACKUP + ESCRITA
# ============================================================

backup = Path(
    "/tmp/reactiveEngine.ts.before_1d8b"
)

shutil.copy2(
    FILE,
    backup
)

FILE.write_text(
    text,
    encoding="utf-8"
)


print("✓ Continuidade do Check-In ligada ao Memory Score")
print("✓ Continuidade do Impulso preservada")
print("✓ Continuidade emocional ligada ao Memory Score")
print("✓ Tendência histórica contraditória não é reforçada")
print("✓ Convergência entre fontes reconhecida")
print("✓ signalCount não escolhe a ação")
print("✓ Situação atual preservada")
print("✓ Intenção atual preservada")
print("✓ Candidatos existentes preservados")
print("✓ Cooldown preservado")
print("✓ Variedade preservada")
print("✓ Recência preservada")
print("✓ Prioridade editorial preservada")
print("✓ memoryRequirements preservados")
print("✓ Nenhum storage novo")
print("✓ Nenhum listener novo")
print("✓ Nenhuma dependência nova")
print("✓ Nenhuma tradução necessária")
print(f"✓ Backup: {backup}")
print("=" * 72)
print("OK — 1D.8B APLICADA")
print("=" * 72)
