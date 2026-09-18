from pathlib import Path
import re

print("=" * 76)
print("CONFIA — A8.1B — DESCOBERTA REAL DAS AÇÕES")
print("=" * 76)

APP = Path("src/App.tsx")
COMPANION = Path("src/components/Companheiro/ConfiaCompanionHome.tsx")

if not APP.exists():
    print("ERRO: src/App.tsx não encontrado.")
    raise SystemExit(1)

if not COMPANION.exists():
    print("ERRO: ConfiaCompanionHome.tsx não encontrado.")
    raise SystemExit(1)

app = APP.read_text(encoding="utf-8")
companion = COMPANION.read_text(encoding="utf-8")


# ==============================================================
# 1. HOME SCREENS REAIS
# ==============================================================

print()
print("=" * 76)
print("1. HOME SCREENS REAIS DO APP")
print("=" * 76)

match = re.search(
    r'const\s+\[homeScreen,\s*setHomeScreen\]\s*=\s*useState<([\s\S]*?)>\(',
    app
)

if match:
    print(match.group(0))
else:
    print("Não encontrada definição tipada de homeScreen.")

print()
print("Chamadas a setHomeScreen:")

for i, line in enumerate(app.splitlines(), 1):
    if "setHomeScreen(" in line:
        print(f"{i}: {line.strip()}")


# ==============================================================
# 2. TABS
# ==============================================================

print()
print("=" * 76)
print("2. NAVEGAÇÃO ENTRE TABS")
print("=" * 76)

for i, line in enumerate(app.splitlines(), 1):
    if (
        "setCurrentTab(" in line
        or "currentTab ===" in line
        or "currentTab ==" in line
    ):
        print(f"{i}: {line.strip()}")


# ==============================================================
# 3. COMPONENTES EXISTENTES NO TAB 0
# ==============================================================

print()
print("=" * 76)
print("3. COMPONENTES / DESTINOS DO PRIMEIRO SEPARADOR")
print("=" * 76)

component_patterns = [
    "HomeWorld",
    "HomeShop",
    "HomeInventory",
    "ConfiaCompanionHome",
    "Patterns",
    "Progress",
    "Objectives",
    "Impulse",
    "Hug",
    "Abraço",
    "Impulso",
]

for pattern in component_patterns:
    hits = []

    for i, line in enumerate(app.splitlines(), 1):
        if pattern.lower() in line.lower():
            hits.append((i, line.strip()))

    if hits:
        print()
        print(f"--- {pattern} ---")
        for i, line in hits[:20]:
            print(f"{i}: {line}")


# ==============================================================
# 4. FUNÇÕES QUE ABREM FUNCIONALIDADES
# ==============================================================

print()
print("=" * 76)
print("4. FUNÇÕES DE ABERTURA / AÇÕES")
print("=" * 76)

action_patterns = [
    r'const\s+\w*Impulse\w*\s*=',
    r'const\s+\w*Hug\w*\s*=',
    r'const\s+\w*Objective\w*\s*=',
    r'const\s+\w*Pattern\w*\s*=',
    r'const\s+\w*Progress\w*\s*=',
    r'const\s+\w*Exercise\w*\s*=',
    r'const\s+\w*Pause\w*\s*=',
    r'const\s+\w*Breathe\w*\s*=',
    r'const\s+\w*CheckIn\w*\s*=',
    r'function\s+\w*(Impulse|Hug|Objective|Pattern|Progress|Exercise|Pause|Breathe|CheckIn)\w*',
]

seen = set()

for pattern in action_patterns:
    for i, line in enumerate(app.splitlines(), 1):
        if re.search(pattern, line, re.IGNORECASE):
            key = (i, line.strip())
            if key not in seen:
                seen.add(key)
                print(f"{i}: {line.strip()}")


# ==============================================================
# 5. PROPS DO COMPANION HOME
# ==============================================================

print()
print("=" * 76)
print("5. PROPS RECEBIDAS PELO COMPANION HOME")
print("=" * 76)

lines = companion.splitlines()

for i, line in enumerate(lines, 1):
    if (
        "interface " in line
        or "type " in line
        or "avatar:" in line
        or "reactiveResult" in line
        or "on" in line and ":" in line
    ):
        if i < 100:
            print(f"{i}: {line.strip()}")


# ==============================================================
# 6. HANDLERS JÁ DISPONÍVEIS NO COMPANION HOME
# ==============================================================

print()
print("=" * 76)
print("6. HANDLERS DO COMPANION HOME")
print("=" * 76)

for i, line in enumerate(lines, 1):
    if (
        "onClick" in line
        or "onPet" in line
        or "handle" in line.lower()
        or "setHomeScreen" in line
        or "setCurrentTab" in line
    ):
        print(f"{i}: {line.strip()}")


# ==============================================================
# 7. REAÇÃO A6/A7
# ==============================================================

print()
print("=" * 76)
print("7. PONTO EXATO DA DECISÃO A6/A7")
print("=" * 76)

for i, line in enumerate(lines, 1):
    if (
        "companionReaction" in line
        or "companionRelationalMemory" in line
        or "companionRelationalExpression" in line
        or "priority" in line
        or "companionMessage" in line
    ):
        print(f"{i}: {line.strip()}")


# ==============================================================
# 8. AÇÕES QUE JÁ APARECEM NAS TRADUÇÕES ATIVAS
#    APENAS PT.JSON — NÃO TOCAR NOS BACKUPS
# ==============================================================

print()
print("=" * 76)
print("8. AÇÕES EXISTENTES NO PT.JSON ATIVO")
print("=" * 76)

PT = Path("src/locales/pt.json")

if PT.exists():
    pt = PT.read_text(encoding="utf-8")

    keywords = [
        "action",
        "start",
        "open",
        "exercise",
        "impulse",
        "hug",
        "objectives",
        "patterns",
        "progress",
        "breathe",
        "pause",
        "checkIn",
        "nextStep",
    ]

    for i, line in enumerate(pt.splitlines(), 1):
        lower = line.lower()

        if any(k.lower() in lower for k in keywords):
            print(f"{i}: {line.strip()}")
else:
    print("PT.JSON não encontrado.")


# ==============================================================
# 9. PROIBIDOS
# ==============================================================

print()
print("=" * 76)
print("9. VERIFICAÇÃO DE PROIBIDOS NO COMPANION HOME")
print("=" * 76)

checks = {
    "Math.random": r"Math\.random\(",
    "setTimeout": r"setTimeout\(",
    "setInterval": r"setInterval\(",
    "requestAnimationFrame": r"requestAnimationFrame\(",
    "localStorage.setItem": r"localStorage\.setItem\(",
}

for name, pattern in checks.items():
    count = len(re.findall(pattern, companion))

    print(f"{name}: {count}")


# ==============================================================
# FIM
# ==============================================================

print()
print("=" * 76)
print("FIM A8.1B")
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
print("determinar exatamente como A8 poderá lançar")
print("uma ação real da CONFIA sem criar um segundo sistema.")
print("=" * 76)
