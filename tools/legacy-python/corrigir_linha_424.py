from pathlib import Path
import shutil

print("=" * 76)
print("CONFIA — CORREÇÃO A9 — FECHO JSX DA ATMOSFERA")
print("=" * 76)

path = Path("src/components/Companheiro/ConfiaCompanionHome.tsx")
backup = Path("/tmp/ConfiaCompanionHome.tsx.before_fix_linha_424")

if not path.exists():
    print("ERRO: ficheiro não encontrado.")
    raise SystemExit(1)

lines = path.read_text(encoding="utf-8").splitlines(keepends=True)

# ------------------------------------------------------------
# CONFIRMAR que a linha 424 é realmente o fecho da atmosfera
# ------------------------------------------------------------

if len(lines) < 424:
    print("ERRO: o ficheiro tem menos de 424 linhas.")
    raise SystemExit(1)

line_422 = lines[421].strip()
line_423 = lines[422].strip()
line_424 = lines[423].strip()
line_425 = lines[424].strip()

print()
print("Estado encontrado:")

print(f"422: {line_422}")
print(f"423: {line_423}")
print(f"424: {line_424}")
print(f"425: {line_425}")

if line_422 != "${atmosphereClass}":
    print()
    print("ERRO: a linha 422 não corresponde ao atmosphereClass esperado.")
    print("Nenhuma alteração feita.")
    raise SystemExit(1)

if line_423 != "blur-3xl":
    print()
    print("ERRO: a linha 423 não corresponde a blur-3xl.")
    print("Nenhuma alteração feita.")
    raise SystemExit(1)

if line_424 != "`":
    print()
    print("ERRO: a linha 424 não contém apenas a crase esperada.")
    print("Nenhuma alteração feita.")
    raise SystemExit(1)

if line_425 != "/>":
    print()
    print("ERRO: a linha 425 não corresponde ao fecho />.")
    print("Nenhuma alteração feita.")
    raise SystemExit(1)

# ------------------------------------------------------------
# BACKUP
# ------------------------------------------------------------

shutil.copy2(path, backup)

# ------------------------------------------------------------
# CORREÇÃO EXATA
# ------------------------------------------------------------

# Preserva a indentação original e apenas acrescenta }
lines[423] = lines[423].replace("`", "`}", 1)

# ------------------------------------------------------------
# VALIDAÇÃO LOCAL
# ------------------------------------------------------------

if lines[423].strip() != "`}":
    print()
    print("ERRO: não foi possível confirmar a correção.")
    shutil.copy2(backup, path)
    raise SystemExit(1)

# ------------------------------------------------------------
# PRESERVAR A6-A9
# ------------------------------------------------------------

new_text = "".join(lines)

for required in [
    "resolveCompanionRelationalMemory",
    "resolveCompanionRelationalExpression",
    "resolveCompanionRelationalAction",
    "companionRelationalNextStep",
]:
    if required not in new_text:
        print()
        print(f"ERRO: elemento A6-A9 desapareceu: {required}")
        shutil.copy2(backup, path)
        raise SystemExit(1)

# ------------------------------------------------------------
# ESCREVER
# ------------------------------------------------------------

path.write_text(new_text, encoding="utf-8")

print()
print("✓ Linha 424 corrigida")
print("✓ ${atmosphereClass} preservado")
print("✓ blur-3xl preservado")
print("✓ Fecho passou de ` para `}")
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
