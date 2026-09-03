from pathlib import Path
import shutil
import sys
import re

# ============================================================
# CONFIA — FASE 3
# 3B V2 — CONTEXTO DIÁRIO INTELIGENTE
#
# CORREÇÃO V2:
# A primeira versão procurava "analyzeReactiveState("
# dentro do bloco bruto e apanhava essa expressão num comentário.
#
# Esta versão:
# - remove comentários antes de auditar chamadas reais;
# - mantém a arquitetura original da 3B;
# - só escreve depois de todas as validações passarem.
#
# Objetivo:
#
# Criar um dailyContext derivado que organiza:
#
# - primeiro contacto;
# - regresso após ausência;
# - primeira abertura de hoje;
# - nova abertura no mesmo dia;
# - memória já existente;
# - ação já escolhida pelo Reactive Engine.
#
# NÃO cria:
# - UI;
# - textos;
# - traduções;
# - storage;
# - useState;
# - useEffect;
# - timers;
# - listeners;
# - novas chamadas ao Reactive Engine;
# - novas recolhas de memória.
#
# ALTERA APENAS:
# src/App.tsx
#
# Backup:
# /tmp/App.tsx.before_fase3b_contexto_diario_v2
# ============================================================

ROOT = Path.cwd()

APP = ROOT / "src/App.tsx"

BACKUP = Path(
    "/tmp/App.tsx.before_fase3b_contexto_diario_v2"
)


def fail(message: str):
    print()
    print("=" * 78)
    print("ERRO — FASE 3B V2 NÃO APLICADA")
    print("=" * 78)
    print()
    print(message)
    print()
    print("Nenhum ficheiro foi alterado.")
    print("=" * 78)
    sys.exit(1)


def strip_comments(text: str) -> str:
    """
    Remove comentários // e /* ... */ apenas para auditoria.

    Não altera o código que será escrito.
    """
    without_blocks = re.sub(
        r"/\*.*?\*/",
        "",
        text,
        flags=re.S,
    )

    without_lines = re.sub(
        r"//.*?$",
        "",
        without_blocks,
        flags=re.M,
    )

    return without_lines


# ============================================================
# 1. VALIDAR FICHEIRO
# ============================================================

if not APP.exists():
    fail(
        f"Não encontrei:\n{APP}"
    )

original = APP.read_text(
    encoding="utf-8"
)


# ============================================================
# 2. VALIDAR 3A
# ============================================================

required_3a = [
    "LAST_APP_OPEN_DATE:",
    "confia_last_app_open_date_v1",
    "const appOpenDate",
    "const previousAppOpenDate",
    "const isFirstAppOpenToday",
    "const daysSincePreviousAppOpen",
    "CONFIA 3A — ESTADO DIÁRIO",
]

missing_3a = [
    marker
    for marker in required_3a
    if marker not in original
]

if missing_3a:
    fail(
        "A Fase 3A não está completa.\n\n"
        "Falta:\n"
        + "\n".join(missing_3a)
    )


# ============================================================
# 3. IMPEDIR DUPLICAÇÃO
# ============================================================

existing_3b = [
    "CONFIA 3B — CONTEXTO DIÁRIO",
    "type DailyContextState",
    "const dailyContext =",
    "CONFIA 3B — FIM DO CONTEXTO DIÁRIO",
]

present_3b = [
    marker
    for marker in existing_3b
    if marker in original
]

if present_3b:
    fail(
        "A Fase 3B já parece estar total ou "
        "parcialmente presente:\n\n"
        + "\n".join(present_3b)
    )


# ============================================================
# 4. CONTAGENS ORIGINAIS
# ============================================================

original_code = strip_comments(
    original
)

counts_before = {
    "useState":
        original_code.count("useState("),

    "useEffect":
        original_code.count("useEffect("),

    "getItem":
        original_code.count("localStorage.getItem"),

    "setItem":
        original_code.count("localStorage.setItem"),

    "analyze":
        original_code.count("analyzeReactiveState("),

    "record":
        original_code.count("recordReactiveResponse("),

    "collectMemory":
        original_code.count("collectReactiveRecentMemory("),

    "setTimeout":
        original_code.count("setTimeout("),

    "setInterval":
        original_code.count("setInterval("),

    "requestAnimationFrame":
        original_code.count("requestAnimationFrame"),
}


# ============================================================
# 5. VALIDAR PRINCIPAL
# ============================================================

required_existing = [
    "const isFirstContact =",
    "const isEarlyLearning =",
    "const homeNowMemory = (() => {",
    "const homeNowAction = (() => {",
    "const homeNowContext = (() => {",
]

missing_existing = [
    marker
    for marker in required_existing
    if marker not in original
]

if missing_existing:
    fail(
        "A Principal não corresponde à versão auditada.\n\n"
        "Falta:\n"
        + "\n".join(missing_existing)
    )


# ============================================================
# 6. ÂNCORA
# ============================================================

anchor = '''/**
 * 1D.8C — CONTINUIDADE VISÍVEL COMPATÍVEL
 *
 * A memória pode enriquecer "Para ti agora", mas apenas
 * quando pertence ao mesmo domínio da ação escolhida pelo
 * Reactive Engine.
'''

if original.count(anchor) != 1:
    fail(
        "Não encontrei exatamente uma vez "
        "a âncora antes de homeNowContext."
    )


# ============================================================
# 7. BLOCO 3B
# ============================================================

daily_context_block = r'''
/**
 * ==========================================================
 * CONFIA 3B — CONTEXTO DIÁRIO
 * ==========================================================
 *
 * A 3A sabe quando a app foi aberta.
 *
 * A 3B combina esse estado factual com informação que
 * já foi preparada pelas camadas existentes da Principal.
 *
 * Não existe aqui uma segunda decisão emocional.
 *
 * O Reactive Engine continua responsável pela decisão
 * da situação e da ação atual.
 *
 * A memória recente continua responsável pela aprendizagem
 * e continuidade.
 *
 * dailyContext limita-se a preparar a futura experiência
 * "Momento de Hoje".
 */

type DailyContextState =
  | "first_contact"
  | "return_after_absence"
  | "first_today"
  | "already_here_today";

const dailyContext = (() => {
  if (
    currentTab !== 0 ||
    homeScreen !== "home"
  ) {
    return null;
  }

  /**
   * --------------------------------------------------------
   * ESTADO DIÁRIO
   * --------------------------------------------------------
   *
   * Hierarquia:
   *
   * 1. Primeiro contacto absoluto.
   *
   * 2. Regresso após pelo menos um dia completo
   *    sem abrir a CONFIA.
   *
   * 3. Primeira abertura do dia.
   *
   * 4. Já esteve na CONFIA hoje.
   */
  let state: DailyContextState;

  if (isFirstContact) {
    state = "first_contact";
  } else if (
    isFirstAppOpenToday &&
    typeof daysSincePreviousAppOpen === "number" &&
    daysSincePreviousAppOpen >= 2
  ) {
    state = "return_after_absence";
  } else if (isFirstAppOpenToday) {
    state = "first_today";
  } else {
    state = "already_here_today";
  }

  /**
   * --------------------------------------------------------
   * MEMÓRIA
   * --------------------------------------------------------
   *
   * Reutilizamos apenas a memória que a Principal já
   * considerou suficientemente sólida para apresentar.
   */
  const memoryKind =
    homeNowMemory?.kind ?? null;

  const hasImpulseLearning =
    memoryKind === "impulseLearning";

  const hasImpulseMemory =
    memoryKind === "impulseMemory";

  const hasContinuityMemory =
    memoryKind === "continuity";

  /**
   * --------------------------------------------------------
   * AÇÃO
   * --------------------------------------------------------
   *
   * Não voltamos a executar o motor.
   *
   * Apenas reutilizamos a ação já escolhida
   * por homeNowAction.
   */
  const suggestedAction =
    homeNowAction?.kind ?? null;

  /**
   * --------------------------------------------------------
   * CONTEXTO FINAL
   * --------------------------------------------------------
   *
   * Ainda não existem aqui mensagens, UI, XP,
   * celebrações ou histórico próprio.
   */
  return {
    state,

    isFirstOpenToday:
      isFirstAppOpenToday,

    previousOpenDate:
      previousAppOpenDate,

    daysSincePreviousOpen:
      daysSincePreviousAppOpen,

    isEarlyLearning,

    memoryKind,

    hasImpulseLearning,

    hasImpulseMemory,

    hasContinuityMemory,

    suggestedAction,
  };
})();

/* CONFIA 3B — FIM DO CONTEXTO DIÁRIO */

'''


# ============================================================
# 8. PREPARAR ALTERAÇÃO
# ============================================================

updated = original.replace(
    anchor,
    daily_context_block + anchor,
    1,
)


# ============================================================
# 9. ISOLAR EXATAMENTE O BLOCO NOVO
# ============================================================

start_marker = (
    "CONFIA 3B — CONTEXTO DIÁRIO"
)

end_marker = (
    "CONFIA 3B — FIM DO CONTEXTO DIÁRIO"
)

start = updated.find(
    start_marker
)

end = updated.find(
    end_marker,
    start
)

if start == -1 or end == -1:
    fail(
        "Não consegui isolar o bloco 3B."
    )

end += len(
    end_marker
)

block = updated[
    start:end
]

block_code = strip_comments(
    block
)


# ============================================================
# 10. VALIDAR ESTADOS
# ============================================================

required_states = [
    '"first_contact"',
    '"return_after_absence"',
    '"first_today"',
    '"already_here_today"',
]

for state in required_states:
    if state not in block_code:
        fail(
            "Falta estado diário:\n"
            f"{state}"
        )


# ============================================================
# 11. VALIDAR HIERARQUIA REAL
# ============================================================

first_contact_pos = block_code.find(
    'state = "first_contact"'
)

absence_pos = block_code.find(
    'state = "return_after_absence"'
)

first_today_pos = block_code.find(
    'state = "first_today"'
)

already_today_pos = block_code.find(
    'state = "already_here_today"'
)

if (
    min(
        first_contact_pos,
        absence_pos,
        first_today_pos,
        already_today_pos,
    ) < 0
):
    fail(
        "Não consegui localizar todos "
        "os estados atribuídos."
    )

if not (
    first_contact_pos
    < absence_pos
    < first_today_pos
    < already_today_pos
):
    fail(
        "A hierarquia dos estados não ficou "
        "na ordem esperada."
    )


# ============================================================
# 12. VALIDAR AUSÊNCIA
# ============================================================

absence_requirements = [
    "isFirstAppOpenToday",
    "daysSincePreviousAppOpen",
    "daysSincePreviousAppOpen >= 2",
]

for marker in absence_requirements:
    if marker not in block_code:
        fail(
            "Regresso após ausência incompleto:\n"
            f"{marker}"
        )


# ============================================================
# 13. VALIDAR MEMÓRIA
# ============================================================

memory_requirements = [
    "homeNowMemory?.kind",
    '"impulseLearning"',
    '"impulseMemory"',
    '"continuity"',
    "hasImpulseLearning",
    "hasImpulseMemory",
    "hasContinuityMemory",
]

for marker in memory_requirements:
    if marker not in block_code:
        fail(
            "Integração da memória incompleta:\n"
            f"{marker}"
        )


# ============================================================
# 14. VALIDAR AÇÃO EXISTENTE
# ============================================================

if "homeNowAction?.kind" not in block_code:
    fail(
        "A 3B deveria reutilizar homeNowAction."
    )


# ============================================================
# 15. PROIBIR CHAMADAS REAIS AOS MOTORES
#
# Como comentários já foram removidos,
# agora estas verificações representam código real.
# ============================================================

for forbidden in [
    "analyzeReactiveState(",
    "recordReactiveResponse(",
    "collectReactiveRecentMemory(",
]:
    if forbidden in block_code:
        fail(
            "A 3B contém uma nova chamada real "
            "a um motor existente:\n\n"
            f"{forbidden}"
        )


# ============================================================
# 16. PROIBIR STORAGE REAL
# ============================================================

for forbidden in [
    "localStorage.getItem",
    "localStorage.setItem",
    "localStorage.removeItem",
]:
    if forbidden in block_code:
        fail(
            "A 3B não deve consultar nem alterar "
            "storage diretamente:\n\n"
            f"{forbidden}"
        )


# ============================================================
# 17. PROIBIR NOVO REACT STATE/EFFECT
# ============================================================

for forbidden in [
    "useState(",
    "useEffect(",
]:
    if forbidden in block_code:
        fail(
            "A 3B deve continuar totalmente derivada:\n\n"
            f"{forbidden}"
        )


# ============================================================
# 18. PROIBIR TRABALHO CONTÍNUO
# ============================================================

for forbidden in [
    "setTimeout(",
    "setInterval(",
    "requestAnimationFrame",
    "addEventListener",
    "ResizeObserver",
    "MutationObserver",
    "fetch(",
]:
    if forbidden in block_code:
        fail(
            "Operação não permitida na 3B:\n\n"
            f"{forbidden}"
        )


# ============================================================
# 19. VALIDAR OBJETO FINAL
# ============================================================

required_context_fields = [
    "state,",
    "isFirstOpenToday:",
    "previousOpenDate:",
    "daysSincePreviousOpen:",
    "isEarlyLearning,",
    "memoryKind,",
    "hasImpulseLearning,",
    "hasImpulseMemory,",
    "hasContinuityMemory,",
    "suggestedAction,",
]

for marker in required_context_fields:
    if marker not in block_code:
        fail(
            "Campo em falta no dailyContext:\n"
            f"{marker}"
        )


# ============================================================
# 20. DELTAS GLOBAIS REAIS
# ============================================================

updated_code = strip_comments(
    updated
)

counts_after = {
    "useState":
        updated_code.count("useState("),

    "useEffect":
        updated_code.count("useEffect("),

    "getItem":
        updated_code.count("localStorage.getItem"),

    "setItem":
        updated_code.count("localStorage.setItem"),

    "analyze":
        updated_code.count("analyzeReactiveState("),

    "record":
        updated_code.count("recordReactiveResponse("),

    "collectMemory":
        updated_code.count("collectReactiveRecentMemory("),

    "setTimeout":
        updated_code.count("setTimeout("),

    "setInterval":
        updated_code.count("setInterval("),

    "requestAnimationFrame":
        updated_code.count("requestAnimationFrame"),
}

for key in counts_before:
    if counts_after[key] != counts_before[key]:
        fail(
            f"A contagem global real de {key} mudou.\n\n"
            f"Antes: {counts_before[key]}\n"
            f"Depois: {counts_after[key]}"
        )


# ============================================================
# 21. PRESERVAR 3A
# ============================================================

for marker in required_3a:
    if marker not in updated:
        fail(
            "A Fase 3A deixou de estar intacta:\n"
            f"{marker}"
        )


# ============================================================
# 22. PRESERVAR PRINCIPAL
# ============================================================

for marker in required_existing:
    if marker not in updated:
        fail(
            "Estrutura existente desapareceu:\n"
            f"{marker}"
        )


# ============================================================
# 23. PROIBIR TEXTOS DE UI
# ============================================================

for forbidden in [
    "titleKey:",
    "textKey:",
    "actionKey:",
]:
    if forbidden in block_code:
        fail(
            "A 3B ainda não deve criar textos/UI:\n"
            f"{forbidden}"
        )


# ============================================================
# 24. IMPORTS INTACTOS
# ============================================================

original_imports = "\n".join(
    line
    for line in original.splitlines()
    if line.startswith("import ")
)

updated_imports = "\n".join(
    line
    for line in updated.splitlines()
    if line.startswith("import ")
)

if original_imports != updated_imports:
    fail(
        "A 3B não deveria alterar imports."
    )


# ============================================================
# 25. MARCADORES ÚNICOS
# ============================================================

if (
    updated.count(
        "CONFIA 3B — CONTEXTO DIÁRIO"
    ) != 1
):
    fail(
        "Marcador inicial da 3B duplicado."
    )

if (
    updated.count(
        "CONFIA 3B — FIM DO CONTEXTO DIÁRIO"
    ) != 1
):
    fail(
        "Marcador final da 3B duplicado."
    )

if (
    updated.count(
        "const dailyContext ="
    ) != 1
):
    fail(
        "dailyContext deveria existir "
        "exatamente uma vez."
    )


# ============================================================
# 26. BACKUP
# ============================================================

shutil.copy2(
    APP,
    BACKUP
)


# ============================================================
# 27. ESCREVER
# ============================================================

APP.write_text(
    updated,
    encoding="utf-8"
)


# ============================================================
# 28. VERIFICAÇÃO PÓS-ESCRITA
# ============================================================

written = APP.read_text(
    encoding="utf-8"
)

post_checks = [
    "type DailyContextState",
    "const dailyContext =",
    '"first_contact"',
    '"return_after_absence"',
    '"first_today"',
    '"already_here_today"',
    "daysSincePreviousOpen:",
    "memoryKind,",
    "suggestedAction,",
    "CONFIA 3B — FIM DO CONTEXTO DIÁRIO",
]

missing = [
    marker
    for marker in post_checks
    if marker not in written
]

if missing:
    shutil.copy2(
        BACKUP,
        APP
    )

    print()
    print("=" * 78)
    print("ERRO PÓS-ESCRITA — ROLLBACK EXECUTADO")
    print("=" * 78)
    print()

    for marker in missing:
        print(f"✗ {marker}")

    print()
    print(
        "App.tsx restaurado automaticamente."
    )
    print("=" * 78)

    sys.exit(1)


# ============================================================
# 29. RESULTADO
# ============================================================

print()
print("=" * 78)
print("CONFIA — FASE 3B V2 / CONTEXTO DIÁRIO")
print("=" * 78)
print()

print("✓ dailyContext criado")
print("✓ Primeiro contacto tem prioridade máxima")
print("✓ Regresso após ausência reconhecido")
print("✓ Primeira abertura do dia reconhecida")
print("✓ Nova abertura no mesmo dia reconhecida")
print("✓ Dias desde abertura anterior reutilizados")
print("✓ Early learning reutilizado")
print("✓ Memória existente reutilizada")
print("✓ Aprendizagem do Impulso reutilizada")
print("✓ Continuidade existente reutilizada")
print("✓ Ação já escolhida reutilizada")
print("✓ Nenhuma nova chamada real ao Reactive Engine")
print("✓ Nenhuma nova recolha real de memória")
print("✓ Nenhum novo storage")
print("✓ Nenhum novo useState")
print("✓ Nenhum novo useEffect")
print("✓ Nenhum timer")
print("✓ Nenhum listener")
print("✓ Nenhum requestAnimationFrame")
print("✓ Nenhuma dependência")
print("✓ Nenhum texto/UI")
print("✓ Nenhuma tradução necessária")
print("✓ Principal Vivo preservado")
print("✓ Fase 3A preservada")
print()
print("Backup:")
print(f"  {BACKUP}")
print()
print("PRÓXIMO PASSO:")
print("  npm run build")
print("=" * 78)
