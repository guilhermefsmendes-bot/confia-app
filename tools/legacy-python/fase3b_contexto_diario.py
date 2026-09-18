from pathlib import Path
import shutil
import sys

# ============================================================
# CONFIA — FASE 3
# 3B — CONTEXTO DIÁRIO INTELIGENTE
#
# Objetivo:
#
# Transformar a infraestrutura factual da 3A num contexto
# diário único que a futura experiência "Momento de Hoje"
# poderá consumir.
#
# IMPORTANTE:
#
# Esta fase NÃO:
# - cria UI;
# - cria textos;
# - cria traduções;
# - cria storage;
# - cria useState;
# - cria useEffect;
# - chama novamente o Reactive Engine;
# - regista respostas reativas;
# - escolhe uma nova ação.
#
# O dailyContext apenas organiza informação já existente.
#
# Hierarquia:
#
# 1. first_contact
# 2. return_after_absence
# 3. first_today
# 4. already_here_today
#
# A ausência usada aqui refere-se à ABERTURA DA APP.
# Não substitui o return_after_absence do Reactive Engine,
# que continua baseado nos registos do utilizador.
#
# ALTERA APENAS:
# src/App.tsx
#
# Backup:
# /tmp/App.tsx.before_fase3b_contexto_diario
# ============================================================

ROOT = Path.cwd()

APP = ROOT / "src/App.tsx"

BACKUP = Path(
    "/tmp/App.tsx.before_fase3b_contexto_diario"
)


def fail(message: str):
    print()
    print("=" * 78)
    print("ERRO — FASE 3B NÃO APLICADA")
    print("=" * 78)
    print()
    print(message)
    print()
    print("Nenhum ficheiro foi alterado.")
    print("=" * 78)
    sys.exit(1)


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
# 2. VALIDAR QUE 3A EXISTE
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
        "A Fase 3A não parece estar completa.\n\n"
        "Falta:\n"
        + "\n".join(missing_3a)
    )


# ============================================================
# 3. IMPEDIR DUPLICAÇÃO
# ============================================================

markers_3b = [
    "CONFIA 3B — CONTEXTO DIÁRIO",
    "type DailyContextState",
    "const dailyContext =",
    "return_after_absence",
    "already_here_today",
]

if (
    "CONFIA 3B — CONTEXTO DIÁRIO"
    in original
    or "const dailyContext =" in original
):
    fail(
        "A Fase 3B já parece estar aplicada."
    )


# ============================================================
# 4. GUARDAR CONTAGENS ORIGINAIS
# ============================================================

counts_before = {
    "useState":
        original.count("useState("),

    "useEffect":
        original.count("useEffect("),

    "getItem":
        original.count("localStorage.getItem"),

    "setItem":
        original.count("localStorage.setItem"),

    "analyze":
        original.count("analyzeReactiveState"),

    "record":
        original.count("recordReactiveResponse"),

    "setTimeout":
        original.count("setTimeout("),

    "setInterval":
        original.count("setInterval("),

    "requestAnimationFrame":
        original.count("requestAnimationFrame"),
}


# ============================================================
# 5. VALIDAR ESTRUTURA ATUAL
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
        "A estrutura da Principal não corresponde "
        "à versão auditada.\n\n"
        "Falta:\n"
        + "\n".join(missing_existing)
    )


# ============================================================
# 6. ÂNCORA
#
# Inserimos dailyContext DEPOIS de homeNowAction.
#
# Para isso usamos o comentário que atualmente inicia
# homeNowContext.
#
# Assim:
#
# homeNowMemory
#      ↓
# homeNowAction
#      ↓
# dailyContext
#      ↓
# homeNowContext
#
# O dailyContext observa os resultados existentes.
# Não interfere neles.
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
        "Não encontrei exatamente uma vez a âncora "
        "esperada antes de homeNowContext."
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
 * A 3A responde:
 * "Quando é que a app foi aberta?"
 *
 * A 3B organiza essa informação juntamente com sinais
 * já escolhidos pelas camadas existentes da Principal.
 *
 * Não existe uma segunda decisão emocional aqui.
 *
 * O Reactive Engine continua responsável por:
 * - situação;
 * - intenção;
 * - resposta;
 * - ação contextual.
 *
 * A memória recente continua responsável por:
 * - aprendizagem;
 * - continuidade;
 * - experiências anteriores.
 *
 * O dailyContext apenas prepara a futura experiência
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
   * Prioridade:
   *
   * 1. Primeiro contacto absoluto.
   *
   * 2. Regresso após ausência de abertura da app.
   *    Usamos >= 2 dias:
   *
   *    ontem -> hoje = continuidade normal
   *    anteontem ou antes -> existe pelo menos um dia
   *    completo sem abrir a CONFIA.
   *
   * 3. Primeira abertura deste dia.
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
   * MEMÓRIA DISPONÍVEL
   * --------------------------------------------------------
   *
   * Não copiamos os dados completos.
   *
   * Apenas expomos que tipo de memória a Principal já
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
   * AÇÃO ATUAL
   * --------------------------------------------------------
   *
   * Não voltamos a executar analyzeReactiveState().
   *
   * Reutilizamos exclusivamente a decisão já tomada por
   * homeNowAction.
   */
  const suggestedAction =
    homeNowAction?.kind ?? null;

  /**
   * --------------------------------------------------------
   * CONTEXTO FINAL
   * --------------------------------------------------------
   *
   * Este objeto é factual.
   *
   * Ainda não contém:
   * - frases;
   * - variantes editoriais;
   * - escolha visual;
   * - celebrações;
   * - XP;
   * - cooldown;
   * - histórico próprio.
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
# 9. ISOLAR BLOCO INSERIDO
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

end += len(end_marker)

block = updated[
    start:end
]


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
    if state not in block:
        fail(
            "Falta estado diário:\n"
            f"{state}"
        )


# ============================================================
# 11. VALIDAR HIERARQUIA
# ============================================================

first_contact_pos = block.find(
    'state = "first_contact"'
)

absence_pos = block.find(
    'state = "return_after_absence"'
)

first_today_pos = block.find(
    'state = "first_today"'
)

already_today_pos = block.find(
    'state = "already_here_today"'
)

if not (
    first_contact_pos
    < absence_pos
    < first_today_pos
    < already_today_pos
):
    fail(
        "A hierarquia dos estados diários "
        "não ficou na ordem esperada."
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
    if marker not in block:
        fail(
            "Regresso após ausência incompleto:\n"
            f"{marker}"
        )


# ============================================================
# 13. VALIDAR REUTILIZAÇÃO DE MEMÓRIA
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
    if marker not in block:
        fail(
            "Integração de memória incompleta:\n"
            f"{marker}"
        )


# ============================================================
# 14. VALIDAR REUTILIZAÇÃO DA AÇÃO
# ============================================================

if (
    "homeNowAction?.kind"
    not in block
):
    fail(
        "A 3B deveria reutilizar homeNowAction."
    )


# ============================================================
# 15. PROIBIR NOVA DECISÃO REATIVA
# ============================================================

for forbidden in [
    "analyzeReactiveState(",
    "recordReactiveResponse(",
    "collectReactiveRecentMemory(",
]:
    if forbidden in block:
        fail(
            "A 3B não deve executar novamente "
            "os motores existentes:\n\n"
            f"{forbidden}"
        )


# ============================================================
# 16. PROIBIR NOVO STORAGE
# ============================================================

for forbidden in [
    "localStorage.getItem",
    "localStorage.setItem",
    "localStorage.removeItem",
]:
    if forbidden in block:
        fail(
            "A 3B não deve criar ou consultar "
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
    if forbidden in block:
        fail(
            "A 3B deve ser totalmente derivada:\n\n"
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
    if forbidden in block:
        fail(
            "Operação não permitida na 3B:\n\n"
            f"{forbidden}"
        )


# ============================================================
# 19. VERIFICAR DELTAS GLOBAIS
# ============================================================

counts_after = {
    "useState":
        updated.count("useState("),

    "useEffect":
        updated.count("useEffect("),

    "getItem":
        updated.count("localStorage.getItem"),

    "setItem":
        updated.count("localStorage.setItem"),

    "analyze":
        updated.count("analyzeReactiveState"),

    "record":
        updated.count("recordReactiveResponse"),

    "setTimeout":
        updated.count("setTimeout("),

    "setInterval":
        updated.count("setInterval("),

    "requestAnimationFrame":
        updated.count("requestAnimationFrame"),
}

for key in counts_before:
    if counts_after[key] != counts_before[key]:
        fail(
            f"A contagem global de {key} mudou.\n\n"
            f"Antes: {counts_before[key]}\n"
            f"Depois: {counts_after[key]}"
        )


# ============================================================
# 20. PRESERVAR 3A
# ============================================================

for marker in required_3a:
    if marker not in updated:
        fail(
            "A 3A deixou de estar intacta:\n"
            f"{marker}"
        )


# ============================================================
# 21. PRESERVAR PRINCIPAL VIVO
# ============================================================

for marker in required_existing:
    if marker not in updated:
        fail(
            "Estrutura existente desapareceu:\n"
            f"{marker}"
        )


# ============================================================
# 22. GARANTIR QUE NÃO HÁ TEXTO DE UI
# ============================================================

for forbidden in [
    "titleKey:",
    "textKey:",
    "actionKey:",
]:
    if forbidden in block:
        fail(
            "A 3B ainda não deve criar textos/UI:\n"
            f"{forbidden}"
        )


# ============================================================
# 23. IMPORTS INTACTOS
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
# 24. MARCADORES ÚNICOS
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

if updated.count(
    "const dailyContext ="
) != 1:
    fail(
        "dailyContext deveria existir "
        "exatamente uma vez."
    )


# ============================================================
# 25. BACKUP
# ============================================================

shutil.copy2(
    APP,
    BACKUP
)


# ============================================================
# 26. ESCREVER
# ============================================================

APP.write_text(
    updated,
    encoding="utf-8"
)


# ============================================================
# 27. VERIFICAÇÃO PÓS-ESCRITA
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
# 28. RESULTADO
# ============================================================

print()
print("=" * 78)
print("CONFIA — FASE 3B / CONTEXTO DIÁRIO")
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
print("✓ Ação do Reactive Engine reutilizada")
print("✓ Nenhuma nova chamada ao Reactive Engine")
print("✓ Nenhuma nova recolha de memória")
print("✓ Nenhum novo storage")
print("✓ Nenhum novo useState")
print("✓ Nenhum novo useEffect")
print("✓ Nenhum timer")
print("✓ Nenhum listener")
print("✓ Nenhuma dependência")
print("✓ Nenhum texto/UI")
print("✓ Nenhuma tradução necessária")
print("✓ Principal Vivo preservado")
print("✓ Fase 3A preservada")
print()
print("Backup:")
print(f"  {BACKUP}")
print()
print("FASE 3B PREPARADA.")
print()
print("PRÓXIMO PASSO:")
print("  npm run build")
print("=" * 78)
