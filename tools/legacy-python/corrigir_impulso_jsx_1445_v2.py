from pathlib import Path
import shutil
import sys

# ============================================================
# CONFIA — CORREÇÃO JSX IMPULSOSOS V2
#
# Corrige o </div> excedente imediatamente antes de:
# {/* Navegação premium */}
#
# Estratégia:
# - não depende de espaços exatos
# - localiza a navegação premium
# - inspeciona as linhas anteriores
# - remove apenas o </div> mais próximo
#
# ALTERA:
# - src/components/ImpulsoSOS.tsx
#
# NÃO ALTERA:
# - lógica
# - estados
# - traduções
# - estilos
# - storage
# - Reactive Engine
# ============================================================

ROOT = Path.cwd()

FILE = ROOT / "src/components/ImpulsoSOS.tsx"

BACKUP = Path(
    "/tmp/ImpulsoSOS.tsx.before_fix_jsx_1445_v2"
)


def fail(message: str):
    print()
    print("=" * 72)
    print("ERRO — CORREÇÃO NÃO APLICADA")
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
# 2. LOCALIZAR NAVEGAÇÃO PREMIUM
# ============================================================

navigation_matches = [
    index
    for index, line in enumerate(lines)
    if "Navegação premium" in line
]

if len(navigation_matches) != 1:
    fail(
        "Esperava encontrar exatamente uma ocorrência "
        "de 'Navegação premium'.\n\n"
        f"Encontradas: {len(navigation_matches)}"
    )


nav_index = navigation_matches[0]


# ============================================================
# 3. ENCONTRAR LINHAS NÃO VAZIAS ANTERIORES
# ============================================================

previous_non_empty = []

for index in range(nav_index - 1, -1, -1):
    if lines[index].strip():
        previous_non_empty.append(index)

    if len(previous_non_empty) == 3:
        break


if len(previous_non_empty) < 3:
    fail(
        "Não existem linhas suficientes antes "
        "da Navegação premium para validar a estrutura."
    )


nearest_index = previous_non_empty[0]
second_index = previous_non_empty[1]
third_index = previous_non_empty[2]

nearest = lines[nearest_index].strip()
second = lines[second_index].strip()
third = lines[third_index].strip()


print()
print("=" * 72)
print("CONFIA — ANÁLISE JSX")
print("=" * 72)
print()
print(
    f"Linha antes da navegação: "
    f"{nearest_index + 1}: {nearest}"
)
print(
    f"2.ª linha não vazia anterior: "
    f"{second_index + 1}: {second}"
)
print(
    f"3.ª linha não vazia anterior: "
    f"{third_index + 1}: {third}"
)
print()


# ============================================================
# 4. VALIDAR PADRÃO AUDITADO
# ============================================================

#
# A estrutura observada foi:
#
# )}
# </div>
# </div>
# {/* Navegação premium */}
#
# O último </div> é o excedente.
#

if nearest != "</div>":
    fail(
        "A linha imediatamente anterior à navegação "
        "não é </div>.\n\n"
        f"Encontrado: {nearest}"
    )


if second != "</div>":
    fail(
        "A segunda linha não vazia anterior "
        "não é </div>.\n\n"
        f"Encontrado: {second}"
    )


if third != ")}":
    fail(
        "A terceira linha não vazia anterior "
        "não corresponde ao fecho condicional esperado.\n\n"
        f"Encontrado: {third}"
    )


# ============================================================
# 5. VALIDAR SECTION PRINCIPAL
# ============================================================

section_open_count_before = original.count(
    "<section"
)

section_close_count_before = original.count(
    "</section>"
)

if (
    section_open_count_before
    != section_close_count_before
):
    fail(
        "A contagem de <section> já está desequilibrada "
        "antes da correção.\n\n"
        f"<section>: {section_open_count_before}\n"
        f"</section>: {section_close_count_before}"
    )


if section_open_count_before != 3:
    fail(
        "Esperava encontrar os 3 <section> "
        "observados na auditoria.\n\n"
        f"Encontrados: {section_open_count_before}"
    )


# ============================================================
# 6. REMOVER APENAS O DIV EXCEDENTE
# ============================================================

updated_lines = list(lines)

removed_line = updated_lines.pop(
    nearest_index
)

updated = "".join(
    updated_lines
)


# ============================================================
# 7. VALIDAÇÕES DE SEGURANÇA
# ============================================================

if removed_line.strip() != "</div>":
    fail(
        "A linha preparada para remoção "
        "não era </div>."
    )


if (
    original.count("</div>")
    - updated.count("</div>")
    != 1
):
    fail(
        "A alteração não remove exatamente "
        "um único </div>."
    )


if (
    original.count("<section")
    != updated.count("<section")
):
    fail(
        "Foi alterada a quantidade de <section>."
    )


if (
    original.count("</section>")
    != updated.count("</section>")
):
    fail(
        "Foi alterada a quantidade de </section>."
    )


for marker in [
    "{/* Navegação premium */}",
    "onClick={prevStep}",
    "onClick={nextStep}",
    "setFinalIntensity(Number(e.target.value))",
]:
    if marker not in updated:
        fail(
            "Estrutura importante desapareceu:\n"
            f"{marker}"
        )


# ============================================================
# 8. GARANTIR QUE NÃO MEXEMOS EM LÓGICA
# ============================================================

logic_markers = [
    "localStorage.setItem",
    "analyzeReactiveState",
    "recordReactiveResponse",
    "setIntensity",
    "setFinalIntensity",
    "nextStep",
    "prevStep",
]

for marker in logic_markers:
    if (
        original.count(marker)
        != updated.count(marker)
    ):
        fail(
            "Foi detetada alteração inesperada "
            "na lógica:\n"
            f"{marker}"
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
# 11. CONFIRMAR RESULTADO ESCRITO
# ============================================================

written = FILE.read_text(
    encoding="utf-8"
)

written_lines = written.splitlines()

written_nav_matches = [
    index
    for index, line in enumerate(written_lines)
    if "Navegação premium" in line
]

if len(written_nav_matches) != 1:
    fail(
        "A Navegação premium deixou de ser única "
        "após a escrita."
    )


written_nav_index = written_nav_matches[0]

written_previous = []

for index in range(
    written_nav_index - 1,
    -1,
    -1
):
    if written_lines[index].strip():
        written_previous.append(
            written_lines[index].strip()
        )

    if len(written_previous) == 2:
        break


if written_previous != [
    "</div>",
    ")}",
]:
    fail(
        "A estrutura final antes da Navegação premium "
        "não ficou como esperado.\n\n"
        f"Encontrado: {written_previous}"
    )


# ============================================================
# 12. RESULTADO
# ============================================================

print("=" * 72)
print("CONFIA — IMPULSO JSX CORRIGIDO")
print("=" * 72)
print()
print(
    f"✓ Removido </div> da antiga linha "
    f"{nearest_index + 1}"
)
print("✓ Condicional anterior preservado")
print("✓ Navegação premium preservada")
print("✓ <section> principal preservado")
print("✓ prevStep preservado")
print("✓ nextStep preservado")
print("✓ Nenhuma lógica alterada")
print("✓ Nenhuma tradução alterada")
print("✓ Nenhum storage alterado")
print()
print("Backup:")
print(f"  {BACKUP}")
print()
print("PRÓXIMO PASSO:")
print("  npm run build")
print("=" * 72)
