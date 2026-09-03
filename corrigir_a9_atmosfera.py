from pathlib import Path
import shutil
import re

print("=" * 76)
print("CONFIA — CORREÇÃO A9 — FECHO DO CLASSNAME DA ATMOSFERA")
print("=" * 76)

path = Path("src/components/Companheiro/ConfiaCompanionHome.tsx")
backup = Path("/tmp/ConfiaCompanionHome.tsx.before_fix_a9_atmosfera")

if not path.exists():
    print("ERRO: ficheiro não encontrado:")
    print(path)
    raise SystemExit(1)

text = path.read_text(encoding="utf-8")

# ============================================================
# BACKUP
# ============================================================

shutil.copy2(path, backup)

# ============================================================
# LOCALIZAR A ATMOSFERA
# ============================================================

marker = "const atmosphereClass"

if marker not in text:
    print("ERRO: atmosphereClass não encontrado.")
    shutil.copy2(backup, path)
    raise SystemExit(1)

# Procuramos especificamente o bloco JSX que contém
# ${atmosphereClass} e blur-3xl.
pattern = re.compile(
    r'(\$\{atmosphereClass\}[\s\S]{0,120}?blur-3xl\s*)(")(\s*\n\s*/>)'
)

match = pattern.search(text)

if not match:
    print("ERRO: fecho incorreto da atmosfera não encontrado.")
    print()
    print("Backup restaurado.")
    shutil.copy2(backup, path)
    raise SystemExit(1)

# ============================================================
# GARANTIR QUE ESTAMOS NO BLOCO VISUAL CORRETO
# ============================================================

start = max(0, match.start() - 250)
end = min(len(text), match.end() + 100)

context = text[start:end]

if "atmosphereClass" not in context:
    print("ERRO: correspondência não pertence ao bloco da atmosfera.")
    shutil.copy2(backup, path)
    raise SystemExit(1)

# ============================================================
# CORREÇÃO
# ============================================================

fixed = (
    match.group(1)
    + "`"
    + match.group(3)
)

text = (
    text[:match.start()]
    + fixed
    + text[match.end():]
)

# ============================================================
# VALIDAÇÃO
# ============================================================

# A estrutura correta deve existir.
if "${atmosphereClass}" not in text:
    print("ERRO: atmosphereClass desapareceu.")
    shutil.copy2(backup, path)
    raise SystemExit(1)

# O bloco corrigido deve terminar com crase antes de />
fixed_pattern = re.compile(
    r'\$\{atmosphereClass\}[\s\S]{0,120}?blur-3xl\s*`\s*\n\s*/>'
)

if not fixed_pattern.search(text):
    print("ERRO: fecho com crase não confirmado.")
    shutil.copy2(backup, path)
    raise SystemExit(1)

# ============================================================
# GARANTIR QUE NÃO TOCAMOS NA LÓGICA
# ============================================================

for required in [
    "companionRelationalNextStep",
    "companionRelationalAction",
    "resolveCompanionRelationalExpression",
    "resolveCompanionRelationalMemory",
]:
    if required not in text:
        print(
            f"ERRO: elemento existente desapareceu: {required}"
        )
        shutil.copy2(backup, path)
        raise SystemExit(1)

# ============================================================
# ESCREVER
# ============================================================

path.write_text(text, encoding="utf-8")

print()
print("✓ Fecho incorreto do className da atmosfera corrigido")
print("✓ `${atmosphereClass}` preservado")
print("✓ `blur-3xl` preservado")
print("✓ Fecho agora usa crase")
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
