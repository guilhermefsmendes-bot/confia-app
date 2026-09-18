import os
import re

ROOT = "src"

print("=" * 70)
print("CONFIA — MAPA COMPLETO DOS DADOS DO COMPANHEIRO")
print("=" * 70)

# ------------------------------------------------------------
# 1. LOCALSTORAGE
# ------------------------------------------------------------

print("\n" + "=" * 70)
print("1. CHAVES DE LOCALSTORAGE ENCONTRADAS")
print("=" * 70)

storage_keys = {}

for root, dirs, files in os.walk(ROOT):
    dirs[:] = [
        d for d in dirs
        if d not in [
            "node_modules",
            "dist",
            ".git"
        ]
    ]

    for file in files:
        if not file.endswith((".ts", ".tsx")):
            continue

        path = os.path.join(root, file)

        try:
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
        except:
            continue

        matches = re.findall(
            r'localStorage\.(?:getItem|setItem|removeItem)\(\s*["\']([^"\']+)["\']',
            content
        )

        for key in matches:
            storage_keys.setdefault(key, []).append(path)

for key in sorted(storage_keys):
    print(f"\n🔑 {key}")

    for path in sorted(set(storage_keys[key])):
        print(f"   └─ {path}")


# ------------------------------------------------------------
# 2. INTERFACES / TYPES RELACIONADOS COM DADOS DO UTILIZADOR
# ------------------------------------------------------------

print("\n" + "=" * 70)
print("2. INTERFACES E TYPES RELACIONADOS COM O UTILIZADOR")
print("=" * 70)

keywords = [
    "interface",
    "type",
    "Daily",
    "Rating",
    "Mood",
    "Habit",
    "Pattern",
    "Impulse",
    "Episode",
    "Objective",
    "Goal",
    "XP",
    "History",
    "Journal",
    "Progress"
]

for root, dirs, files in os.walk(ROOT):
    dirs[:] = [
        d for d in dirs
        if d not in ["node_modules", "dist", ".git"]
    ]

    for file in files:
        if not file.endswith((".ts", ".tsx")):
            continue

        path = os.path.join(root, file)

        try:
            with open(path, "r", encoding="utf-8") as f:
                lines = f.readlines()
        except:
            continue

        found = []

        for i, line in enumerate(lines, start=1):
            stripped = line.strip()

            if (
                stripped.startswith("export interface ")
                or stripped.startswith("interface ")
                or stripped.startswith("export type ")
                or stripped.startswith("type ")
            ):
                if any(k.lower() in stripped.lower() for k in keywords):
                    found.append((i, stripped))

        if found:
            print(f"\n📁 {path}")

            for line_number, text in found:
                print(f"   {line_number}: {text}")


# ------------------------------------------------------------
# 3. FUNÇÕES DE LEITURA DOS DADOS
# ------------------------------------------------------------

print("\n" + "=" * 70)
print("3. FUNÇÕES QUE LÊEM DADOS DO UTILIZADOR")
print("=" * 70)

function_patterns = [
    r'export function (get[A-Z][A-Za-z0-9_]*)',
    r'export function (load[A-Z][A-Za-z0-9_]*)',
    r'export const (get[A-Z][A-Za-z0-9_]*)',
    r'export const (load[A-Z][A-Za-z0-9_]*)'
]

functions = {}

for root, dirs, files in os.walk(ROOT):
    dirs[:] = [
        d for d in dirs
        if d not in ["node_modules", "dist", ".git"]
    ]

    for file in files:
        if not file.endswith((".ts", ".tsx")):
            continue

        path = os.path.join(root, file)

        try:
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
        except:
            continue

        for pattern in function_patterns:
            for match in re.findall(pattern, content):
                functions.setdefault(match, []).append(path)

for function in sorted(functions):
    print(f"\n🔹 {function}")

    for path in sorted(set(functions[function])):
        print(f"   └─ {path}")


# ------------------------------------------------------------
# 4. COMPONENTES QUE USAM DADOS
# ------------------------------------------------------------

print("\n" + "=" * 70)
print("4. COMPONENTES RELACIONADOS COM PROGRESSO / DADOS")
print("=" * 70)

component_keywords = [
    "Progress",
    "Pattern",
    "Habit",
    "Impulse",
    "Objective",
    "Goal",
    "Mood",
    "CheckIn",
    "Journal",
    "History",
    "XP",
    "Evolution"
]

for root, dirs, files in os.walk("src/components"):
    dirs[:] = [
        d for d in dirs
        if d not in ["node_modules", "dist", ".git"]
    ]

    for file in files:
        if not file.endswith(".tsx"):
            continue

        if any(k.lower() in file.lower() for k in component_keywords):
            print(f"✓ {os.path.join(root, file)}")


# ------------------------------------------------------------
# 5. RESUMO
# ------------------------------------------------------------

print("\n" + "=" * 70)
print("5. RESUMO")
print("=" * 70)

print(f"\n🔑 Total de chaves localStorage encontradas: {len(storage_keys)}")
print(f"🔹 Total de funções de leitura encontradas: {len(functions)}")

print("\nEste mapa será usado para construir o")
print("COMPANHEIRO DA CONFIA sem criar um sistema paralelo.")
print("\nObjetivo:")
print("   Humor + Hábitos + Impulso + Objetivos + XP + Histórico")
print("                 ↓")
print("          COMPANHEIRO CONFIA")
print("                 ↓")
print("      análise personalizada diária")
print("=" * 70)
