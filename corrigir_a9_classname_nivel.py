from pathlib import Path
import shutil

print("=" * 76)
print("CONFIA — CORREÇÃO A9 — CLASSNAME DO INDICADOR DE NÍVEL")
print("=" * 76)

path = Path("src/components/Companheiro/ConfiaCompanionHome.tsx")
backup = Path("/tmp/ConfiaCompanionHome.tsx.before_fix_a9_nivel")

if not path.exists():
    print("ERRO: ficheiro não encontrado.")
    raise SystemExit(1)

lines = path.read_text(encoding="utf-8").splitlines(keepends=True)

if len(lines) < 515:
    print("ERRO: ficheiro demasiado curto.")
    raise SystemExit(1)

# Linha 515, índice 514
current = lines[514].strip()

print()
print(f"Linha 515 encontrada: {current}")

if current != "`}":
    print()
    print("ERRO: a linha 515 não corresponde ao fecho incorreto esperado.")
    print("Nenhuma alteração feita.")
    raise SystemExit(1)

# Confirmar contexto para evitar alteração errada
if lines[502].strip() != "<div":
    print("ERRO: contexto inesperado antes do indicador.")
    raise SystemExit(1)

if 'className="' not in "".join(lines[503:516]):
    print("ERRO: className esperado não encontrado.")
    raise SystemExit(1)

# Backup
shutil.copy2(path, backup)

# Correção EXATA:
# `}` -> "
lines[514] = lines[514].replace("`}", '"', 1)

new_text = "".join(lines)

# Confirmar
if lines[514].strip() != '"':
    print("ERRO: correção não confirmada.")
    shutil.copy2(backup, path)
    raise SystemExit(1)

# Preservar A6-A9
for required in [
    "resolveCompanionRelationalMemory",
    "resolveCompanionRelationalExpression",
    "resolveCompanionRelationalAction",
    "companionRelationalNextStep",
]:
    if required not in new_text:
        print(f"ERRO: elemento A6-A9 desapareceu: {required}")
        shutil.copy2(backup, path)
        raise SystemExit(1)

path.write_text(new_text, encoding="utf-8")

print()
print("✓ Fecho do className corrigido")
print('✓ `}` substituído por "')
print("✓ Sparkles preservado")
print("✓ Indicador de nível preservado")
print("✓ A6 preservado")
print("✓ A7 preservado")
print("✓ A8 preservado")
print("✓ A9 preservado")
print("✓ Nenhum storage alterado")
print("✓ Nenhuma navegação alterada")
print()
print(f"Backup: {backup}")
print()
print("CORREÇÃO APLICADA.")
print("=" * 76)
