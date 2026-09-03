import json

files = {
    "src/locales/en.json": {
        "guardianAchievements": "Guardian Achievements"
    },
    "src/locales/es.json": {
        "guardianAchievements": "Logros del Guardián"
    }
}

for file, updates in files.items():
    with open(file, "r", encoding="utf-8") as f:
        data = json.load(f)

    for key, value in updates.items():
        if key in data:
            data[key] = value
            print(f"{file}: {key} corrigido")
        else:
            print(f"{file}: {key} não encontrado")

    with open(file, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

print("Fim.")
