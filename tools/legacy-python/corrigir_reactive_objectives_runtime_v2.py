from pathlib import Path
import shutil
import sys

# ============================================================
# CONFIA — CORREÇÃO RUNTIME OBJECTIVES V2
#
# Corrige exclusivamente as duas referências inválidas:
#
#   objectives.length > 0
#
# dentro de buildMetrics().
#
# Substitui por:
#
#   validObjectiveRecords.length > 0
#
# Não depende da indentação exata do ficheiro.
# ============================================================

ROOT = Path.cwd()

FILE = ROOT / "src/data/reactive/reactiveEngine.ts"

BACKUP = Path(
    "/tmp/reactiveEngine.ts.before_fix_objectives_runtime_v2"
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

lines = original.splitlines(
    keepends=True
)


# ============================================================
# 2. VALIDAR QUE ESTAMOS NO BUILDMETRICS CORRETO
# ============================================================

required_markers = [
    "function buildMetrics(",
    "const validObjectiveRecords =",
    "data.objectives.filter(",
    "recentObjectivePeriod.completed",
    "recentObjectivePeriod.total",
    "previousObjectivePeriod.rate",
]

for marker in required_markers:
    if marker not in original:
        fail(
            "Estrutura esperada do buildMetrics "
            "não encontrada.\n\n"
            f"Falta:\n{marker}"
        )


# ============================================================
# 3. LOCALIZAR EXATAMENTE AS DUAS LINHAS INVÁLIDAS
# ============================================================

matches = []

for index, line in enumerate(lines):
    if line.strip() == "objectives.length > 0":
        matches.append(index)


if len(matches) != 2:
    fail(
        "Esperava encontrar exatamente duas linhas com:\n\n"
        "  objectives.length > 0\n\n"
        f"Encontradas: {len(matches)}"
    )


print()
print("=" * 74)
print("CONFIA — REFERÊNCIAS ENCONTRADAS")
print("=" * 74)
print()

for index in matches:
    print(
        f"✓ Linha {index + 1}: "
        f"{lines[index].strip()}"
    )


# ============================================================
# 4. CONFIRMAR CONTEXTO DAS DUAS REFERÊNCIAS
# ============================================================

first_index = matches[0]
second_index = matches[1]

context_first = "".join(
    lines[max(0, first_index - 3):first_index + 4]
)

context_second = "".join(
    lines[max(0, second_index - 3):second_index + 4]
)


if "objectivesCompleted:" not in context_first:
    fail(
        "A primeira referência não está dentro "
        "do bloco objectivesCompleted."
    )


if "objectivesTotal:" not in context_second:
    fail(
        "A segunda referência não está dentro "
        "do bloco objectivesTotal."
    )


# ============================================================
# 5. PREPARAR SUBSTITUIÇÃO
# ============================================================

updated_lines = list(lines)

for index in matches:
    current_line = updated_lines[index]

    indentation = current_line[
        : len(current_line) - len(current_line.lstrip())
    ]

    newline = "\n" if current_line.endswith("\n") else ""

    updated_lines[index] = (
        indentation
        + "validObjectiveRecords.length > 0"
        + newline
    )


updated = "".join(updated_lines)


# ============================================================
# 6. VALIDAR RESULTADO EM MEMÓRIA
# ============================================================

if any(
    line.strip() == "objectives.length > 0"
    for line in updated.splitlines()
):
    fail(
        "Ainda existe uma referência inválida "
        "a objectives.length > 0."
    )


corrected_count = sum(
    1
    for line in updated.splitlines()
    if line.strip()
    == "validObjectiveRecords.length > 0"
)

if corrected_count != 2:
    fail(
        "Esperava encontrar exatamente duas "
        "condições corrigidas.\n\n"
        f"Encontradas: {corrected_count}"
    )


# ============================================================
# 7. GARANTIR QUE A MATEMÁTICA DOS OBJECTIVOS NÃO MUDOU
# ============================================================

protected_markers = [
    "const validObjectiveRecords =",
    "data.objectives.filter(",
    "const recentObjectiveRecords =",
    "const previousObjectiveRecords =",
    "recentObjectivePeriod.completed",
    "recentObjectivePeriod.total",
    "recentObjectivePeriod.rate",
    "previousObjectivePeriod.rate",
    "objectiveValidDays",
    "previousObjectiveValidDays",
]

for marker in protected_markers:
    if original.count(marker) != updated.count(marker):
        fail(
            "Foi alterada inesperadamente "
            "a arquitetura de métricas:\n\n"
            f"{marker}"
        )


# ============================================================
# 8. GARANTIR ALTERAÇÃO CIRÚRGICA
# ============================================================

changed_lines = []

original_plain = original.splitlines()
updated_plain = updated.splitlines()

if len(original_plain) != len(updated_plain):
    fail(
        "A quantidade de linhas mudou, "
        "o que não era esperado."
    )


for index, (before, after) in enumerate(
    zip(original_plain, updated_plain),
    start=1
):
    if before != after:
        changed_lines.append(
            (index, before.strip(), after.strip())
        )


if len(changed_lines) != 2:
    fail(
        "Esperava alterar exatamente duas linhas.\n\n"
        f"Foram alteradas: {len(changed_lines)}"
    )


for line_number, before, after in changed_lines:
    if before != "objectives.length > 0":
        fail(
            "Foi encontrada uma alteração inesperada "
            f"na linha {line_number}."
        )

    if after != "validObjectiveRecords.length > 0":
        fail(
            "A substituição da linha "
            f"{line_number} não ficou correta."
        )


# ============================================================
# 9. BACKUP
# ============================================================

shutil.copy2(
    FILE,
    BACKUP
)


# ============================================================
# 10. ESCREVER
# ============================================================

FILE.write_text(
    updated,
    encoding="utf-8"
)


# ============================================================
# 11. VERIFICAÇÃO PÓS-ESCRITA
# ============================================================

written = FILE.read_text(
    encoding="utf-8"
)


if "objectives.length > 0" in written:
    fail(
        "A referência inválida continua presente "
        "depois da escrita."
    )


written_corrected_count = sum(
    1
    for line in written.splitlines()
    if line.strip()
    == "validObjectiveRecords.length > 0"
)

if written_corrected_count != 2:
    fail(
        "O ficheiro escrito não contém exatamente "
        "as duas condições corrigidas."
    )


# ============================================================
# 12. RESULTADO
# ============================================================

print()
print("=" * 74)
print("CONFIA — RUNTIME OBJECTIVES CORRIGIDO")
print("=" * 74)
print()

for line_number, before, after in changed_lines:
    print(
        f"✓ Linha {line_number}: "
        f"{before} → {after}"
    )

print()
print("✓ ReferenceError corrigido")
print("✓ objectivesCompleted preservado")
print("✓ objectivesTotal preservado")
print("✓ validObjectiveRecords continua a ser a fonte válida")
print("✓ Histórico antigo sem total continua ignorado")
print("✓ Nenhuma matemática de tendência alterada")
print("✓ Nenhuma tradução alterada")
print("✓ Nenhum storage alterado")
print("✓ Exatamente 2 linhas alteradas")
print()
print("Backup:")
print(f"  {BACKUP}")
print()
print("PRÓXIMO PASSO:")
print("  npm run build")
print("=" * 74)
