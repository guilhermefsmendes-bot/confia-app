from pathlib import Path
from datetime import datetime
import shutil

COMPONENT = Path(
    "src/components/Companheiro/ConfiaCompanionHome.tsx"
)

if not COMPONENT.exists():
    raise SystemExit(
        f"ERRO: ficheiro não encontrado: {COMPONENT}"
    )

stamp = datetime.now().strftime(
    "%Y%m%d_%H%M%S"
)

backup = COMPONENT.with_name(
    f"{COMPONENT.name}.before_companion_fase10a_{stamp}"
)

shutil.copy2(
    COMPONENT,
    backup,
)

text = COMPONENT.read_text(
    encoding="utf-8"
)


# ============================================================
# 1. ENRIQUECER currentUtterance
# ============================================================

old = '''  ] = useState<{
    text: string;
    source: "fallback" | "brain";
    decisionId?: string;
  }>(() => ({
    text: proposedCompanionMessage,
    source: "fallback",
  }));'''

new = '''  ] = useState<{
    text: string;
    source: "fallback" | "brain";
    decisionId?: string;

    /**
     * Momento em que esta fala entrou realmente
     * no balão.
     */
    shownAt?: number;

    /**
     * Até quando esta fala fica protegida contra
     * substituições normais.
     */
    protectedUntil?: number;
  }>(() => ({
    text: proposedCompanionMessage,
    source: "fallback",
  }));'''

if old in text:
    text = text.replace(
        old,
        new,
        1,
    )
elif "protectedUntil?: number;" not in text:
    raise SystemExit(
        "ERRO: bloco currentUtterance "
        "não encontrado."
    )


# ============================================================
# 2. FUNÇÃO DE TEMPO MÍNIMO
# ============================================================

helper_marker = '''
  /**
   * Guarda apenas a decisão atualmente processada.
'''

if (
    "getCompanionMinimumDisplayMs"
    not in text
):
    if helper_marker not in text:
        raise SystemExit(
            "ERRO: ponto de inserção do helper "
            "não encontrado."
        )

    helper = '''
  /**
   * ==========================================================
   * CONFIA — COMPANION VIVO
   * FASE 10A — TEMPO MÍNIMO DE EXPOSIÇÃO
   * ==========================================================
   *
   * Quanto mais importante for a mensagem,
   * mais tempo permanece protegida no balão.
   */
  function getCompanionMinimumDisplayMs(
    category?: string
  ): number {
    switch (category) {
      case "emotional_followup":
        return 12000;

      case "impulse_followup":
        return 12000;

      case "symptom":
        return 10000;

      case "mood_change":
        return 10000;

      case "progress":
        return 8000;

      case "objective":
        return 7000;

      case "missing_checkin":
        return 6000;

      case "discovery":
        return 6000;

      case "community":
        return 5000;

      case "casual":
      default:
        return 4000;
    }
  }

'''

    text = text.replace(
        helper_marker,
        helper + helper_marker,
        1,
    )


# ============================================================
# 3. GUARD DENTRO DO EFFECT DO BRAIN
# ============================================================

guard_marker = '''  // CONFIA_COMPANION_BRAIN_SHOWN_EFFECT
  useEffect(() => {
    const candidate =
      companionBrainDecision?.candidate;
'''

guard_replacement = '''  // CONFIA_COMPANION_BRAIN_SHOWN_EFFECT
  useEffect(() => {
    const candidate =
      companionBrainDecision?.candidate;

    // CONFIA_FASE10A_MINIMUM_DISPLAY_GUARD
    /**
     * Uma nova decisão não substitui imediatamente
     * uma fala do cérebro que ainda está dentro
     * do seu tempo mínimo de exposição.
     *
     * Na Fase 10B isto será refinado para permitir
     * interrupção por mensagens claramente mais
     * prioritárias.
     */
    if (
      candidate &&
      currentUtterance.source === "brain" &&
      typeof currentUtterance.protectedUntil ===
        "number" &&
      Date.now() <
        currentUtterance.protectedUntil &&
      candidate.id !==
        currentUtterance.decisionId
    ) {
      return;
    }
'''

if (
    "CONFIA_FASE10A_MINIMUM_DISPLAY_GUARD"
    not in text
):
    if guard_marker not in text:
        raise SystemExit(
            "ERRO: início do effect do Brain "
            "não encontrado."
        )

    text = text.replace(
        guard_marker,
        guard_replacement,
        1,
    )


# ============================================================
# 4. ALTERAR setCurrentUtterance DO BRAIN
# ============================================================

old = '''    setCurrentUtterance({
      text: translated,
      source: "brain",
      decisionId: candidate.id,
    });'''

new = '''    const nowMs =
      Date.now();

    const minimumDisplayMs =
      getCompanionMinimumDisplayMs(
        candidate.category
      );

    setCurrentUtterance({
      text: translated,
      source: "brain",
      decisionId: candidate.id,
      shownAt: nowMs,
      protectedUntil:
        nowMs + minimumDisplayMs,
    });'''

if old in text:
    text = text.replace(
        old,
        new,
        1,
    )
elif "nowMs + minimumDisplayMs" not in text:
    raise SystemExit(
        "ERRO: setCurrentUtterance do Brain "
        "não encontrado."
    )


# ============================================================
# 5. DEPENDÊNCIAS DO EFFECT
# ============================================================

old = '''  }, [
    companionBrainDecision?.candidate.id,
    companionBrainDecision?.candidate.translationKey,
    t,
  ]);'''

new = '''  }, [
    companionBrainDecision?.candidate.id,
    companionBrainDecision?.candidate.translationKey,
    currentUtterance.source,
    currentUtterance.decisionId,
    currentUtterance.protectedUntil,
    t,
  ]);'''

if old in text:
    text = text.replace(
        old,
        new,
        1,
    )
elif (
    "currentUtterance.protectedUntil"
    not in text[
        text.find(
            "// CONFIA_COMPANION_BRAIN_SHOWN_EFFECT"
        ):
        text.find(
            "const companionMessage"
        )
        if "const companionMessage" in text
        else len(text)
    ]
):
    raise SystemExit(
        "ERRO: array de dependências do effect "
        "não encontrado."
    )


# ============================================================
# 6. GUARDAR
# ============================================================

COMPONENT.write_text(
    text,
    encoding="utf-8",
)


# ============================================================
# 7. VERIFICAÇÃO
# ============================================================

check = COMPONENT.read_text(
    encoding="utf-8"
)

checks = [
    (
        "shownAt",
        "shownAt?: number;"
        in check,
    ),
    (
        "protectedUntil",
        "protectedUntil?: number;"
        in check,
    ),
    (
        "helper",
        "getCompanionMinimumDisplayMs"
        in check,
    ),
    (
        "emotional 12s",
        'case "emotional_followup":'
        in check and
        "return 12000;"
        in check,
    ),
    (
        "guard",
        "CONFIA_FASE10A_MINIMUM_DISPLAY_GUARD"
        in check,
    ),
    (
        "shown timestamp",
        "shownAt: nowMs"
        in check,
    ),
    (
        "protected timestamp",
        "nowMs + minimumDisplayMs"
        in check,
    ),
    (
        "effect dependency",
        "currentUtterance.protectedUntil"
        in check,
    ),
]

failed = [
    name
    for name, ok in checks
    if not ok
]

if failed:
    raise SystemExit(
        "ERRO FINAL: "
        + ", ".join(failed)
    )


print()
print("=" * 76)
print("CONFIA — COMPANION VIVO — FASE 10A CORRIGIDA")
print("=" * 76)
print("✓ Caminho real do componente utilizado")
print("✓ Estrutura existente da Fase 8A preservada")
print("✓ shownAt adicionado")
print("✓ protectedUntil adicionado")
print("✓ Emotional follow-up protegido por 12s")
print("✓ Impulso protegido por 12s")
print("✓ Mood change protegido por 10s")
print("✓ Progress protegido por 8s")
print("✓ Discovery protegido por 6s")
print("✓ Casual/micro protegido por 4s")
print("✓ Nova decisão normal espera durante a proteção")
print("✓ Dependências do useEffect atualizadas")
print("✓ Backup criado")
print()
print("Agora:")
print()
print("  fala importante")
print("       ↓")
print("  permanece visível")
print("       ↓")
print("  micro-interações aguardam")
print()
print("FASE 10A corrigida e concluída.")
