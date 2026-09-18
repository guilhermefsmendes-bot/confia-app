from pathlib import Path
import re

# ============================================================
# CONFIA — AUDITORIA DE IDIOMA
#
# APENAS LEITURA
#
# Objetivo:
# descobrir exatamente:
#
# - onde o i18next é inicializado
# - qual é o idioma default
# - se existe deteção automática
# - se existe idioma guardado
# - onde Definições muda o idioma
# - se Capacitor fornece idioma/dispositivo
# - se navigator.language já é utilizado
#
# NÃO ALTERA FICHEIROS.
# ============================================================

ROOT = Path.cwd()

print("=" * 78)
print("CONFIA — AUDITORIA DE IDIOMA")
print("=" * 78)

# ------------------------------------------------------------
# 1. LOCALIZAR FICHEIROS RELACIONADOS COM I18N
# ------------------------------------------------------------

print()
print("1. FICHEIROS RELACIONADOS COM IDIOMA / I18N")
print("-" * 78)

interesting_files = []

for path in ROOT.rglob("*"):

    if not path.is_file():
        continue

    if any(part in {
        "node_modules",
        "dist",
        ".git",
        "android",
        "ios",
    } for part in path.parts):
        continue

    name = path.name.lower()

    if (
        "i18n" in name
        or "locale" in name
        or "language" in name
        or "setting" in name
    ):
        interesting_files.append(path)

for path in sorted(interesting_files):
    print(path.relative_to(ROOT))


# ------------------------------------------------------------
# 2. PESQUISAR PADRÕES IMPORTANTES NO SRC
# ------------------------------------------------------------

print()
print("=" * 78)
print("2. OCORRÊNCIAS IMPORTANTES EM src/")
print("=" * 78)

patterns = [
    r"i18next",
    r"i18n",
    r"changeLanguage",
    r"language",
    r"lng\s*:",
    r"fallbackLng",
    r"navigator\.language",
    r"navigator\.languages",
    r"localStorage.*language",
    r"localStorage.*lang",
    r"getLanguageCode",
    r"Device",
]

source_extensions = {
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
}

src = ROOT / "src"

for path in sorted(src.rglob("*")):

    if (
        not path.is_file()
        or path.suffix not in source_extensions
    ):
        continue

    try:
        text = path.read_text(
            encoding="utf-8"
        )
    except Exception:
        continue

    matches = []

    for line_no, line in enumerate(
        text.splitlines(),
        start=1
    ):
        if any(
            re.search(
                pattern,
                line,
                re.IGNORECASE
            )
            for pattern in patterns
        ):
            matches.append(
                (line_no, line.rstrip())
            )

    if matches:

        print()
        print(
            f"[{path.relative_to(ROOT)}]"
        )

        for line_no, line in matches[:100]:
            print(
                f"{line_no}: {line}"
            )

        if len(matches) > 100:
            print(
                f"... +{len(matches) - 100} ocorrências"
            )


# ------------------------------------------------------------
# 3. PROCURAR FICHEIROS DE INICIALIZAÇÃO PROVÁVEIS
# ------------------------------------------------------------

print()
print("=" * 78)
print("3. CONTEÚDO DOS FICHEIROS DE I18N PROVÁVEIS")
print("=" * 78)

candidates = [
    ROOT / "src/i18n.ts",
    ROOT / "src/i18n.tsx",
    ROOT / "src/i18n.js",
    ROOT / "src/i18n/index.ts",
    ROOT / "src/i18n/index.tsx",
]

found_i18n = False

for path in candidates:

    if not path.exists():
        continue

    found_i18n = True

    print()
    print("-" * 78)
    print(path.relative_to(ROOT))
    print("-" * 78)

    text = path.read_text(
        encoding="utf-8"
    )

    for line_no, line in enumerate(
        text.splitlines(),
        start=1
    ):
        print(
            f"{line_no}: {line}"
        )

if not found_i18n:
    print()
    print(
        "Nenhum dos caminhos padrão de i18n foi encontrado."
    )
    print(
        "As ocorrências da secção 2 indicarão onde está a configuração."
    )


# ------------------------------------------------------------
# 4. LOCALIZAR changeLanguage E MOSTRAR CONTEXTO
# ------------------------------------------------------------

print()
print("=" * 78)
print("4. MUDANÇA MANUAL DE IDIOMA")
print("=" * 78)

for path in sorted(src.rglob("*")):

    if (
        not path.is_file()
        or path.suffix not in source_extensions
    ):
        continue

    try:
        text = path.read_text(
            encoding="utf-8"
        )
    except Exception:
        continue

    lines = text.splitlines()

    indexes = [
        i
        for i, line in enumerate(lines)
        if "changeLanguage" in line
    ]

    for index in indexes:

        print()
        print("-" * 78)
        print(
            f"{path.relative_to(ROOT)} "
            f"— perto da linha {index + 1}"
        )
        print("-" * 78)

        start = max(
            0,
            index - 25
        )

        end = min(
            len(lines),
            index + 40
        )

        for i in range(start, end):
            print(
                f"{i + 1}: {lines[i]}"
            )


# ------------------------------------------------------------
# 5. LOCALSTORAGE RELACIONADO COM IDIOMA
# ------------------------------------------------------------

print()
print("=" * 78)
print("5. STORAGE RELACIONADO COM IDIOMA")
print("=" * 78)

storage_found = False

for path in sorted(src.rglob("*")):

    if (
        not path.is_file()
        or path.suffix not in source_extensions
    ):
        continue

    try:
        text = path.read_text(
            encoding="utf-8"
        )
    except Exception:
        continue

    lines = text.splitlines()

    for line_no, line in enumerate(
        lines,
        start=1
    ):

        lower = line.lower()

        if (
            "localstorage" in lower
            and (
                "lang" in lower
                or "locale" in lower
            )
        ):
            storage_found = True

            print(
                f"{path.relative_to(ROOT)}:"
                f"{line_no}: {line.strip()}"
            )

if not storage_found:
    print(
        "— Nenhum storage de idioma óbvio encontrado."
    )


# ------------------------------------------------------------
# 6. DETEÇÃO AUTOMÁTICA EXISTENTE
# ------------------------------------------------------------

print()
print("=" * 78)
print("6. DETEÇÃO AUTOMÁTICA EXISTENTE")
print("=" * 78)

auto_patterns = [
    "navigator.language",
    "navigator.languages",
    "getLanguageCode",
    "device.getlanguage",
    "getlanguagecode",
]

auto_found = False

for path in sorted(src.rglob("*")):

    if (
        not path.is_file()
        or path.suffix not in source_extensions
    ):
        continue

    try:
        text = path.read_text(
            encoding="utf-8"
        )
    except Exception:
        continue

    lines = text.splitlines()

    for line_no, line in enumerate(
        lines,
        start=1
    ):

        lower = line.lower()

        if any(
            pattern in lower
            for pattern in auto_patterns
        ):
            auto_found = True

            print(
                f"{path.relative_to(ROOT)}:"
                f"{line_no}: {line.strip()}"
            )

if not auto_found:
    print(
        "— Nenhuma deteção automática óbvia encontrada."
    )


# ------------------------------------------------------------
# 7. PACKAGE.JSON
# ------------------------------------------------------------

print()
print("=" * 78)
print("7. DEPENDÊNCIAS RELACIONADAS")
print("=" * 78)

package = ROOT / "package.json"

if package.exists():

    text = package.read_text(
        encoding="utf-8"
    )

    for line_no, line in enumerate(
        text.splitlines(),
        start=1
    ):

        lower = line.lower()

        if (
            "i18" in lower
            or "capacitor" in lower
            or "device" in lower
        ):
            print(
                f"{line_no}: {line}"
            )


# ------------------------------------------------------------
# 8. LOCALES
# ------------------------------------------------------------

print()
print("=" * 78)
print("8. LOCALES DISPONÍVEIS")
print("=" * 78)

locales_dir = ROOT / "src/locales"

if locales_dir.exists():

    for path in sorted(
        locales_dir.glob("*.json")
    ):
        print(
            f"✓ {path.name}"
        )

else:
    print(
        "✗ src/locales não encontrado"
    )


# ------------------------------------------------------------
# 9. RESUMO
# ------------------------------------------------------------

print()
print("=" * 78)
print("FIM DA AUDITORIA")
print("=" * 78)

print("""
Esta auditoria NÃO alterou qualquer ficheiro.

Com este resultado vamos decidir a implementação mais segura:

PRIMEIRA ABERTURA
        ↓
idioma do dispositivo
        ↓
PT / EN / ES / FR ?
        ↓
SIM → usar esse idioma
NÃO → EN
        ↓
utilizador pode mudar manualmente em Definições
        ↓
a escolha manual passa a ter prioridade nas próximas aberturas

Objetivo:
nenhum utilizador estrangeiro ter de descobrir as Definições
para conseguir compreender a CONFIA.
""")

print("=" * 78)
