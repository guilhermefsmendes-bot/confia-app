from pathlib import Path
import shutil

print("=" * 76)
print("CONFIA — CORREÇÃO FINAL A9 — ATMOSFERA")
print("=" * 76)

path = Path("src/components/Companheiro/ConfiaCompanionHome.tsx")
backup = Path("/tmp/ConfiaCompanionHome.tsx.before_fix_a9_atmosfera_final")

if not path.exists():
    print("ERRO: ficheiro não encontrado.")
    raise SystemExit(1)

text = path.read_text(encoding="utf-8")

# Backup
shutil.copy2(path, backup)

# O estado atual tem:
#
#   ${atmosphereClass}
#   blur-3xl
# `
# />
#
# O correto é:
#
#   ${atmosphereClass}
#   blur-3xl
# `}
# />

old = """            ${atmosphereClass}
            blur-3xl
          `
        />"""

new = """            ${atmosphereClass}
            blur-3xl
          `}
        />"""

if old not in text:
    print("ERRO: padrão atual da atmosfera não encontrado.")
    print("Nenhuma alteração feita.")
    raise SystemExit(1)

text = text.replace(old, new, 1)

# Validação
if new not in text:
    print("ERRO: correção não confirmada.")
    shutil.copy2(backup, path)
    raise SystemExit(1)

# Garantir que não ficou a versão errada
if old in text:
    print("ERRO: versão antiga ainda existe.")
    shutil.copy2(backup, path)
    raise SystemExit(1)

# Garantir estruturas A6-A9
for required in [
    "resolveCompanionRelationalMemory",
    "resolveCompanionRelationalExpression",
    "resolveCompanionRelationalAction",
    "companionRelationalNextStep",
]:
    if required not in text:
        print(f"ERRO: elemento A6-A9 desapareceu: {required}")
        shutil.copy2(backup, path)
        raise SystemExit(1)

path.write_text(text, encoding="utf-8")

print()
print("✓ className da atmosfera corrigido")
print("✓ Crase preservada")
print("✓ Chaveta JSX adicionada")
print("✓ A6 preservado")
print("✓ A7 preservado")
print("✓ A8 preservado")
print("✓ A9 preservado")
print("✓ Nenhuma navegação alterada")
print("✓ Nenhum storage alterado")
print()
print(f"Backup: {backup}")
print()
print("CORREÇÃO APLICADA.")
print("=" * 76)
