from pathlib import Path
import shutil
import sys

# ============================================================
# CONFIA — OBJETIVOS PREMIUM 2F.5
# Silêncio inteligente quando ainda não há tendência
#
# ALTERA:
# - src/App.tsx
#
# OBJETIVO:
# Ao entrar passivamente nos Objetivos:
#
# objective trend real
#       ↓
# mostrar resposta
#
# no_data
#       ↓
# não mostrar resposta
#
# A conclusão explícita continua a mostrar resposta.
#
# NÃO ALTERA:
# - reactiveEngine
# - reactiveResponses
# - reactiveIntentEngine
# - traduções
# - storage
# - XP
# - UI estrutural
# ============================================================

ROOT = Path.cwd()

APP = ROOT / "src/App.tsx"

BACKUP = Path(
    "/tmp/App.tsx.before_objectives_2f5"
)


def fail(message: str):
    print()
    print("=" * 72)
    print("ERRO — 2F.5 NÃO APLICADA")
    print("=" * 72)
    print()
    print(message)
    print()
    print("Nenhum ficheiro foi alterado.")
    print("=" * 72)
    sys.exit(1)


# ============================================================
# 1. VALIDAR FICHEIRO
# ============================================================

if not APP.exists():
    fail(
        f"Ficheiro não encontrado: {APP}"
    )


# ============================================================
# 2. LER ANTES DE ALTERAR
# ============================================================

app_original = APP.read_text(
    encoding="utf-8"
)


# ============================================================
# 3. CONFIRMAR BASE 2F.3
# ============================================================

required = [
    "Objetivos — leitura contextual ao entrar.",
    'if (currentTab !== 1) return;',
    "const objectiveReactiveResult =",
    'source: "objective"',
    "objectiveReactiveResult?.response?.translationKey",
    "setReactiveMessageKey(",
    "objectiveReactiveResult.response.translationKey",
    "currentTab === 1 && reactiveMessageKey",
]

for marker in required:
    if marker not in app_original:
        fail(
            "App.tsx não corresponde à versão "
            "esperada depois da 2F.3.\n\n"
            f"Falta:\n{marker}"
        )


# ============================================================
# 4. EVITAR APLICAÇÃO DUPLA
# ============================================================

if (
    'objectiveReactiveResult.situation === "no_data"'
    in app_original
):
    fail(
        "A proteção no_data já parece existir."
    )


# ============================================================
# 5. LOCALIZAR O EFFECT PASSIVO
# ============================================================

old_block = """    if (
      objectiveReactiveResult?.response?.translationKey
    ) {
      setReactiveMessageKey(
        objectiveReactiveResult.response.translationKey
      );
    }
  }, [currentTab, objectivesHistory]);"""

new_block = """    /**
     * Silêncio inteligente.
     *
     * "no_data" é uma situação válida para o motor
     * global da CONFIA, mas não representa uma
     * descoberta relevante dentro dos Objetivos.
     *
     * Portanto:
     *
     * - improving   -> mostrar
     * - declining   -> mostrar
     * - consistent  -> mostrar
     * - no_data     -> silêncio
     */
    if (
      objectiveReactiveResult.situation === "no_data"
    ) {
      setReactiveMessageKey(null);
      return;
    }

    if (
      objectiveReactiveResult?.response?.translationKey
    ) {
      setReactiveMessageKey(
        objectiveReactiveResult.response.translationKey
      );
    } else {
      setReactiveMessageKey(null);
    }
  }, [currentTab, objectivesHistory]);"""

if app_original.count(old_block) != 1:
    fail(
        "Não encontrei exatamente o final "
        "do effect passivo dos Objetivos."
    )


app_new = app_original.replace(
    old_block,
    new_block,
    1,
)


# ============================================================
# 6. VALIDAR RESULTADO EM MEMÓRIA
# ============================================================

for marker in [
    'objectiveReactiveResult.situation === "no_data"',
    "setReactiveMessageKey(null);",
    "objectiveReactiveResult.response.translationKey",
    "currentTab === 1 && reactiveMessageKey",
]:
    if marker not in app_new:
        fail(
            "Validação em memória falhou:\n"
            f"{marker}"
        )


# ============================================================
# 7. GARANTIR QUE A CONCLUSÃO IMEDIATA CONTINUA
# ============================================================

for marker in [
    "const nextCompleted = !obj.completed;",
    "const objectiveReactiveResult =",
    "objectiveCompleted: true",
    "objectiveReactiveResult.response.translationKey",
    "objectiveReactiveResult.response.id",
    "recordReactiveResponse({",
]:
    if marker not in app_new:
        fail(
            "A reação imediata de conclusão "
            "perdeu uma estrutura importante:\n"
            f"{marker}"
        )


# ============================================================
# 8. GARANTIR QUE A UI CONTINUA
# ============================================================

for marker in [
    "currentTab === 1 && reactiveMessageKey",
    't("homeNow.eyebrow")',
    "t(reactiveMessageKey)",
    "<ObjectivosList",
]:
    if marker not in app_new:
        fail(
            "A UI reativa dos Objetivos perdeu "
            "uma estrutura importante:\n"
            f"{marker}"
        )


# ============================================================
# 9. NÃO CRIAR ESTADO
# ============================================================

if (
    app_new.count("useState")
    != app_original.count("useState")
):
    fail(
        "O número de useState mudou."
    )


# ============================================================
# 10. NÃO CRIAR STORAGE
# ============================================================

if (
    app_new.count("localStorage.setItem")
    != app_original.count("localStorage.setItem")
):
    fail(
        "O número de localStorage.setItem mudou."
    )


if (
    app_new.count("localStorage.removeItem")
    != app_original.count("localStorage.removeItem")
):
    fail(
        "O número de localStorage.removeItem mudou."
    )


# ============================================================
# 11. NÃO ALTERAR O REGISTO REATIVO
# ============================================================

if (
    app_new.count("recordReactiveResponse({")
    != app_original.count("recordReactiveResponse({")
):
    fail(
        "O número de chamadas a "
        "recordReactiveResponse mudou."
    )


# ============================================================
# 12. GARANTIR UMA ÚNICA PROTEÇÃO NO_DATA
# ============================================================

if app_new.count(
    'objectiveReactiveResult.situation === "no_data"'
) != 1:
    fail(
        "A proteção no_data não ficou "
        "exatamente uma vez."
    )


# ============================================================
# 13. BACKUP
# ============================================================

shutil.copy2(
    APP,
    BACKUP
)


# ============================================================
# 14. ESCREVER
# ============================================================

APP.write_text(
    app_new,
    encoding="utf-8"
)


# ============================================================
# 15. VALIDAÇÃO FINAL
# ============================================================

written = APP.read_text(
    encoding="utf-8"
)

for marker in [
    'objectiveReactiveResult.situation === "no_data"',
    "setReactiveMessageKey(null);",
    "objectiveCompleted: true",
    "currentTab === 1 && reactiveMessageKey",
]:
    if marker not in written:
        print()
        print("ATENÇÃO:")
        print("Validação final falhou:")
        print(marker)
        print()
        print("Backup:")
        print(BACKUP)
        sys.exit(1)


# ============================================================
# 16. RESULTADO
# ============================================================

print()
print("=" * 72)
print("CONFIA — OBJETIVOS PREMIUM 2F.5")
print("=" * 72)
print()
print("✓ no_data deixa de gerar card passivo nos Objetivos")
print("✓ Falta de conhecimento passa a resultar em silêncio")
print("✓ Nenhuma tendência é inventada")
print("✓ objective_completed continua visível")
print("✓ improving continua visível")
print("✓ declining continua visível")
print("✓ consistent continua visível")
print("✓ Resposta de conclusão continua registada")
print("✓ Cooldown reativo preservado")
print("✓ Reactive Engine não alterado")
print("✓ no_data global preservado")
print("✓ Home reativa preservada")
print("✓ Mesmo reactiveMessageKey")
print("✓ Sem novo estado")
print("✓ Sem novo localStorage")
print("✓ Sem novas dependências")
print("✓ Sem novas traduções")
print()
print("Backup:")
print(f"  {BACKUP}")
print()
print("PRÓXIMO PASSO:")
print("  npm run build")
print("=" * 72)
