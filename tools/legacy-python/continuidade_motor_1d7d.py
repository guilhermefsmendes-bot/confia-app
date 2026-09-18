from pathlib import Path
import shutil
import sys

ENGINE = Path(
    "src/data/reactive/reactiveEngine.ts"
)


def fail(message):
    print(f"ERRO: {message}")
    sys.exit(1)


print("=" * 72)
print("CONFIA — CONTINUIDADE NO MOTOR DE RESPOSTAS — 1D.7D")
print("=" * 72)

if not ENGINE.exists():
    fail("reactiveEngine.ts não encontrado.")

original = ENGINE.read_text(encoding="utf-8")
text = original


# ============================================================
# 1. VALIDAR ARQUITETURA ATUAL
# ============================================================

required = [
    "const getMemoryScore = (",
    "const memory = context.memory;",
    "if (memory.recentEffectiveImpulse)",
    "if (memory.repeatedNeed)",
    'memory.moodDirection === "improving"',
    'memory.moodDirection === "declining"',
    "return score;",
    "const rankCandidates = (",
    "getMemoryScore(a)",
    "getMemoryScore(b)",
]

for fragment in required:
    if fragment not in text:
        fail(
            "estrutura esperada não encontrada: "
            + fragment
        )


# ============================================================
# 2. NÃO PERMITIR DUPLICAÇÃO
# ============================================================

marker = "1D.7D — CONTINUIDADE CONTEXTUAL"

if marker in text:
    fail(
        "A 1D.7D parece já estar aplicada. "
        "Nenhuma alteração foi feita."
    )


# ============================================================
# 3. BLOCO DE CONTINUIDADE
#
# A continuidade NÃO:
# - muda situation
# - muda intent
# - cria candidatos
# - ignora cooldown
#
# Apenas aumenta a relevância de respostas que já são
# válidas para a situação e intenção atuais.
# ============================================================

anchor = '''    /**
     * Tendência recente do humor.
     */
'''

continuity_block = '''    /**
     * 1D.7D — CONTINUIDADE CONTEXTUAL
     *
     * A continuidade apenas reforça respostas que já são
     * elegíveis para a situação e intenção atuais.
     *
     * Não altera situation.
     * Não altera intent.
     * Não cria novos candidatos.
     * Não ignora cooldown.
     *
     * Nesta fase, continuity representa sobretudo repetição
     * de experiências eficazes no Impulso. Por isso evitamos
     * extrapolar esta memória para outros tipos de padrão.
     */
    if (memory.continuity?.hasRepeatedSignals) {
      /**
       * Existe repetição suficiente de experiências recentes
       * para valorizar respostas que reconhecem aprendizagem
       * ou uma estratégia anteriormente útil.
       */
      if (tags.includes("learning")) {
        score += 2;
      }

      if (tags.includes("strategy")) {
        score += 2;
      }

      if (tags.includes("impulse")) {
        score += 2;
      }

      /**
       * Quando a repetição aponta para a mesma necessidade,
       * valorizamos respostas explicitamente relacionadas
       * com essa necessidade.
       *
       * A necessidade continua sem escolher a ação.
       */
      const repeatedNeed =
        memory.continuity.repeatedNeed;

      if (
        repeatedNeed &&
        tags.includes(repeatedNeed)
      ) {
        score += 3;
      }
    }

'''

if text.count(anchor) != 1:
    fail(
        "esperava exatamente um ponto de inserção "
        "antes da tendência de humor."
    )

text = text.replace(
    anchor,
    continuity_block + anchor,
    1
)


# ============================================================
# 4. VALIDAÇÕES ARQUITETURAIS
# ============================================================

if marker not in text:
    fail("bloco 1D.7D não foi inserido.")

# Não queremos continuity no Intent Engine através desta fase.
for forbidden in [
    'situation: "continuity"',
    'intent: "continuity"',
    'case "continuity"',
]:
    if forbidden in text:
        fail(
            "continuidade adquiriu responsabilidade "
            "indevida: " + forbidden
        )


# A pontuação de memória continua dentro de getMemoryScore.
memory_start = text.find(
    "const getMemoryScore = ("
)

memory_end = text.find(
    "const rankCandidates = (",
    memory_start
)

if memory_start == -1 or memory_end == -1:
    fail(
        "não foi possível delimitar getMemoryScore."
    )

memory_section = text[
    memory_start:memory_end
]

for fragment in [
    "memory.continuity?.hasRepeatedSignals",
    'tags.includes("learning")',
    'tags.includes("strategy")',
    'tags.includes("impulse")',
    "memory.continuity.repeatedNeed",
]:
    if fragment not in memory_section:
        fail(
            "validação da continuidade falhou: "
            + fragment
        )


# ============================================================
# 5. GARANTIR QUE O RANKING NÃO FOI REESTRUTURADO
# ============================================================

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
    if fragment not in text:
        fail(
            "ranking existente foi alterado ou "
            "não corresponde ao esperado: "
            + fragment
        )


# ============================================================
# 6. BACKUP + ESCRITA
# ============================================================

if text == original:
    fail("nenhuma alteração foi produzida.")

backup = Path(
    "/tmp/reactiveEngine.ts.before_1d7d"
)

shutil.copy2(
    ENGINE,
    backup
)

ENGINE.write_text(
    text,
    encoding="utf-8"
)


print("✓ Continuidade ligada ao Memory Score")
print("✓ Repetição pode reforçar respostas de aprendizagem")
print("✓ Estratégias eficazes anteriores podem ganhar relevância")
print("✓ Necessidade repetida pode aumentar relevância contextual")
print("✓ Situação atual continua prioritária")
print("✓ Intent atual continua prioritário")
print("✓ Continuidade não cria candidatos")
print("✓ Cooldown preservado")
print("✓ Variedade preservada")
print("✓ Recência preservada")
print("✓ Prioridade editorial preservada")
print("✓ Nenhum storage novo")
print("✓ Nenhum listener novo")
print("✓ Nenhuma dependência nova")
print("✓ Nenhuma tradução necessária")
print(f"✓ Backup: {backup}")
print("=" * 72)
print("OK — 1D.7D APLICADA")
print("=" * 72)
