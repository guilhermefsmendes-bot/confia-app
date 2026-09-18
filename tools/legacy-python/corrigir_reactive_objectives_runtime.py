from pathlib import Path
import shutil
import sys

# ============================================================
# CONFIA — CORREÇÃO RUNTIME REACTIVE ENGINE
#
# Problema:
#
# buildMetrics() contém duas referências residuais a:
#
#   objectives.length > 0
#
# mas não existe uma variável "objectives" nesse scope.
#
# A arquitetura 2F.2 já define:
#
#   validObjectiveRecords
#
# que contém apenas histórico válido:
# - completed numérico
# - total numérico
# - total > 0
#
# Portanto a condição correta é:
#
#   validObjectiveRecords.length > 0
#
# ALTERA:
# - src/data/reactive/reactiveEngine.ts
#
# NÃO ALTERA:
# - algoritmo de tendências
# - thresholds
# - respostas
# - intents
# - storage
# - traduções
# ============================================================

ROOT = Path.cwd()

FILE = (
    ROOT
    / "src/data/reactive/reactiveEngine.ts"
)

BACKUP = Path(
    "/tmp/reactiveEngine.ts.before_fix_objectives_runtime"
)


def fail(message: str):
    print()
    print("=" * 74)
    print("ERRO — CORREÇÃO NÃO APLICADA")
    print("=" * 74)
    print()
    print(message)
    print()
    print("Nenhum ficheiro foi alterado.")
    print("=" * 74)
    sys.exit(1)


# ============================================================
# 1. VALIDAR FICHEIRO
# ============================================================

if not FILE.exists():
    fail(
        f"Ficheiro não encontrado:\n{FILE}"
    )


original = FILE.read_text(
    encoding="utf-8"
)


# ============================================================
# 2. VALIDAR ARQUITETURA 2F.2
# ============================================================

required_markers = [
    "function buildMetrics(",
    "data: CompanionCollectedData",
    "const validObjectiveRecords =",
    "data.objectives.filter(",
    "item.total > 0",
    "const recentObjectiveRecords =",
    "const previousObjectiveRecords =",
    "const objectivesCompleted =",
    "recentObjectivePeriod.completed",
    "const objectivesTotal =",
    "recentObjectivePeriod.total",
    "const objectiveCompletionRate =",
    "recentObjectivePeriod.rate",
]

for marker in required_markers:
    if marker not in original:
        fail(
            "A estrutura do Reactive Engine não "
            "corresponde à versão auditada.\n\n"
            f"Falta:\n{marker}"
        )


# ============================================================
# 3. CONFIRMAR O BUG
# ============================================================

bug = "objectives.length > 0"

bug_count = original.count(bug)

if bug_count != 2:
    fail(
        "Esperava encontrar exatamente duas "
        "referências residuais a:\n\n"
        "  objectives.length > 0\n\n"
        f"Encontradas: {bug_count}"
    )


# ============================================================
# 4. CONFIRMAR QUE SÃO AS DUAS MÉTRICAS ESPERADAS
# ============================================================

old_completed = """      objectivesCompleted:
        objectives.length > 0
          ? objectivesCompleted
          : undefined,"""

new_completed = """      objectivesCompleted:
        validObjectiveRecords.length > 0
          ? objectivesCompleted
          : undefined,"""


old_total = """      objectivesTotal:
        objectives.length > 0
          ? objectivesTotal
          : undefined,"""

new_total = """      objectivesTotal:
        validObjectiveRecords.length > 0
          ? objectivesTotal
          : undefined,"""


if original.count(old_completed) != 1:
    fail(
        "Não encontrei exatamente o bloco "
        "objectivesCompleted esperado."
    )


if original.count(old_total) != 1:
    fail(
        "Não encontrei exatamente o bloco "
        "objectivesTotal esperado."
    )


# ============================================================
# 5. PREPARAR CORREÇÃO EM MEMÓRIA
# ============================================================

updated = original.replace(
    old_completed,
    new_completed,
    1,
)

updated = updated.replace(
    old_total,
    new_total,
    1,
)


# ============================================================
# 6. VALIDAR QUE O BUG DESAPARECE
# ============================================================

if "objectives.length > 0" in updated:
    fail(
        "Ainda existe uma referência a "
        "'objectives.length > 0' depois "
        "da correção em memória."
    )


if updated.count(
    "validObjectiveRecords.length > 0"
) != 2:
    fail(
        "A condição baseada em histórico válido "
        "não ficou exatamente em dois locais."
    )


# ============================================================
# 7. GARANTIR QUE NÃO ALTERÁMOS A MATEMÁTICA 2F.2
# ============================================================

protected_markers = [
    "const recentObjectiveRecords =",
    "validObjectiveRecords.slice(-3)",
    "const previousObjectiveRecords =",
    "validObjectiveRecords.slice(-6, -3)",
    "change >= 0.15",
    "change <= -0.15",
    "recentRate >= 0.60",
    "previousRate >= 0.60",
    "metrics.objectiveValidDays >= 2",
    "metrics.previousObjectiveValidDays >= 2",
]

for marker in protected_markers:
    if original.count(marker) != updated.count(marker):
        fail(
            "Foi alterada inesperadamente uma regra "
            "da 2F.2:\n\n"
            f"{marker}"
        )


# ============================================================
# 8. GARANTIR QUE FONTES DE DADOS NÃO MUDARAM
# ============================================================

for marker in [
    "data.objectives",
    "data.mood",
    "data.checkIns",
    "data.impulse",
]:
    if original.count(marker) != updated.count(marker):
        fail(
            "Foi alterado inesperadamente o acesso "
            "aos dados:\n\n"
            f"{marker}"
        )


# ============================================================
# 9. GARANTIR ALTERAÇÃO CIRÚRGICA
# ============================================================

#
# Só devem existir duas substituições textuais.
#

expected_old = (
    original.count("objectives.length > 0")
)

expected_new = (
    updated.count(
        "validObjectiveRecords.length > 0"
    )
)

if expected_old != 2 or expected_new != 2:
    fail(
        "A correção não corresponde exatamente "
        "às duas referências esperadas."
    )


# ============================================================
# 10. BACKUP
# ============================================================

shutil.copy2(
    FILE,
    BACKUP
)


# ============================================================
# 11. ESCREVER
# ============================================================

FILE.write_text(
    updated,
    encoding="utf-8"
)


# ============================================================
# 12. VALIDAR FICHEIRO ESCRITO
# ============================================================

written = FILE.read_text(
    encoding="utf-8"
)

if "objectives.length > 0" in written:
    fail(
        "A referência inválida ainda existe "
        "no ficheiro escrito."
    )


if written.count(
    "validObjectiveRecords.length > 0"
) != 2:
    fail(
        "O ficheiro escrito não contém "
        "as duas condições corrigidas."
    )


# ============================================================
# 13. RESULTADO
# ============================================================

print()
print("=" * 74)
print("CONFIA — REACTIVE ENGINE RUNTIME CORRIGIDO")
print("=" * 74)
print()
print("✓ ReferenceError eliminado")
print("✓ objectivesCompleted corrigido")
print("✓ objectivesTotal corrigido")
print("✓ Histórico antigo inválido continua ignorado")
print("✓ validObjectiveRecords preservado")
print("✓ Período recente preservado")
print("✓ Período anterior preservado")
print("✓ Threshold +15pp preservado")
print("✓ Threshold -15pp preservado")
print("✓ Consistência >=60% preservada")
print("✓ Nenhuma tradução alterada")
print("✓ Nenhum storage alterado")
print("✓ Nenhuma resposta reativa alterada")
print()
print("Backup:")
print(f"  {BACKUP}")
print()
print("PRÓXIMO PASSO:")
print("  npm run build")
print("=" * 74)
