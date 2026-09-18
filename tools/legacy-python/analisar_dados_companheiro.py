import os
import re

print("=" * 70)
print("CONFIA — ESTRUTURA DOS DADOS PARA O COMPANHEIRO")
print("=" * 70)

ficheiros = [
    "src/components/PatternsNew/HabitEvolution.tsx",
    "src/components/PatternsNew/HabitDailyCheck.tsx",
    "src/components/Patterns/PatternsDashboard.tsx",
    "src/components/Patterns/PatternEvolution.tsx",
    "src/components/Patterns/PatternWellbeingComparison.tsx",
    "src/components/WeeklyGoalSection.tsx",
    "src/App.tsx",
    "src/components/Impulso/types.ts",
    "src/components/Impulso/storage.ts",
    "src/components/Companheiro/companionAnalysis.ts",
    "src/data/companionEngine.ts",
]

padroes = [
    r'localStorage\.(?:getItem|setItem)\(["\']([^"\']+)',
    r'const\s+([A-Z0-9_]+)\s*=\s*["\'](confia_[^"\']+)',
    r'interface\s+(\w+)\s*\{',
    r'type\s+(\w+)\s*=',
    r'export\s+interface\s+(\w+)\s*\{',
    r'export\s+type\s+(\w+)\s*=',
]

for ficheiro in ficheiros:

    if not os.path.exists(ficheiro):
        continue

    print("\n" + "=" * 70)
    print("📁 " + ficheiro)
    print("=" * 70)

    with open(ficheiro, "r", encoding="utf-8") as f:
        linhas = f.readlines()

    encontrados = set()

    for i, linha in enumerate(linhas, 1):

        if (
            "localStorage" in linha
            or "interface " in linha
            or "type " in linha
            or "getItem" in linha
            or "setItem" in linha
            or "JSON.parse" in linha
            or "JSON.stringify" in linha
            or "Record<" in linha
            or "history" in linha.lower()
            or "rating" in linha.lower()
            or "mood" in linha.lower()
            or "habit" in linha.lower()
            or "objective" in linha.lower()
            or "xp" in linha.lower()
        ):
            print(f"{i:4}: {linha.rstrip()}")

print("\n")
print("=" * 70)
print("FIM DA ANÁLISE")
print("=" * 70)
print()
print("IMPORTANTE:")
print("Este script APENAS lê os ficheiros.")
print("Nenhum ficheiro da aplicação foi alterado.")
print()
print("Envia-me TODO o resultado deste comando.")
print("=" * 70)
