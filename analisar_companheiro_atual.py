import os

ficheiros = [
    "src/data/companionEngine.ts",
    "src/components/Companheiro/companionAnalysis.ts",
    "src/components/Companheiro/Companion.tsx",
    "src/components/Impulso/types.ts",
]

print("=" * 75)
print("CONFIA — ANÁLISE COMPLETA DO COMPANHEIRO EXISTENTE")
print("=" * 75)

for ficheiro in ficheiros:

    print("\n" + "=" * 75)
    print("📁 " + ficheiro)
    print("=" * 75)

    if not os.path.exists(ficheiro):
        print("⚠ Ficheiro não encontrado")
        continue

    with open(ficheiro, "r", encoding="utf-8") as f:
        linhas = f.readlines()

    print(f"Total de linhas: {len(linhas)}\n")

    for i, linha in enumerate(linhas, 1):
        print(f"{i:4}: {linha.rstrip()}")

print("\n")
print("=" * 75)
print("FIM DA ANÁLISE")
print("=" * 75)
print()
print("Este script APENAS lê os ficheiros.")
print("Nenhum ficheiro foi alterado.")
