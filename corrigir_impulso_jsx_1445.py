from pathlib import Path
import shutil
import sys

# ============================================================
# CONFIA — CORREÇÃO JSX IMPULSOSOS
#
# Problema:
# existe um </div> excedente imediatamente antes de
# {/* Navegação premium */}
#
# O <section> principal abre antes e só deve fechar depois
# da navegação premium.
#
# ALTERA:
# - src/components/ImpulsoSOS.tsx
#
# NÃO ALTERA:
# - lógica do Impulso
# - estados
# - traduções
# - Reactive Engine
# - storage
# - estilos
# ============================================================

ROOT = Path.cwd()

FILE = ROOT / "src/components/ImpulsoSOS.tsx"

BACKUP = Path(
    "/tmp/ImpulsoSOS.tsx.before_fix_jsx_1445"
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


# ============================================================
# 2. CONFIRMAR ESTRUTURA ESPERADA
# ============================================================

required_markers = [
    '<section className="relative mx-auto max-w-[450px]',
    "{/* Navegação premium */}",
    "onClick={prevStep}",
    "onClick={nextStep}",
    "</section>",
]

for marker in required_markers:
    if marker not in original:
        fail(
            "A estrutura atual não corresponde "
            "à estrutura auditada.\n\n"
            f"Falta:\n{marker}"
        )


# ============================================================
# 3. LOCALIZAR EXATAMENTE O ERRO
# ============================================================

old_block = """          )}
        </div>

        </div>

        {/* Navegação premium */}"""

new_block = """          )}
        </div>

        {/* Navegação premium */}"""


count = original.count(old_block)

if count != 1:
    fail(
        "Não encontrei exatamente uma ocorrência "
        "do bloco JSX problemático.\n\n"
        f"Ocorrências encontradas: {count}\n\n"
        "O ficheiro pode ter mudado desde a auditoria."
    )


# ============================================================
# 4. PREPARAR ALTERAÇÃO EM MEMÓRIA
# ============================================================

updated = original.replace(
    old_block,
    new_block,
    1,
)


# ============================================================
# 5. GARANTIR ALTERAÇÃO MÍNIMA
# ============================================================

original_lines = original.splitlines()
updated_lines = updated.splitlines()

if len(original_lines) - len(updated_lines) != 2:
    fail(
        "A alteração não remove exatamente "
        "a linha </div> excedente e a linha vazia "
        "associada."
    )


if "{/* Navegação premium */}" not in updated:
    fail(
        "A navegação premium desapareceu "
        "durante a alteração."
    )


if "onClick={prevStep}" not in updated:
    fail(
        "O botão anterior foi alterado."
    )


if "onClick={nextStep}" not in updated:
    fail(
        "O botão seguinte foi alterado."
    )


# ============================================================
# 6. GARANTIR QUE O SECTION PRINCIPAL CONTINUA
# ============================================================

section_open_count = updated.count("<section")
section_close_count = updated.count("</section>")

if section_open_count != section_close_count:
    fail(
        "Depois da correção, a contagem global "
        "de <section> e </section> não coincide.\n\n"
        f"<section: {section_open_count}\n"
        f"</section>: {section_close_count}"
    )


# ============================================================
# 7. GARANTIR QUE NÃO MEXEMOS EM LÓGICA
# ============================================================

for forbidden_change in [
    "localStorage.setItem",
    "analyzeReactiveState",
    "recordReactiveResponse",
]:
    if original.count(forbidden_change) != updated.count(
        forbidden_change
    ):
        fail(
            "Foi detetada uma alteração inesperada "
            "na lógica:\n"
            f"{forbidden_change}"
        )


# ============================================================
# 8. BACKUP
# ============================================================

shutil.copy2(
    FILE,
    BACKUP
)


# ============================================================
# 9. ESCREVER
# ============================================================

FILE.write_text(
    updated,
    encoding="utf-8"
)


# ============================================================
# 10. VERIFICAÇÃO FINAL
# ============================================================

written = FILE.read_text(
    encoding="utf-8"
)

if old_block in written:
    fail(
        "O bloco problemático continua presente "
        "depois da escrita."
    )


if new_block not in written:
    fail(
        "A estrutura corrigida não foi encontrada "
        "depois da escrita."
    )


# ============================================================
# 11. RESULTADO
# ============================================================

print()
print("=" * 72)
print("CONFIA — IMPULSO JSX CORRIGIDO")
print("=" * 72)
print()
print("✓ </div> excedente removido")
print("✓ <section> principal preservado")
print("✓ Navegação premium permanece dentro do <section>")
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
