from pathlib import Path
import shutil
import sys

FILE = Path("src/App.tsx")


def fail(message):
    print(f"ERRO: {message}")
    sys.exit(1)


print("=" * 72)
print("CONFIA — CHECK-IN COMO CONTINUIDADE VISÍVEL — 1D.8E")
print("=" * 72)

if not FILE.exists():
    fail("src/App.tsx não encontrado.")

original = FILE.read_text(encoding="utf-8")
text = original


# ============================================================
# 1. VALIDAR A BASE 1D.8C / 1D.8D
# ============================================================

required = [
    "const homeNowContext = (() => {",
    'homeNowAction.kind === "patterns"',
    'source: "cross" as const',
    'source: "mood" as const',
    'source: "impulse" as const',
    "homeNowMemory.signalCount >= 2",
    "repeatedCheckInNeed:",
    "repeatedCheckInNeedCount:",
    't("homeNow.continuityMemory.checkIn")',
]

for fragment in required:
    if fragment not in text:
        fail(
            "estrutura esperada não encontrada: "
            + fragment
        )

if 'source: "checkIn" as const' in text:
    fail(
        "A continuidade visível do Check-In "
        "parece já estar aplicada."
    )


# ============================================================
# 2. SUBSTITUIR APENAS O BLOCO DE PATTERNS
# ============================================================

old = '''  if (
    homeNowAction.kind === "patterns" &&
    homeNowMemory.kind === "continuity" &&
    homeNowMemory.signalCount >= 2
  ) {
    return {
      kind: "continuity" as const,
      source: "cross" as const,
      count: homeNowMemory.signalCount,
    };
  }

  /**
   * ----------------------------------------------------------
   * PROGRESSO'''

new = '''  if (
    homeNowAction.kind === "patterns" &&
    homeNowMemory.kind === "continuity"
  ) {
    /**
     * 1D.8E — CHECK-IN VISÍVEL
     *
     * Quando existem duas ou mais fontes de continuidade,
     * mostramos primeiro a convergência transversal.
     */
    if (homeNowMemory.signalCount >= 2) {
      return {
        kind: "continuity" as const,
        source: "cross" as const,
        count: homeNowMemory.signalCount,
      };
    }

    /**
     * Sem convergência entre fontes, uma necessidade repetida
     * nos últimos Check-Ins pode contextualizar uma ação
     * que o Reactive Engine já decidiu como reflexão/padrões.
     *
     * A memória continua sem escolher a ação.
     */
    if (
      homeNowMemory.repeatedCheckInNeed &&
      homeNowMemory.repeatedCheckInNeedCount >= 2
    ) {
      return {
        kind: "continuity" as const,
        source: "checkIn" as const,
        count: homeNowMemory.repeatedCheckInNeedCount,
      };
    }

    return null;
  }

  /**
   * ----------------------------------------------------------
   * PROGRESSO'''

if text.count(old) != 1:
    fail(
        "bloco atual de Patterns não encontrado "
        "de forma única."
    )

text = text.replace(old, new, 1)


# ============================================================
# 3. DELIMITAR homeNowContext
# ============================================================

context_start = text.find(
    "const homeNowContext = (() => {"
)

context_end = text.find(
    "const handleHomeNowAction = () => {",
    context_start
)

if context_start == -1 or context_end == -1:
    fail(
        "não foi possível delimitar homeNowContext."
    )

context = text[context_start:context_end]


# ============================================================
# 4. VALIDAR CHECK-IN
# ============================================================

checks = [
    'source: "checkIn" as const',
    "homeNowMemory.repeatedCheckInNeed &&",
    "homeNowMemory.repeatedCheckInNeedCount >= 2",
    "count: homeNowMemory.repeatedCheckInNeedCount",
]

for fragment in checks:
    if fragment not in context:
        fail(
            "validação final falhou: "
            + fragment
        )


# ============================================================
# 5. GARANTIR CROSS > CHECK-IN
# ============================================================

patterns_start = context.find(
    'homeNowAction.kind === "patterns"'
)

progress_start = context.find(
    'homeNowAction.kind === "progress"',
    patterns_start
)

if patterns_start == -1 or progress_start == -1:
    fail(
        "não foi possível delimitar Patterns."
    )

patterns_block = context[
    patterns_start:progress_start
]

cross_position = patterns_block.find(
    'source: "cross" as const'
)

checkin_position = patterns_block.find(
    'source: "checkIn" as const'
)

if cross_position == -1:
    fail("source cross desapareceu de Patterns.")

if checkin_position == -1:
    fail("source checkIn não foi criado.")

if cross_position > checkin_position:
    fail(
        "Check-In ficou indevidamente acima "
        "da convergência transversal."
    )


# ============================================================
# 6. GARANTIR CHECK-IN APENAS EM PATTERNS
# ============================================================

outside_patterns = (
    context[:patterns_start] +
    context[progress_start:]
)

if 'source: "checkIn" as const' in outside_patterns:
    fail(
        "Check-In apareceu fora da ação Patterns."
    )


# ============================================================
# 7. GARANTIR QUE A AÇÃO NÃO DEPENDE DA MEMÓRIA
# ============================================================

action_start = text.find(
    "const homeNowAction = (() => {"
)

action_end = text.find(
    "const homeNowContext = (() => {",
    action_start
)

if action_start == -1 or action_end == -1:
    fail(
        "não foi possível delimitar homeNowAction."
    )

action_block = text[action_start:action_end]

if "homeNowMemory" in action_block:
    fail(
        "homeNowAction passou indevidamente "
        "a depender da memória."
    )


# ============================================================
# 8. SEM NOVAS RESPONSABILIDADES
# ============================================================

for forbidden in [
    "analyzeReactiveState(",
    "collectReactiveRecentMemory(",
    "localStorage.setItem(",
    "useEffect(",
]:
    if forbidden in patterns_block:
        fail(
            "Patterns ganhou responsabilidade indevida: "
            + forbidden
        )


if text == original:
    fail("nenhuma alteração foi produzida.")


# ============================================================
# 9. BACKUP + ESCRITA
# ============================================================

backup = Path(
    "/tmp/App.tsx.before_1d8e"
)

shutil.copy2(
    FILE,
    backup
)

FILE.write_text(
    text,
    encoding="utf-8"
)


print("✓ Check-In ligado explicitamente à continuidade visível")
print("✓ Necessidade repetida exige pelo menos 2 Check-Ins")
print("✓ Check-In só contextualiza ação de Padrões")
print("✓ Convergência entre fontes mantém prioridade")
print("✓ Impulso mantém contexto próprio")
print("✓ Humor mantém contexto próprio")
print("✓ Objetivos continuam sem contexto artificial")
print("✓ Registo continua sem contexto artificial")
print("✓ Tradução Check-In da 1D.8D passa a estar ativa")
print("✓ homeNowAction continua independente da memória")
print("✓ Nenhum segundo Reactive Engine")
print("✓ Nenhum storage novo")
print("✓ Nenhum listener novo")
print("✓ Nenhuma dependência nova")
print("✓ Nenhum cartão novo")
print("✓ Nenhuma tradução nova necessária")
print(f"✓ Backup: {backup}")
print("=" * 72)
print("OK — 1D.8E APLICADA")
print("=" * 72)
