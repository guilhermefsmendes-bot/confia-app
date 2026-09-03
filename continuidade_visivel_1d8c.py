from pathlib import Path
import shutil
import sys

FILE = Path("src/App.tsx")


def fail(message):
    print(f"ERRO: {message}")
    sys.exit(1)


print("=" * 72)
print("CONFIA — CONTINUIDADE VISÍVEL E COMPATÍVEL — 1D.8C")
print("=" * 72)

if not FILE.exists():
    fail("src/App.tsx não encontrado.")

original = FILE.read_text(encoding="utf-8")
text = original


# ============================================================
# 1. VALIDAR ESTADO ATUAL
# ============================================================

required = [
    "const homeNowMemory = (() => {",
    "const homeNowAction = (() => {",
    'kind: "impulseLearning" as const',
    'kind: "impulseMemory" as const',
    'kind: "continuity" as const',
    'homeNowMemory?.kind === "impulseLearning"',
    't("homeNow.continuity.eyebrow")',
    't("homeNow.continuity.text"',
]

for fragment in required:
    if fragment not in text:
        fail(
            "estrutura esperada não encontrada: "
            + fragment
        )

if "1D.8C — CONTINUIDADE VISÍVEL COMPATÍVEL" in text:
    fail(
        "A 1D.8C parece já estar aplicada."
    )


# ============================================================
# 2. EXPANDIR A MEMÓRIA continuity DEVOLVIDA À HOME
# ============================================================

old_continuity_return = '''      return {
        kind: "continuity" as const,

        repeatedNeed:
          continuity.repeatedNeed ?? null,

        repeatedNeedCount:
          continuity.repeatedNeedCount,

        recentEffectiveImpulseCount:
          continuity.recentEffectiveImpulseCount,
      };'''

new_continuity_return = '''      return {
        kind: "continuity" as const,

        /**
         * 1D.8C — CONTINUIDADE VISÍVEL COMPATÍVEL
         *
         * A Home recebe agora as três dimensões da memória.
         * Continua sem decidir a ação.
         */
        signalCount:
          continuity.signalCount,

        moodDirection:
          continuity.moodDirection,

        moodRecordCount:
          continuity.moodRecordCount,

        repeatedCheckInNeed:
          continuity.repeatedCheckInNeed ?? null,

        repeatedCheckInNeedCount:
          continuity.repeatedCheckInNeedCount,

        repeatedNeed:
          continuity.repeatedNeed ?? null,

        repeatedNeedCount:
          continuity.repeatedNeedCount,

        recentEffectiveImpulseCount:
          continuity.recentEffectiveImpulseCount,
      };'''

if text.count(old_continuity_return) != 1:
    fail(
        "return atual de continuity não encontrado "
        "de forma única."
    )

text = text.replace(
    old_continuity_return,
    new_continuity_return,
    1
)


# ============================================================
# 3. CRIAR CONTEXTO VISÍVEL COMPATÍVEL
#
# Inserimos depois de homeNowAction e antes do handler.
# ============================================================

anchor = '''const handleHomeNowAction = () => {'''

compatibility_block = '''/**
 * 1D.8C — CONTINUIDADE VISÍVEL COMPATÍVEL
 *
 * A memória pode enriquecer "Para ti agora", mas apenas
 * quando pertence ao mesmo domínio da ação escolhida pelo
 * Reactive Engine.
 *
 * Assim evitamos, por exemplo:
 * - falar do Impulso numa recomendação de Objetivos;
 * - falar de melhoria histórica num momento atual incompatível;
 * - transformar memória em decisão.
 */
const homeNowContext = (() => {
  if (!homeNowAction || !homeNowMemory) {
    return null;
  }

  /**
   * ----------------------------------------------------------
   * IMPULSO
   * ----------------------------------------------------------
   */
  if (homeNowAction.kind === "impulse") {
    if (homeNowMemory.kind === "impulseLearning") {
      return {
        kind: "impulseLearning" as const,
        memory: homeNowMemory,
      };
    }

    if (
      homeNowMemory.kind === "impulseMemory" &&
      homeNowMemory.continuity?.hasRepeatedSignals &&
      (
        homeNowMemory.continuity.repeatedNeedCount >= 2 ||
        homeNowMemory.continuity.recentEffectiveImpulseCount >= 2
      )
    ) {
      return {
        kind: "continuity" as const,
        source: "impulse" as const,
        count: Math.max(
          homeNowMemory.continuity.repeatedNeedCount,
          homeNowMemory.continuity.recentEffectiveImpulseCount
        ),
      };
    }

    if (
      homeNowMemory.kind === "continuity" &&
      (
        homeNowMemory.repeatedNeedCount >= 2 ||
        homeNowMemory.recentEffectiveImpulseCount >= 2
      )
    ) {
      return {
        kind: "continuity" as const,
        source: "impulse" as const,
        count: Math.max(
          homeNowMemory.repeatedNeedCount,
          homeNowMemory.recentEffectiveImpulseCount
        ),
      };
    }

    return null;
  }

  /**
   * ----------------------------------------------------------
   * PADRÕES / REFLEXÃO
   * ----------------------------------------------------------
   *
   * Aqui a convergência entre duas ou mais fontes é útil:
   * há algo recorrente que vale a pena observar.
   *
   * Não dizemos que uma coisa causou a outra.
   */
  if (
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
   * PROGRESSO
   * ----------------------------------------------------------
   *
   * Só mostramos memória emocional quando a direção
   * transversal observada é de melhoria.
   */
  if (
    homeNowAction.kind === "progress" &&
    homeNowMemory.kind === "continuity" &&
    homeNowMemory.moodDirection === "improving"
  ) {
    return {
      kind: "continuity" as const,
      source: "mood" as const,
      count: homeNowMemory.moodRecordCount,
    };
  }

  /**
   * Objetivos e Registo não recebem contexto histórico
   * artificial nesta fase.
   */
  return null;
})();


'''

if text.count(anchor) != 1:
    fail(
        "ponto de inserção antes de "
        "handleHomeNowAction não encontrado."
    )

text = text.replace(
    anchor,
    compatibility_block + anchor,
    1
)


# ============================================================
# 4. EYEBROW — PASSAR A USAR CONTEXTO COMPATÍVEL
# ============================================================

old_eyebrow = '''          {homeNowMemory?.kind === "impulseLearning"
            ? t("impulseLearning.eyebrow")
            : homeNowMemory?.kind === "continuity" ||
              (
                homeNowMemory?.kind === "impulseMemory" &&
                homeNowMemory.continuity?.hasRepeatedSignals
              )
              ? t("homeNow.continuity.eyebrow")
              : t("homeNow.eyebrow")}'''

new_eyebrow = '''          {homeNowContext?.kind === "impulseLearning"
            ? t("impulseLearning.eyebrow")
            : homeNowContext?.kind === "continuity"
              ? t("homeNow.continuity.eyebrow")
              : t("homeNow.eyebrow")}'''

if text.count(old_eyebrow) != 1:
    fail(
        "bloco atual do eyebrow não encontrado."
    )

text = text.replace(
    old_eyebrow,
    new_eyebrow,
    1
)


# ============================================================
# 5. APRENDIZAGEM — APENAS QUANDO COMPATÍVEL
# ============================================================

old_learning_open = '''        {homeNowMemory?.kind === "impulseLearning" && (
          <p className="mt-1.5 text-[11px] font-semibold leading-relaxed text-[#8A6A5D]">
            {t("impulseLearning.description", {
              count: homeNowMemory.effectiveCount,
              reduction:
                homeNowMemory.averageReduction !== null
                  ? Math.round(
                      homeNowMemory.averageReduction * 10
                    ) / 10
                  : 0,
            })}
          </p>
        )}'''

new_learning_open = '''        {homeNowContext?.kind === "impulseLearning" && (
          <p className="mt-1.5 text-[11px] font-semibold leading-relaxed text-[#8A6A5D]">
            {t("impulseLearning.description", {
              count: homeNowContext.memory.effectiveCount,
              reduction:
                homeNowContext.memory.averageReduction !== null
                  ? Math.round(
                      homeNowContext.memory.averageReduction * 10
                    ) / 10
                  : 0,
            })}
          </p>
        )}'''

if text.count(old_learning_open) != 1:
    fail(
        "descrição impulseLearning atual não encontrada."
    )

text = text.replace(
    old_learning_open,
    new_learning_open,
    1
)


# ============================================================
# 6. CONTINUIDADE — UMA ÚNICA NARRATIVA
# ============================================================

old_continuity_ui = '''        {(homeNowMemory?.kind === "continuity" ||
          (
            homeNowMemory?.kind === "impulseMemory" &&
            homeNowMemory.continuity?.hasRepeatedSignals
          )) && (
          <p className="mt-1.5 text-[11px] font-semibold leading-relaxed text-[#8A6A5D]">
            {t("homeNow.continuity.text", {
              count:
                homeNowMemory.kind === "continuity"
                  ? Math.max(
                      homeNowMemory.repeatedNeedCount,
                      homeNowMemory.recentEffectiveImpulseCount
                    )
                  : Math.max(
                      homeNowMemory.continuity?.repeatedNeedCount ?? 0,
                      homeNowMemory.continuity?.recentEffectiveImpulseCount ?? 0
                    ),
            })}
          </p>
        )}'''

new_continuity_ui = '''        {homeNowContext?.kind === "continuity" && (
          <p className="mt-1.5 text-[11px] font-semibold leading-relaxed text-[#8A6A5D]">
            {t("homeNow.continuity.text", {
              count: homeNowContext.count,
            })}
          </p>
        )}'''

if text.count(old_continuity_ui) != 1:
    fail(
        "bloco visual de continuity atual "
        "não encontrado."
    )

text = text.replace(
    old_continuity_ui,
    new_continuity_ui,
    1
)


# ============================================================
# 7. VALIDAÇÕES
# ============================================================

checks = [
    "const homeNowContext = (() => {",
    'homeNowAction.kind === "impulse"',
    'homeNowAction.kind === "patterns"',
    'homeNowAction.kind === "progress"',
    'source: "impulse" as const',
    'source: "cross" as const',
    'source: "mood" as const',
    "homeNowMemory.signalCount >= 2",
    'homeNowMemory.moodDirection === "improving"',
    'homeNowContext?.kind === "impulseLearning"',
    'homeNowContext?.kind === "continuity"',
    "count: homeNowContext.count",
]

for fragment in checks:
    if fragment not in text:
        fail(
            "validação final falhou: "
            + fragment
        )


# ============================================================
# 8. GARANTIR QUE O BUG SEMÂNTICO ANTIGO SAIU DO JSX
# ============================================================

jsx_start = text.find(
    '{/* Para ti agora — ação contextual da CONFIA */}'
)

jsx_end = text.find(
    '{/* O teu espaço — navegação secundária premium */}',
    jsx_start
)

if jsx_start == -1 or jsx_end == -1:
    fail(
        "não foi possível delimitar o JSX "
        "de Para ti agora."
    )

jsx = text[jsx_start:jsx_end]

for forbidden in [
    'homeNowMemory?.kind === "impulseLearning"',
    'homeNowMemory?.kind === "continuity"',
    "homeNowMemory.continuity?.hasRepeatedSignals",
]:
    if forbidden in jsx:
        fail(
            "lógica visual antiga permaneceu no JSX: "
            + forbidden
        )


# ============================================================
# 9. GARANTIR QUE A AÇÃO CONTINUA INDEPENDENTE
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
# 10. NÃO CRIAR STORAGE / LISTENERS / DEPENDÊNCIAS
# ============================================================

new_code = text[len(original):] if text.startswith(original) else text

# Validamos pelas diferenças conceptuais conhecidas,
# sem impedir storages já existentes no App.tsx.
if "localStorage.setItem" in compatibility_block:
    fail("homeNowContext não pode escrever em storage.")

if "useEffect(" in compatibility_block:
    fail("homeNowContext não pode criar listener/effect.")

if "analyzeReactiveState(" in compatibility_block:
    fail(
        "homeNowContext não pode executar "
        "um segundo motor reativo."
    )


if text == original:
    fail("nenhuma alteração foi produzida.")


# ============================================================
# 11. BACKUP + ESCRITA
# ============================================================

backup = Path(
    "/tmp/App.tsx.before_1d8c"
)

shutil.copy2(
    FILE,
    backup
)

FILE.write_text(
    text,
    encoding="utf-8"
)


print("✓ Continuidade transversal disponível na Home")
print("✓ Aprendizagem do Impulso só aparece em ação Impulso")
print("✓ Memória de Impulso não decora Objetivos")
print("✓ Memória de Impulso não decora Progresso")
print("✓ Memória de Impulso não decora Registo")
print("✓ Padrões podem reconhecer convergência entre fontes")
print("✓ Progresso pode reconhecer tendência de melhoria")
print("✓ Objetivos permanecem sem contexto artificial")
print("✓ Registo permanece sem contexto artificial")
print("✓ Uma única narrativa em 'Para ti agora'")
print("✓ homeNowAction continua independente da memória")
print("✓ Nenhum segundo Reactive Engine")
print("✓ Nenhum cartão novo")
print("✓ Nenhum storage novo")
print("✓ Nenhum listener novo")
print("✓ Nenhuma dependência nova")
print("✓ Nenhuma tradução nova nesta subfase")
print(f"✓ Backup: {backup}")
print("=" * 72)
print("OK — 1D.8C APLICADA")
print("=" * 72)
