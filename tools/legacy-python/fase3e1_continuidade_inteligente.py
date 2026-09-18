from pathlib import Path
import shutil
import sys

# ============================================================
# CONFIA — FASE 3
# 3E.1 — CONTINUIDADE INTELIGENTE
#
# Objetivo:
#
# Fazer dailyContext transportar uma leitura explícita do
# nível de aprendizagem/continuidade que JÁ existe.
#
# NÃO cria memória nova.
# NÃO volta a recolher memória.
# NÃO chama novamente o Reactive Engine.
# NÃO altera scoring.
# NÃO cria UI.
# NÃO cria texto.
#
# Hierarquia:
#
# 1. learned_impulse
#    Há aprendizagem do Impulso sustentada por >=2 episódios.
#
# 2. effective_impulse
#    Existe uma experiência eficaz, mas ainda não evidência
#    suficiente para falar de padrão aprendido.
#
# 3. repeated_signals
#    Existem sinais repetidos de continuidade.
#
# 4. early_learning
#    A CONFIA ainda está numa fase inicial de aprendizagem.
#
# 5. none
#    Ainda não existe evidência suficiente.
#
# ALTERA:
#   src/App.tsx
#
# BACKUP:
#   /tmp/App.tsx.before_fase3e1_continuidade_inteligente
# ============================================================

ROOT = Path.cwd()
APP = ROOT / "src/App.tsx"

BACKUP = Path(
    "/tmp/App.tsx.before_fase3e1_continuidade_inteligente"
)


def fail(message: str):
    print()
    print("=" * 78)
    print("ERRO — FASE 3E.1 NÃO APLICADA")
    print("=" * 78)
    print()
    print(message)
    print()
    print("App.tsx não foi alterado.")
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
# 2. VALIDAR ARQUITETURA ESPERADA
# ============================================================

required = [
    "CONFIA 3A.1 — SNAPSHOT ESTÁVEL",
    "CONFIA 3B — CONTEXTO DIÁRIO",
    "CONFIA 3C.1 — MOMENTO DE HOJE",
    "CONFIA 3D — AÇÃO INTELIGENTE DO DIA",
    "const dailyContext = (() => {",
    "const homeNowMemory = (() => {",
    'kind: "impulseLearning" as const',
    'kind: "impulseMemory" as const',
    'kind: "continuity" as const',
    "const hasImpulseLearning =",
    "const hasImpulseMemory =",
    "const hasContinuityMemory =",
    "const suggestedAction =",
]

missing = [
    marker
    for marker in required
    if marker not in original
]

if missing:
    fail(
        "A arquitetura atual não corresponde "
        "à versão esperada.\n\nFalta:\n"
        + "\n".join(missing)
    )


# ============================================================
# 3. IMPEDIR DUPLICAÇÃO
# ============================================================

if (
    "CONFIA 3E.1 — CONTINUIDADE INTELIGENTE"
    in original
):
    fail(
        "A Fase 3E.1 já parece estar aplicada."
    )

if "dailyLearningLevel" in original:
    fail(
        "dailyLearningLevel já existe no App.tsx."
    )


# ============================================================
# 4. ISOLAR DAILY CONTEXT
# ============================================================

start_marker = (
    "CONFIA 3B — CONTEXTO DIÁRIO"
)

start = original.find(
    start_marker
)

if start == -1:
    fail(
        "Não encontrei o início da Fase 3B."
    )

# A 3B termina antes do próximo bloco estrutural
# homeNowContext.
end = original.find(
    "const homeNowContext",
    start
)

if end == -1:
    fail(
        "Não encontrei const homeNowContext "
        "depois da Fase 3B."
    )

daily_block = original[
    start:end
]


# ============================================================
# 5. VALIDAR ÂNCORAS EXATAS
# ============================================================

memory_anchor = '''  const hasContinuityMemory =
    memoryKind === "continuity";
'''

if daily_block.count(memory_anchor) != 1:
    fail(
        "Não encontrei exatamente uma vez "
        "a âncora hasContinuityMemory."
    )


action_anchor = '''  const suggestedAction =
    homeNowAction?.kind ?? null;
'''

if daily_block.count(action_anchor) != 1:
    fail(
        "Não encontrei exatamente uma vez "
        "a âncora suggestedAction."
    )


# ============================================================
# 6. CRIAR NÍVEL DE APRENDIZAGEM DIÁRIA
#
# Isto NÃO aprende nada novo.
#
# Apenas traduz para um estado explícito aquilo que
# homeNowMemory já decidiu que tem evidência suficiente
# para disponibilizar à Principal.
# ============================================================

learning_block = '''
  /**
   * --------------------------------------------------------
   * CONFIA 3E.1 — CONTINUIDADE INTELIGENTE
   * --------------------------------------------------------
   *
   * Este nível NÃO representa uma nova memória.
   *
   * É apenas uma classificação da memória que já foi
   * recolhida por homeNowMemory.
   *
   * A ordem é deliberadamente conservadora:
   *
   * learned_impulse
   *   = aprendizagem sustentada por múltiplos episódios.
   *
   * effective_impulse
   *   = uma experiência eficaz conhecida, ainda sem
   *     evidência suficiente para afirmar um padrão.
   *
   * repeated_signals
   *   = existem sinais repetidos de continuidade.
   *
   * early_learning
   *   = existem poucos registos e a CONFIA ainda está
   *     a aprender.
   *
   * none
   *   = não existe evidência suficiente para comunicar
   *     aprendizagem ou continuidade.
   */
  const dailyLearningLevel =
    hasImpulseLearning
      ? "learned_impulse"
      : hasImpulseMemory
        ? "effective_impulse"
        : hasContinuityMemory
          ? "repeated_signals"
          : isEarlyLearning
            ? "early_learning"
            : "none";

'''

updated_daily_block = daily_block.replace(
    memory_anchor,
    memory_anchor + learning_block,
    1,
)

if updated_daily_block == daily_block:
    fail(
        "Não consegui inserir dailyLearningLevel."
    )


# ============================================================
# 7. EXPOR NO CONTEXTO FINAL
#
# Precisamos encontrar o return da 3B sem assumir todo
# o formato do objeto.
# ============================================================

if "return {" not in updated_daily_block:
    fail(
        "Não encontrei o objeto final da 3B."
    )

# Procuramos suggestedAction dentro do objeto final.
#
# Já existe:
# suggestedAction,
#
# Acrescentamos:
# dailyLearningLevel,
return_anchor = '''    suggestedAction,
'''

if updated_daily_block.count(return_anchor) != 1:
    fail(
        "Não encontrei exatamente uma vez "
        "suggestedAction no objeto final da 3B."
    )

updated_daily_block = (
    updated_daily_block.replace(
        return_anchor,
        return_anchor
        + '''    dailyLearningLevel,
''',
        1,
    )
)


# ============================================================
# 8. RECONSTRUIR APP
# ============================================================

updated = (
    original[:start]
    + updated_daily_block
    + original[end:]
)


# ============================================================
# 9. VALIDAÇÃO SEMÂNTICA
# ============================================================

required_new = [
    "CONFIA 3E.1 — CONTINUIDADE INTELIGENTE",
    "const dailyLearningLevel =",
    '? "learned_impulse"',
    '? "effective_impulse"',
    '? "repeated_signals"',
    '? "early_learning"',
    ': "none"',
    "dailyLearningLevel,",
]

for marker in required_new:
    if marker not in updated:
        fail(
            "Implementação incompleta:\n"
            f"{marker}"
        )


# ============================================================
# 10. GARANTIR QUE NÃO FOI CRIADA NOVA INTELIGÊNCIA
# ============================================================

new_start = updated.find(
    "CONFIA 3E.1 — CONTINUIDADE INTELIGENTE"
)

new_end = updated.find(
    "const suggestedAction =",
    new_start
)

if new_start == -1 or new_end == -1:
    fail(
        "Não consegui isolar a nova camada."
    )

new_region = updated[
    new_start:new_end
]

for forbidden in [
    "analyzeReactiveState(",
    "recordReactiveResponse(",
    "collectReactiveRecentMemory(",
    "localStorage.",
    "useState(",
    "useEffect(",
    "setTimeout(",
    "setInterval(",
    "requestAnimationFrame",
    "addEventListener(",
    "setCurrentTab(",
    "setHomeScreen(",
]:
    if forbidden in new_region:
        fail(
            "A 3E.1 introduziu lógica proibida:\n"
            f"{forbidden}"
        )


# ============================================================
# 11. CONTAGENS GLOBAIS
# ============================================================

tracked = [
    "useState(",
    "useEffect(",
    "localStorage.getItem",
    "localStorage.setItem",
    "localStorage.removeItem",
    "analyzeReactiveState(",
    "recordReactiveResponse(",
    "collectReactiveRecentMemory(",
    "setTimeout(",
    "setInterval(",
    "requestAnimationFrame",
    "addEventListener(",
]

for token in tracked:
    before = original.count(token)
    after = updated.count(token)

    if before != after:
        fail(
            f"A contagem de {token} mudou.\n\n"
            f"Antes: {before}\n"
            f"Depois: {after}"
        )


# ============================================================
# 12. GARANTIR QUE A MEMÓRIA EXISTENTE NÃO FOI ALTERADA
# ============================================================

home_memory_start = original.find(
    "const homeNowMemory = (() => {"
)

home_memory_end = original.find(
    "const homeNowAction",
    home_memory_start
)

updated_home_memory_start = updated.find(
    "const homeNowMemory = (() => {"
)

updated_home_memory_end = updated.find(
    "const homeNowAction",
    updated_home_memory_start
)

if (
    home_memory_start == -1
    or home_memory_end == -1
    or updated_home_memory_start == -1
    or updated_home_memory_end == -1
):
    fail(
        "Não consegui isolar homeNowMemory."
    )

original_home_memory = original[
    home_memory_start:
    home_memory_end
]

updated_home_memory = updated[
    updated_home_memory_start:
    updated_home_memory_end
]

if original_home_memory != updated_home_memory:
    fail(
        "homeNowMemory foi alterado.\n\n"
        "A 3E.1 deve apenas consumir a memória existente."
    )


# ============================================================
# 13. GARANTIR QUE A AÇÃO NÃO FOI ALTERADA
# ============================================================

home_action_start = original.find(
    "const homeNowAction"
)

home_action_end = original.find(
    start_marker,
    home_action_start
)

updated_home_action_start = updated.find(
    "const homeNowAction"
)

updated_home_action_end = updated.find(
    start_marker,
    updated_home_action_start
)

if (
    home_action_start == -1
    or home_action_end == -1
    or updated_home_action_start == -1
    or updated_home_action_end == -1
):
    fail(
        "Não consegui isolar homeNowAction."
    )

if (
    original[
        home_action_start:
        home_action_end
    ]
    != updated[
        updated_home_action_start:
        updated_home_action_end
    ]
):
    fail(
        "homeNowAction foi alterado."
    )


# ============================================================
# 14. GARANTIR QUE 3A / 3C / 3D CONTINUAM PRESENTES
# ============================================================

preserved = [
    "CONFIA 3A.1 — SNAPSHOT ESTÁVEL",
    "CONFIA 3B — CONTEXTO DIÁRIO",
    "CONFIA 3C.1 — MOMENTO DE HOJE",
    "CONFIA 3D — AÇÃO INTELIGENTE DO DIA",
    "isFirstAppOpenToday",
    "daysSincePreviousAppOpen",
    "dailyContext.state",
    "dailyContext.suggestedAction",
    "handleHomeNowAction",
    "<HomeWorld",
]

for marker in preserved:
    if marker not in updated:
        fail(
            "Estrutura existente desapareceu:\n"
            f"{marker}"
        )


# ============================================================
# 15. IMPORTS INTACTOS
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
        "A 3E.1 não deveria alterar imports."
    )


# ============================================================
# 16. BACKUP
# ============================================================

shutil.copy2(
    APP,
    BACKUP
)


# ============================================================
# 17. ESCREVER
# ============================================================

APP.write_text(
    updated,
    encoding="utf-8"
)


# ============================================================
# 18. VERIFICAÇÃO PÓS-ESCRITA
# ============================================================

try:
    written = APP.read_text(
        encoding="utf-8"
    )

    if (
        written.count(
            "CONFIA 3E.1 — CONTINUIDADE INTELIGENTE"
        )
        != 1
    ):
        raise RuntimeError(
            "Marcador 3E.1 inválido."
        )

    if (
        written.count(
            "const dailyLearningLevel ="
        )
        != 1
    ):
        raise RuntimeError(
            "dailyLearningLevel inválido."
        )

    if (
        written.count(
            "dailyLearningLevel,"
        )
        != 1
    ):
        raise RuntimeError(
            "dailyLearningLevel não foi exposto "
            "corretamente no dailyContext."
        )

except Exception as exc:
    shutil.copy2(
        BACKUP,
        APP
    )

    print()
    print("=" * 78)
    print(
        "ERRO PÓS-ESCRITA — ROLLBACK EXECUTADO"
    )
    print("=" * 78)
    print()
    print(exc)
    print()
    print(
        "App.tsx foi restaurado automaticamente."
    )
    print("=" * 78)

    sys.exit(1)


# ============================================================
# 19. RESULTADO
# ============================================================

print()
print("=" * 78)
print(
    "CONFIA — FASE 3E.1 / CONTINUIDADE INTELIGENTE"
)
print("=" * 78)
print()

print("✓ dailyLearningLevel criado")
print("✓ Aprendizagem forte distinguida")
print("✓ Experiência eficaz isolada distinguida")
print("✓ Sinais repetidos distinguidos")
print("✓ Early learning distinguido")
print("✓ Ausência de evidência distinguida")
print("✓ Memória existente reutilizada")
print("✓ homeNowMemory intacto")
print("✓ homeNowAction intacto")
print("✓ Nenhuma nova recolha de memória")
print("✓ Nenhuma nova chamada ao Reactive Engine")
print("✓ Nenhum novo histórico")
print("✓ Nenhum novo storage")
print("✓ Nenhum novo useState")
print("✓ Nenhum novo useEffect")
print("✓ Nenhum timer")
print("✓ Nenhum listener")
print("✓ Nenhum requestAnimationFrame")
print("✓ Nenhuma dependência")
print("✓ Nenhuma alteração visual")
print("✓ Nenhum texto novo")
print("✓ Traduções intactas")
print()
print("Backup:")
print(
    "  /tmp/App.tsx.before_fase3e1_continuidade_inteligente"
)
print()
print("PRÓXIMO PASSO:")
print("  npm run build")
print("=" * 78)
