from pathlib import Path
import re

path = Path("src/App.tsx")

if not path.exists():
    print("ERRO: src/App.tsx não encontrado.")
    raise SystemExit(1)

text = path.read_text(encoding="utf-8")
lines = text.splitlines()

print("=" * 70)
print("CONFIA — DESCOBERTA DA LIGAÇÃO DO COMPANHEIRO AO APP")
print("=" * 70)

print("\n1. IMPORTS DOS COMPONENTES")
print("-" * 70)

for i, line in enumerate(lines, 1):
    if "import " in line and (
        "components/" in line
        or "Companheiro" in line
        or "Companion" in line
    ):
        print(f"{i}: {line}")

print("\n2. TABS / NAVEGAÇÃO")
print("-" * 70)

patterns = [
    "currentTab",
    "setCurrentTab",
    "tabs",
    "tab",
    "index:",
    "label:",
    "icon:",
    "homeScreen",
    "screen",
    "menu",
]

for i, line in enumerate(lines, 1):
    if any(p in line for p in patterns):
        print(f"{i}: {line}")

print("\n3. RENDERIZAÇÃO DOS ECRÃS")
print("-" * 70)

for i, line in enumerate(lines, 1):
    stripped = line.strip()

    if (
        "currentTab ===" in line
        or "currentTab ==" in line
        or "activeTab" in line
        or "homeScreen ===" in line
        or "homeScreen ==" in line
        or "screen ===" in line
        or "<ProgressoDashboard" in line
        or "<PatternsNew" in line
        or "<Impulso" in line
        or "<DailyCheckIn" in line
    ):
        print(f"{i}: {line}")

print("\n4. MENU PRINCIPAL / BOTÕES")
print("-" * 70)

for i, line in enumerate(lines, 1):
    if (
        "onClick" in line
        or "setCurrentTab" in line
        or "setHomeScreen" in line
        or "setScreen" in line
    ):
        print(f"{i}: {line}")

print("\n5. COMPONENTE COMPANION JÁ EXISTENTE?")
print("-" * 70)

companion_found = False

for i, line in enumerate(lines, 1):
    if re.search(r"Companion|Companheiro", line, re.IGNORECASE):
        companion_found = True
        print(f"{i}: {line}")

if not companion_found:
    print("✓ Nenhuma ligação ao Companheiro encontrada no App.tsx.")

print("\n" + "=" * 70)
print("FIM DA DESCOBERTA")
print("=" * 70)

print("""
IMPORTANTE:

Este script é APENAS LEITURA.

Não altera:
- App.tsx
- componentes
- localStorage
- navegação
- traduções

Objetivo:
descobrir exatamente onde devemos inserir o
COMPANHEIRO na navegação existente da Confia.
""")
