from pathlib import Path

path = Path("src/data/companionData.ts")

if not path.exists():
    print("❌ companionData.ts não existe")
    exit(1)

content = path.read_text(encoding="utf-8")

print()
print("=" * 70)
print("CONFIA — VERIFICAÇÃO DA CAMADA COMPANHEIRO DATA")
print("=" * 70)
print()

checks = {
    "collectCompanionData": "collectCompanionData",
    "ratings": 'localStorage.getItem("confia_ratings_v2")',
    "objectives": 'localStorage.getItem("confia_objectives_history")',
    "habits": 'localStorage.getItem("confia_habits_daily")',
    "impulso": "loadEpisodes()",
    "dailyCheckIn": "getDailyCheckInHistory()",
    "patterns": "loadPatternProfile()",
    "xp": 'localStorage.getItem("confia_avatar")',
}

all_ok = True

for name, search in checks.items():
    if search in content:
        print(f"✓ {name}")
    else:
        print(f"❌ {name}")
        all_ok = False

print()

if all_ok:
    print("✓ TODAS AS LIGAÇÕES DA CAMADA DE DADOS ESTÃO PRESENTES")
else:
    print("⚠ EXISTEM LIGAÇÕES EM FALTA")

print()
print("=" * 70)
print("NOTA")
print("=" * 70)
print()
print("Este teste apenas verifica o código criado.")
print("Não executa a aplicação.")
print("Não altera localStorage.")
print("Não altera nenhum ficheiro da aplicação.")
print()
