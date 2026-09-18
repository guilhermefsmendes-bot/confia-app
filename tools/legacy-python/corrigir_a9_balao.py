from pathlib import Path
import shutil

print("=" * 76)
print("CONFIA — CORREÇÃO A9 — CLASSNAMES DO BALÃO")
print("=" * 76)

path = Path("src/components/Companheiro/ConfiaCompanionHome.tsx")
backup = Path("/tmp/ConfiaCompanionHome.tsx.before_fix_a9_balao")

if not path.exists():
    print("ERRO: ficheiro não encontrado.")
    raise SystemExit(1)

lines = path.read_text(encoding="utf-8").splitlines(keepends=True)

if len(lines) < 672:
    print("ERRO: ficheiro demasiado curto.")
    raise SystemExit(1)

# Linhas reais identificadas:
# 627 -> fecho do className={...} do balão
# 636 -> fecho do className="..." do <p>

line_627 = lines[626].strip()
line_636 = lines[635].strip()

print()
print(f"Linha 627 encontrada: {line_627}")
print(f"Linha 636 encontrada: {line_636}")

if line_627 != '"':
    print()
    print('ERRO: linha 627 não contém o fecho incorreto esperado `"}`.')
    print("Nenhuma alteração feita.")
    raise SystemExit(1)

if line_636 != "`}":
    print()
    print("ERRO: linha 636 não contém o fecho incorreto esperado `}.")
    print("Nenhuma alteração feita.")
    raise SystemExit(1)

# Confirmar contexto
if "${bubbleClass}" not in "".join(lines[616:628]):
    print("ERRO: bubbleClass não encontrado no contexto esperado.")
    raise SystemExit(1)

if "${bubbleShadow}" not in "".join(lines[616:628]):
    print("ERRO: bubbleShadow não encontrado no contexto esperado.")
    raise SystemExit(1)

if "{companionMessage}" not in "".join(lines[628:640]):
    print("ERRO: companionMessage não encontrado no contexto esperado.")
    raise SystemExit(1)

# Backup
shutil.copy2(path, backup)

# ------------------------------------------------------------
# CORREÇÕES EXATAS
# ------------------------------------------------------------

# className={` ... `}
lines[626] = lines[626].replace('"', "`}", 1)

# className=" ... "
lines[635] = lines[635].replace("`}", '"', 1)

# ------------------------------------------------------------
# VALIDAÇÃO
# ------------------------------------------------------------

if lines[626].strip() != "`}":
    print("ERRO: linha 627 não ficou com `}.")
    shutil.copy2(backup, path)
    raise SystemExit(1)

if lines[635].strip() != '"':
    print('ERRO: linha 636 não ficou com ".')
    shutil.copy2(backup, path)
    raise SystemExit(1)

new_text = "".join(lines)

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
print("✓ ClassName do balão corrigido")
print("✓ bubbleClass preservado")
print("✓ bubbleShadow preservado")
print("✓ companionMessage preservado")
print("✓ Fecho `}` aplicado ao className dinâmico")
print('✓ Fecho " aplicado ao className normal')
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
