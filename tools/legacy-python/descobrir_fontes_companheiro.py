import os
import re

ROOT = "src"

print("=" * 75)
print("CONFIA — DESCOBRIR FONTES REAIS DE HUMOR, OBJETIVOS E XP")
print("=" * 75)

patterns = {
    "DAILY RATINGS": [
        r"DailyRating",
        r"dailyRatings",
        r"morning",
        r"afternoon",
        r"rating",
        r"ratings",
    ],

    "OBJECTIVOS": [
        r"Objective",
        r"objectives",
        r"completedObjectives",
        r"completed",
        r"xpReward",
    ],

    "XP": [
        r"\bXP\b",
        r"\bxp\b",
        r"avatarXp",
        r"setAvatar",
        r"setXp",
        r"addXp",
    ],

    "HISTÓRICO": [
        r"history",
        r"History",
        r"daily",
        r"records",
        r"Record",
    ]
}


def procurar_categoria(nome, termos):

    print("\n" + "=" * 75)
    print(nome)
    print("=" * 75)

    encontrados = {}

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

            for numero, line in enumerate(lines, start=1):

                for termo in termos:

                    if re.search(termo, line):

                        key = (path, numero)

                        encontrados.setdefault(
                            key,
                            line.strip()
                        )

    # Mostrar apenas ocorrências relevantes
    for (path, numero), line in sorted(encontrados.items()):

        print(f"\n📁 {path}")
        print(f"   {numero}: {line}")

    print(
        f"\nTotal de linhas encontradas: {len(encontrados)}"
    )


# ------------------------------------------------------------
# PESQUISAS
# ------------------------------------------------------------

for categoria, termos in patterns.items():
    procurar_categoria(categoria, termos)


# ------------------------------------------------------------
# LOCALSTORAGE ESPECÍFICO
# ------------------------------------------------------------

print("\n" + "=" * 75)
print("LOCALSTORAGE RELACIONADO COM HUMOR / OBJECTIVOS / XP")
print("=" * 75)

storage_regex = re.compile(
    r'localStorage\.(?:getItem|setItem|removeItem)\(\s*["\']([^"\']+)["\']'
)

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

        keys = storage_regex.findall(content)

        for key in sorted(set(keys)):

            lower = key.lower()

            if any(
                word in lower
                for word in [
                    "mood",
                    "rating",
                    "morning",
                    "afternoon",
                    "objective",
                    "goal",
                    "xp",
                    "progress",
                    "history",
                    "daily"
                ]
            ):

                print(f"\n🔑 {key}")
                print(f"   └─ {path}")


print("\n" + "=" * 75)
print("FIM DA DESCOBERTA")
print("=" * 75)

print("""
IMPORTANTE:

Não alterar nenhum ficheiro nesta fase.

Precisamos primeiro de descobrir:

1. Onde estão os registos de Manhã/Tarde
2. Onde estão os Objetivos
3. Onde está o XP
4. Onde está o histórico completo

Depois disso construiremos o Companheiro sobre os dados existentes.
""")
