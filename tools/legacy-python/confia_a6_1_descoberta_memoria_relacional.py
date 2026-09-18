from pathlib import Path
import re

FILES = [
    Path("src/App.tsx"),
    Path("src/data/reactive/reactiveEngine.ts"),
    Path("src/data/reactive/reactiveHistoryStorage.ts"),
]

OPTIONAL_PATTERNS = [
    "pattern",
    "patterns",
    "memory",
    "Memory",
    "history",
    "History",
    "daily",
    "Daily",
    "rating",
    "Rating",
    "mood",
    "Mood",
    "checkin",
    "checkIn",
    "reactive",
    "Reactive",
]

print("=" * 78)
print("CONFIA — A6.1 — DESCOBERTA DA MEMÓRIA RELACIONAL")
print("=" * 78)

print()
print("1. FICHEIROS REATIVOS EXISTENTES")
print("-" * 78)

reactive_dir = Path("src/data/reactive")

if reactive_dir.exists():
    for path in sorted(reactive_dir.rglob("*")):
        if path.is_file():
            print(path)
else:
    print("AVISO: src/data/reactive não encontrado.")


print()
print("2. REACTIVE ENGINE COMPLETO")
print("-" * 78)

engine = Path("src/data/reactive/reactiveEngine.ts")

if engine.exists():
    for number, line in enumerate(
        engine.read_text(encoding="utf-8").splitlines(),
        1
    ):
        print(f"{number:4}: {line}")
else:
    print("NÃO ENCONTRADO")


print()
print("3. REACTIVE HISTORY STORAGE COMPLETO")
print("-" * 78)

history = Path(
    "src/data/reactive/reactiveHistoryStorage.ts"
)

if history.exists():
    for number, line in enumerate(
        history.read_text(encoding="utf-8").splitlines(),
        1
    ):
        print(f"{number:4}: {line}")
else:
    print("NÃO ENCONTRADO")


print()
print("4. OUTROS FICHEIROS QUE PODEM CONTER MEMÓRIA/PADRÕES")
print("-" * 78)

src_root = Path("src")

interesting_files = []

if src_root.exists():

    for path in src_root.rglob("*"):

        if not path.is_file():
            continue

        if path.suffix not in {
            ".ts",
            ".tsx",
            ".js",
            ".jsx",
        }:
            continue

        try:
            text = path.read_text(
                encoding="utf-8"
            )
        except Exception:
            continue

        score = sum(
            1
            for pattern in OPTIONAL_PATTERNS
            if pattern in text
        )

        if score >= 4:
            interesting_files.append(
                (score, path)
            )

for score, path in sorted(
    interesting_files,
    key=lambda item: (-item[0], str(item[1]))
)[:40]:
    print(f"[{score:02}] {path}")


print()
print("5. APP.TSX — ESTADOS E CÁLCULOS RELACIONADOS")
print("-" * 78)

app = Path("src/App.tsx")

if app.exists():

    lines = app.read_text(
        encoding="utf-8"
    ).splitlines()

    regex = re.compile(
        r"(reactive|memory|pattern|history|mood|rating|daily|check.?in)",
        re.IGNORECASE
    )

    matches = []

    for i, line in enumerate(lines):

        if regex.search(line):
            matches.append(i)

    # Juntar intervalos próximos para não imprimir
    # centenas de blocos repetidos.
    ranges = []

    for i in matches:

        start = max(0, i - 4)
        end = min(len(lines), i + 7)

        if (
            ranges
            and start <= ranges[-1][1] + 2
        ):
            ranges[-1] = (
                ranges[-1][0],
                max(ranges[-1][1], end)
            )
        else:
            ranges.append(
                (start, end)
            )

    for start, end in ranges:

        print()
        print(
            f"--- App.tsx linhas "
            f"{start + 1}-{end} ---"
        )

        for i in range(start, end):
            print(
                f"{i + 1:4}: {lines[i]}"
            )


print()
print("6. LOCALSTORAGE / STORAGE KEYS RELACIONADAS")
print("-" * 78)

storage_regex = re.compile(
    r"(localStorage|STORAGE_KEY|storageKey|history|memory|pattern)",
    re.IGNORECASE
)

for path in src_root.rglob("*"):

    if (
        not path.is_file()
        or path.suffix not in {
            ".ts",
            ".tsx",
            ".js",
            ".jsx",
        }
    ):
        continue

    try:
        lines = path.read_text(
            encoding="utf-8"
        ).splitlines()
    except Exception:
        continue

    matches = [
        (i + 1, line)
        for i, line in enumerate(lines)
        if storage_regex.search(line)
    ]

    if not matches:
        continue

    # Só ficheiros potencialmente relevantes para
    # memória emocional/reativa.
    path_lower = str(path).lower()

    relevant = (
        "reactive" in path_lower
        or "memory" in path_lower
        or "pattern" in path_lower
        or "app.tsx" in path_lower
        or "rating" in path_lower
        or "daily" in path_lower
    )

    if not relevant:
        continue

    print()
    print(f"--- {path} ---")

    for number, line in matches[:80]:
        print(
            f"{number:4}: {line}"
        )


print()
print("7. TRADUÇÕES REATIVAS / MEMÓRIA / PADRÕES")
print("-" * 78)

for locale in ["pt", "en", "es", "fr"]:

    path = Path(
        f"src/locales/{locale}.json"
    )

    print()
    print(f"----- {path} -----")

    if not path.exists():
        print("NÃO ENCONTRADO")
        continue

    lines = path.read_text(
        encoding="utf-8"
    ).splitlines()

    regex = re.compile(
        r"(reactive|memory|memória|mémoire|memoria|pattern|padr|patr|mood|week|semana|semaine)",
        re.IGNORECASE
    )

    for number, line in enumerate(
        lines,
        1
    ):
        if regex.search(line):
            print(
                f"{number:4}: {line}"
            )


print()
print("=" * 78)
print("FIM DA DESCOBERTA A6.1")
print("=" * 78)
print()
print("IMPORTANTE:")
print()
print("Este script é APENAS LEITURA.")
print()
print("Não altera:")
print("- App.tsx")
print("- reactiveEngine")
print("- histórico")
print("- padrões")
print("- localStorage")
print("- traduções")
print("- XP")
print("- companheiro")
print()
print("Objetivo:")
print("descobrir qual memória existente pode tornar")
print("a CONFIA relacional sem criar um segundo cérebro.")
