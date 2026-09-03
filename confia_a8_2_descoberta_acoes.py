from pathlib import Path

print("=" * 76)
print("CONFIA — A8.2 — DESCOBERTA DAS AÇÕES EXISTENTES")
print("=" * 76)

ROOT = Path("src")

files = [
    ROOT / "App.tsx",
    ROOT / "components/Companheiro/ConfiaCompanionHome.tsx",
]

patterns = [
    "setHomeScreen",
    'setCurrentTab',
    '"impulse"',
    '"patterns"',
    '"objectives"',
    '"progress"',
    '"checkIn"',
    "homeScreen",
    "currentTab",
    "handle",
    "onClick",
    "action",
    "open",
    "dailyCheckIn",
]

for path in files:
    print()
    print("=" * 76)
    print(f"FICHEIRO: {path}")
    print("=" * 76)

    if not path.exists():
        print("ERRO: ficheiro não encontrado")
        continue

    lines = path.read_text(encoding="utf-8").splitlines()

    for i, line in enumerate(lines, 1):
        if any(pattern in line for pattern in patterns):
            start = max(1, i - 4)
            end = min(len(lines), i + 8)

            print()
            print(f"--- linhas {start}-{end} ---")

            for n in range(start, end + 1):
                print(f"{n:5}: {lines[n-1]}")

print()
print("=" * 76)
print("DESCOBERTA ESPECÍFICA DE NAVEGAÇÃO")
print("=" * 76)

app = ROOT / "App.tsx"

if app.exists():
    lines = app.read_text(encoding="utf-8").splitlines()

    for i, line in enumerate(lines, 1):
        if "setHomeScreen(" in line or "setCurrentTab(" in line:
            start = max(1, i - 6)
            end = min(len(lines), i + 10)

            print()
            print(f"--- navegação linhas {start}-{end} ---")

            for n in range(start, end + 1):
                print(f"{n:5}: {lines[n-1]}")

print()
print("=" * 76)
print("A8.2 — DESCOBERTA CONCLUÍDA")
print("=" * 76)
print()
print("ESTE SCRIPT FOI APENAS DE LEITURA.")
print()
print("Não alterou:")
print("- App.tsx")
print("- ConfiaCompanionHome.tsx")
print("- traduções")
print("- storage")
print("- navegação")
print()
print("Objetivo:")
print("descobrir exatamente como o A8 poderá apresentar")
print("uma ação contextual usando a navegação já existente.")
print("=" * 76)
