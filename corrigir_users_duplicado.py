from pathlib import Path
import re
import shutil
import sys

path = Path("src/App.tsx")

if not path.exists():
    print("ERRO: src/App.tsx não encontrado.")
    sys.exit(1)

text = path.read_text(encoding="utf-8")
original = text

# Backup fora do projeto
shutil.copy2(
    path,
    "/tmp/App.tsx.before_fix_duplicate_users"
)

# Encontrar o import vindo de lucide-react.
pattern = re.compile(
    r'import\s*\{(?P<body>.*?)\}\s*from\s*[\'"]lucide-react[\'"];',
    re.DOTALL
)

match = pattern.search(text)

if not match:
    print("ERRO: import de lucide-react não encontrado.")
    sys.exit(1)

body = match.group("body")

# Separar os nomes importados.
items = [item.strip() for item in body.split(",") if item.strip()]

users_count = sum(1 for item in items if item == "Users")

print(f"Ocorrências de Users no import lucide-react: {users_count}")

if users_count < 2:
    print("ERRO: não existem dois imports Users para corrigir.")
    sys.exit(1)

# Remover apenas duplicados, preservando a primeira ocorrência.
seen = set()
clean_items = []

for item in items:
    if item in seen:
        if item == "Users":
            continue

        # Não alteramos silenciosamente outros duplicados.
        print(f"ERRO: foi encontrado outro import duplicado inesperado: {item}")
        sys.exit(1)

    seen.add(item)
    clean_items.append(item)

new_import = "import {\n  " + ",\n  ".join(clean_items) + "\n} from 'lucide-react';"

text = text[:match.start()] + new_import + text[match.end():]

# Verificações
new_match = pattern.search(text)

if not new_match:
    print("ERRO: import lucide-react ficou inválido.")
    sys.exit(1)

new_body = new_match.group("body")
new_items = [item.strip() for item in new_body.split(",") if item.strip()]

if new_items.count("Users") != 1:
    print("ERRO: Users não ficou importado exatamente uma vez.")
    sys.exit(1)

# Garantir que o novo tab continua intacto.
required = [
    'label: t("community"), icon: Users, index: 4',
    "TAB 5: COMUNIDADE",
    "<PartilhaFeed",
    "TAB 4: IMPULSO — intervenção imediata / SOS",
    "setCurrentTab(3);",
]

for fragment in required:
    if fragment not in text:
        print(f"ERRO: estrutura da nova navegação não encontrada: {fragment}")
        sys.exit(1)

if text == original:
    print("ERRO: nenhuma alteração efetuada.")
    sys.exit(1)

path.write_text(text, encoding="utf-8")

print("=" * 72)
print("CONFIA — CORREÇÃO IMPORT USERS")
print("=" * 72)
print("✓ Import duplicado de Users removido")
print("✓ Users continua disponível para Comunidade")
print("✓ TAB 4 Impulso preservado")
print("✓ TAB 5 Comunidade preservado")
print("✓ StopMode → Impulso preservado")
print("✓ Nenhuma outra lógica alterada")
print()
print("OK — conflito de import corrigido.")
