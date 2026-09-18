from pathlib import Path
import shutil
import sys

APP = Path("src/App.tsx")
BACKUP = Path("/tmp/App.tsx.before_move_home_space")

if not APP.exists():
    print("ERRO: src/App.tsx não encontrado.")
    sys.exit(1)

text = APP.read_text(encoding="utf-8")

# ------------------------------------------------------------
# Localizar bloco "O teu espaço"
# ------------------------------------------------------------

space_start_marker = "/* O teu espaço — navegação secundária premium */"
space_end_marker = "/* Apoio — acesso SOS discreto e sempre disponível */"

space_start = text.find(space_start_marker)
if space_start == -1:
    print("ERRO: início de 'O teu espaço' não encontrado.")
    sys.exit(1)

space_start = text.rfind("\n", 0, space_start) + 1

space_end = text.find(space_end_marker, space_start)
if space_end == -1:
    print("ERRO: fim de 'O teu espaço' não encontrado.")
    sys.exit(1)

space_end = text.rfind("\n", 0, space_end) + 1

space_block = text[space_start:space_end]

# ------------------------------------------------------------
# Validar bloco antes de mexer
# ------------------------------------------------------------

required = [
    'aria-label={t("homeSpace.title")}',
    'setHomeScreen("companion")',
    'setHomeScreen("patterns")',
    'setHomeScreen("inventory")',
    'setHomeScreen("shop")',
    'setHomeScreen("settings")',
]

missing = [item for item in required if item not in space_block]

if missing:
    print("ERRO: bloco 'O teu espaço' não corresponde ao esperado.")
    for item in missing:
        print(" -", item)
    sys.exit(1)

# ------------------------------------------------------------
# Localizar HomeWorld
# ------------------------------------------------------------

homeworld_start = text.find("<HomeWorld")
if homeworld_start == -1:
    print("ERRO: <HomeWorld não encontrado.")
    sys.exit(1)

homeworld_end = text.find("/>", homeworld_start)
if homeworld_end == -1:
    print("ERRO: fecho de <HomeWorld /> não encontrado.")
    sys.exit(1)

homeworld_end += 2

# ------------------------------------------------------------
# Segurança contra execução dupla
# ------------------------------------------------------------

between = text[homeworld_end:space_start]

if "O teu espaço — navegação secundária premium" in between:
    print("ERRO: 'O teu espaço' parece já estar junto ao HomeWorld.")
    sys.exit(1)

# ------------------------------------------------------------
# Backup
# ------------------------------------------------------------

shutil.copy2(APP, BACKUP)

# ------------------------------------------------------------
# Primeiro remover bloco da posição antiga
# ------------------------------------------------------------

without_space = text[:space_start] + text[space_end:]

# Como removemos texto anterior ao HomeWorld? Não:
# neste ficheiro o HomeWorld está antes do bloco removido,
# portanto a posição continua válida.

homeworld_start_new = without_space.find("<HomeWorld")
homeworld_end_new = without_space.find("/>", homeworld_start_new) + 2

if homeworld_start_new == -1 or homeworld_end_new == 1:
    print("ERRO: não foi possível relocalizar HomeWorld.")
    sys.exit(1)

# ------------------------------------------------------------
# Inserir imediatamente depois de HomeWorld
# ------------------------------------------------------------

insert = "\n\n" + space_block.strip("\n") + "\n"

new_text = (
    without_space[:homeworld_end_new]
    + insert
    + without_space[homeworld_end_new:]
)

# ------------------------------------------------------------
# Verificações finais
# ------------------------------------------------------------

if new_text.count(space_start_marker) != 1:
    print(
        "ERRO: esperava exatamente 1 bloco 'O teu espaço', "
        f"mas encontrei {new_text.count(space_start_marker)}."
    )
    sys.exit(1)

home_pos = new_text.find("<HomeWorld")
space_pos = new_text.find(space_start_marker)
daily_pos = new_text.find("CONFIA 3C.1 — MOMENTO DE HOJE")

if not (home_pos < space_pos < daily_pos):
    print("ERRO: a nova ordem visual não ficou como esperado.")
    sys.exit(1)

APP.write_text(new_text, encoding="utf-8")

print("=" * 72)
print("CONFIA — O TEU ESPAÇO APROXIMADO DO COMPANHEIRO")
print("=" * 72)
print()
print("✓ HomeWorld preservado")
print("✓ 'O teu espaço' movido para imediatamente depois do HomeWorld")
print("✓ Momento de Hoje permanece depois")
print("✓ Companheiro preservado")
print("✓ Padrões preservados")
print("✓ Inventário preservado")
print("✓ Loja preservada")
print("✓ Definições preservadas")
print("✓ SOS preservado")
print("✓ Navegação não alterada")
print("✓ Traduções não alteradas")
print()
print("Nova ordem:")
print()
print("  HomeWorld / futuro Companheiro CONFIA")
print("             ↓")
print("       O teu espaço")
print("             ↓")
print("       Momento de Hoje")
print("             ↓")
print("       restante Principal")
print()
print("Backup:")
print(f"  {BACKUP}")
print()
print("=" * 72)
