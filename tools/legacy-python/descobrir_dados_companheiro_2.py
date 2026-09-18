from pathlib import Path
import re

APP = Path("src/App.tsx")

print("=" * 75)
print("CONFIA — DESCOBERTA FINAL DOS DADOS DO COMPANHEIRO")
print("=" * 75)

if not APP.exists():
    print("ERRO: src/App.tsx não encontrado.")
    raise SystemExit

text = APP.read_text(encoding="utf-8")
lines = text.splitlines()

# ---------------------------------------------------------
# 1. STORAGE_KEYS
# ---------------------------------------------------------

print("\n" + "=" * 75)
print("1. STORAGE_KEYS")
print("=" * 75)

found_storage = False

for i, line in enumerate(lines):
    if "STORAGE_KEYS" in line:
        start = max(0, i - 3)
        end = min(len(lines), i + 35)

        print(f"\n--- linhas {start + 1} a {end} ---")

        for n in range(start, end):
            print(f"{n + 1:4}: {lines[n]}")

        found_storage = True

        # Só precisamos normalmente da primeira ocorrência
        if "const STORAGE_KEYS" in line or "STORAGE_KEYS =" in line:
            break

if not found_storage:
    print("⚠ Não foi encontrada referência a STORAGE_KEYS.")

# ---------------------------------------------------------
# 2. OBJETIVES HISTORY
# ---------------------------------------------------------

print("\n" + "=" * 75)
print("2. OBJECTIVES HISTORY")
print("=" * 75)

patterns = [
    "objectivesHistory",
    "setObjectivesHistory",
    "OBJECTIVES_HISTORY",
    "objectives_history",
]

for pattern in patterns:
    print(f"\n--- Procurando: {pattern} ---")

    count = 0

    for i, line in enumerate(lines):
        if pattern.lower() in line.lower():
            start = max(0, i - 4)
            end = min(len(lines), i + 8)

            for n in range(start, end):
                print(f"{n + 1:4}: {lines[n]}")

            print()
            count += 1

            if count >= 5:
                print("... limite de 5 ocorrências atingido")
                break

    if count == 0:
        print("Nenhuma ocorrência.")

# ---------------------------------------------------------
# 3. XP / AVATAR
# ---------------------------------------------------------

print("\n" + "=" * 75)
print("3. XP / AVATAR")
print("=" * 75)

xp_patterns = [
    "STORAGE_KEYS.AVATAR",
    "avatar.xp",
    "prev.xp",
    "setAvatar",
    "AVATAR",
]

for pattern in xp_patterns:
    print(f"\n--- Procurando: {pattern} ---")

    count = 0

    for i, line in enumerate(lines):
        if pattern.lower() in line.lower():
            start = max(0, i - 3)
            end = min(len(lines), i + 6)

            for n in range(start, end):
                print(f"{n + 1:4}: {lines[n]}")

            print()
            count += 1

            if count >= 5:
                print("... limite de 5 ocorrências atingido")
                break

    if count == 0:
        print("Nenhuma ocorrência.")

# ---------------------------------------------------------
# 4. OBJECTIVES STATE
# ---------------------------------------------------------

print("\n" + "=" * 75)
print("4. ESTRUTURA DOS OBJECTIVOS")
print("=" * 75)

objective_patterns = [
    "useState<Objective",
    "useState<",
    "INITIAL_OBJECTIVES",
    "completedObjectivesCount",
    "completedCount",
]

for pattern in objective_patterns:
    print(f"\n--- Procurando: {pattern} ---")

    count = 0

    for i, line in enumerate(lines):
        if pattern.lower() in line.lower():
            start = max(0, i - 4)
            end = min(len(lines), i + 10)

            for n in range(start, end):
                print(f"{n + 1:4}: {lines[n]}")

            print()
            count += 1

            if count >= 4:
                print("... limite de 4 ocorrências atingido")
                break

# ---------------------------------------------------------
# 5. RATINGS
# ---------------------------------------------------------

print("\n" + "=" * 75)
print("5. RATINGS / HUMOR")
print("=" * 75)

rating_patterns = [
    "STORAGE_KEYS.RATINGS",
    "localStorage.getItem(STORAGE_KEYS.RATINGS)",
    "setRatings",
    "DailyRating",
]

for pattern in rating_patterns:
    print(f"\n--- Procurando: {pattern} ---")

    count = 0

    for i, line in enumerate(lines):
        if pattern.lower() in line.lower():
            start = max(0, i - 4)
            end = min(len(lines), i + 8)

            for n in range(start, end):
                print(f"{n + 1:4}: {lines[n]}")

            print()
            count += 1

            if count >= 4:
                print("... limite de 4 ocorrências atingido")
                break

# ---------------------------------------------------------
# 6. HABITS
# ---------------------------------------------------------

print("\n" + "=" * 75)
print("6. HABITOS")
print("=" * 75)

habit_patterns = [
    "confia_habits_daily",
    "localStorage.getItem",
    "habits",
    "HabitDailyCheck",
    "HabitAssessment",
]

for pattern in habit_patterns:
    print(f"\n--- Procurando: {pattern} ---")

    count = 0

    for i, line in enumerate(lines):
        if pattern.lower() in line.lower():
            start = max(0, i - 3)
            end = min(len(lines), i + 7)

            for n in range(start, end):
                print(f"{n + 1:4}: {lines[n]}")

            print()
            count += 1

            if count >= 5:
                print("... limite de 5 ocorrências atingido")
                break

# ---------------------------------------------------------
# 7. RESUMO
# ---------------------------------------------------------

print("\n" + "=" * 75)
print("FIM DA DESCOBERTA")
print("=" * 75)

print("""
IMPORTANTE:
Este script APENAS LEITURA.

Não altera:
- App.tsx
- localStorage
- componentes
- traduções
- motores existentes

Precisamos deste resultado para construir a ligação definitiva:

                REGISTOS REAIS
                     ↓
              COMPANHEIRO DATA
                     ↓
             COMPANION ENGINE
                     ↓
             ANÁLISE PERSONALIZADA
                     ↓
                COMPANHEIRO
""")
