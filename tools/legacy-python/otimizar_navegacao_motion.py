from pathlib import Path
import shutil
import re

path = Path("src/App.tsx")

print("=" * 60)
print(" CONFIA — OTIMIZAÇÃO DA NAVEGAÇÃO / MOTION")
print("=" * 60)

if not path.exists():
    print("ERRO: src/App.tsx não encontrado.")
    raise SystemExit(1)

# ------------------------------------------------------------
# BACKUP
# ------------------------------------------------------------

backup = Path("src/App.tsx.motion-backup")

if not backup.exists():
    shutil.copy2(path, backup)
    print(f"✓ Backup criado: {backup}")

text = path.read_text(encoding="utf-8")

original = text

# ------------------------------------------------------------
# 1. Remover mode="wait"
# ------------------------------------------------------------

if '<AnimatePresence mode="wait">' in text:
    text = text.replace(
        '<AnimatePresence mode="wait">',
        '<AnimatePresence>'
    )
    print('✓ Removido AnimatePresence mode="wait"')
else:
    print('→ AnimatePresence mode="wait" não encontrado')

# ------------------------------------------------------------
# 2. Remover EXIT das páginas principais
#
# Não removemos exit de modais.
# Apenas os exit das motion.div identificadas pela estrutura
# dos separadores/ecrãs.
# ------------------------------------------------------------

keys = [
    "main-menu",
    "companion-screen",
    "settings-screen",
    "embrace-tab",
    "goals-tab",
    "impulso-tab",
    "progress-tab",
]

removed_exit = 0

for key in keys:

    pattern = (
        r'(<motion\.div\s+'
        r'key="' + re.escape(key) + r'"'
        r'[\s\S]*?'
        r'animate=\{\{ opacity: 1, y: 0 \}\}'
        r')\s*'
        r'exit=\{\{ opacity: 0, y: -10 \}\}'
    )

    new_text, count = re.subn(
        pattern,
        r'\1',
        text,
        count=1
    )

    if count:
        text = new_text
        removed_exit += count
        print(f"✓ exit removido: {key}")

print(f"\n✓ Total de exit removidos: {removed_exit}")

# ------------------------------------------------------------
# 3. Verificação básica
# ------------------------------------------------------------

if text == original:
    print("\n⚠ Nenhuma alteração foi feita.")
    raise SystemExit(0)

path.write_text(text, encoding="utf-8")

print()
print("=" * 60)
print(" RESULTADO")
print("=" * 60)

print("✓ AnimatePresence deixa de esperar a saída anterior")
print("✓ Transições de entrada mantidas")
print("✓ exit removido apenas dos ecrãs principais")
print("✓ Modais não foram alterados")
print("✓ HomeWorld não foi alterado")
print("✓ Navegação não foi alterada")
print("✓ Estado/localStorage não foi alterado")
print("✓ Backup disponível")
print()
print("=" * 60)
