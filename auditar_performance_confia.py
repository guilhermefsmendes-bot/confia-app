from pathlib import Path
import re

# ============================================================
# CONFIA — AUDITORIA DE PERFORMANCE / LAG
#
# APENAS LEITURA
#
# Objetivo:
# detetar sinais que possam causar lag, sobretudo no TAB 1.
#
# NÃO ALTERA FICHEIROS.
# ============================================================

ROOT = Path.cwd()

FILES = {
    "APP": ROOT / "src/App.tsx",
    "HOMEWORLD": ROOT / "src/components/HomeWorld.tsx",
    "AVATAR": ROOT / "src/components/Avatar.tsx",
    "ABRACO": ROOT / "src/components/AbracoTimer.tsx",
    "OBJECTIVES": ROOT / "src/components/ObjectivosList.tsx",
    "WEEKLY": ROOT / "src/components/WeeklyGoalSection.tsx",
}

print("=" * 78)
print("CONFIA — AUDITORIA DE PERFORMANCE / LAG")
print("=" * 78)

texts = {}

for name, path in FILES.items():
    if path.exists():
        texts[name] = path.read_text(encoding="utf-8")
        print(f"✓ {name}: {path}")
    else:
        print(f"⚠ {name}: não encontrado")

# ------------------------------------------------------------
# CONTADORES GERAIS
# ------------------------------------------------------------

TOKENS = [
    "useState(",
    "useEffect(",
    "useMemo(",
    "useCallback(",
    "setTimeout(",
    "setInterval(",
    "requestAnimationFrame(",
    "cancelAnimationFrame(",
    "addEventListener(",
    "removeEventListener(",
    "localStorage.getItem",
    "localStorage.setItem",
    "onSnapshot(",
    "ResizeObserver",
    "MutationObserver",
    "IntersectionObserver",
]

print()
print("=" * 78)
print("1. CONTAGENS FUNCIONAIS")
print("=" * 78)

for name, text in texts.items():
    print()
    print(f"[{name}]")

    for token in TOKENS:
        print(f"{token:<28} {text.count(token)}")

# ------------------------------------------------------------
# ANIMAÇÕES CONTÍNUAS
# ------------------------------------------------------------

print()
print("=" * 78)
print("2. ANIMAÇÕES CONTÍNUAS")
print("=" * 78)

patterns = [
    r"repeat\s*:\s*Infinity",
    r"repeat\s*:\s*infinity",
    r"animate-",
    r"transition\s*:",
    r"whileHover",
    r"whileTap",
]

for name, text in texts.items():
    lines = text.splitlines()
    found = False

    for i, line in enumerate(lines, start=1):
        if any(re.search(p, line, re.IGNORECASE) for p in patterns):
            if not found:
                print()
                print(f"[{name}]")
                found = True

            print(f"{i}: {line.rstrip()}")

# ------------------------------------------------------------
# RAF / INTERVALOS
# ------------------------------------------------------------

print()
print("=" * 78)
print("3. LOOPS POTENCIALMENTE PERMANENTES")
print("=" * 78)

for name, text in texts.items():
    lines = text.splitlines()

    for i, line in enumerate(lines, start=1):
        if (
            "requestAnimationFrame" in line
            or "setInterval" in line
        ):
            print(f"{name}:{i}: {line.rstrip()}")

# ------------------------------------------------------------
# POINTER / TOUCH / MOVE
# ------------------------------------------------------------

print()
print("=" * 78)
print("4. EVENTOS DE MOVIMENTO / GESTOS")
print("=" * 78)

move_patterns = [
    "pointermove",
    "mousemove",
    "touchmove",
    "onPointerMove",
    "onMouseMove",
    "onTouchMove",
    "drag",
]

for name, text in texts.items():
    lines = text.splitlines()
    found = False

    for i, line in enumerate(lines, start=1):
        if any(p.lower() in line.lower() for p in move_patterns):
            if not found:
                print()
                print(f"[{name}]")
                found = True

            print(f"{i}: {line.rstrip()}")

# ------------------------------------------------------------
# LOCALSTORAGE DENTRO DE LOOPS/EVENTOS
# ------------------------------------------------------------

print()
print("=" * 78)
print("5. LOCALSTORAGE — OCORRÊNCIAS")
print("=" * 78)

for name, text in texts.items():
    lines = text.splitlines()

    for i, line in enumerate(lines, start=1):
        if "localStorage." in line:
            print(f"{name}:{i}: {line.rstrip()}")

# ------------------------------------------------------------
# EFFECTS NO APP
# ------------------------------------------------------------

print()
print("=" * 78)
print("6. useEffect NO APP.TSX")
print("=" * 78)

app = texts.get("APP", "")
lines = app.splitlines()

for i, line in enumerate(lines, start=1):
    if "useEffect(" in line:
        start = max(0, i - 1)
        end = min(len(lines), i + 25)

        print()
        print(f"useEffect perto da linha {i}")
        print("-" * 60)

        for n in range(start, end):
            print(f"{n + 1}: {lines[n]}")

# ------------------------------------------------------------
# HOMEWORLD — COMPONENTES VISUAIS
# ------------------------------------------------------------

print()
print("=" * 78)
print("7. HOMEWORLD — CAMADAS VISUAIS")
print("=" * 78)

home = texts.get("HOMEWORLD", "")

components = [
    "Clouds",
    "Butterflies",
    "PremiumSky",
    "PremiumLighting",
    "PremiumGround",
    "PremiumPath",
    "PremiumVegetation",
    "PremiumEnvironment",
    "PremiumDepth",
    "PremiumRefuge",
    "Avatar",
    "Water",
]

for comp in components:
    print(f"{comp:<24} {home.count('<' + comp)}")

# ------------------------------------------------------------
# REACT.MEMO
# ------------------------------------------------------------

print()
print("=" * 78)
print("8. MEMOIZAÇÃO")
print("=" * 78)

for name, text in texts.items():
    print(
        f"{name:<14} "
        f"React.memo={text.count('React.memo')} "
        f"memo(={text.count('memo(')} "
        f"useMemo={text.count('useMemo(')}"
    )

# ------------------------------------------------------------
# MAPS GRANDES / LOOPS DE RENDER
# ------------------------------------------------------------

print()
print("=" * 78)
print("9. MAPS / RENDERS DE LISTAS")
print("=" * 78)

for name, text in texts.items():
    lines = text.splitlines()
    count = 0

    for i, line in enumerate(lines, start=1):
        if ".map(" in line:
            count += 1
            print(f"{name}:{i}: {line.rstrip()}")

    print(f"{name}: total .map() = {count}")

# ------------------------------------------------------------
# JSON / STRINGIFY / PARSE NO RENDER
# ------------------------------------------------------------

print()
print("=" * 78)
print("10. JSON.parse / JSON.stringify")
print("=" * 78)

for name, text in texts.items():
    lines = text.splitlines()

    for i, line in enumerate(lines, start=1):
        if "JSON.parse" in line or "JSON.stringify" in line:
            print(f"{name}:{i}: {line.rstrip()}")

# ------------------------------------------------------------
# MUDANÇAS RECENTES — MARCADORES
# ------------------------------------------------------------

print()
print("=" * 78)
print("11. MARCADORES DAS FASES RECENTES")
print("=" * 78)

markers = [
    "CONFIA 5B",
    "CONFIA 5C",
    "CONFIA 5D",
    "CONFIA 5E",
    "MUNDO VIVO",
    "COMPANION VIVO",
    "IDIOMA AUTOMÁTICO",
]

for marker in markers:
    count = sum(text.count(marker) for text in texts.values())
    print(f"{marker:<28} {count}")

# ------------------------------------------------------------
# SINAIS DE RISCO
# ------------------------------------------------------------

print()
print("=" * 78)
print("12. SINAIS DE RISCO AUTOMÁTICOS")
print("=" * 78)

risks = []

app = texts.get("APP", "")
home = texts.get("HOMEWORLD", "")
avatar = texts.get("AVATAR", "")

if app.count("setInterval(") > 0:
    risks.append("App.tsx contém setInterval.")

if home.count("setInterval(") > 0:
    risks.append("HomeWorld contém setInterval.")

if home.count("requestAnimationFrame(") > 0:
    risks.append("HomeWorld contém requestAnimationFrame.")

if home.count("useEffect(") > 0:
    risks.append("HomeWorld contém useEffect.")

if home.count("localStorage.") > 0:
    risks.append("HomeWorld acede diretamente a localStorage.")

if home.count("addEventListener(") > 0:
    risks.append("HomeWorld contém listeners.")

if app.count("requestAnimationFrame(") > 2:
    risks.append("App.tsx contém vários requestAnimationFrame.")

if app.count("useEffect(") > 25:
    risks.append("App.tsx tem número elevado de useEffect.")

if avatar.count("repeat: Infinity") + avatar.count("repeat:Infinity") > 4:
    risks.append("Avatar tem várias animações infinitas.")

if risks:
    for risk in risks:
        print(f"⚠ {risk}")
else:
    print("✓ Nenhum sinal estrutural óbvio de regressão pesada.")

# ------------------------------------------------------------
# RESUMO
# ------------------------------------------------------------

print()
print("=" * 78)
print("13. O QUE VAMOS DECIDIR COM ESTE OUTPUT")
print("=" * 78)

print("""
Vamos comparar principalmente:

APP
- useState
- useEffect
- timers
- rAF
- listeners
- localStorage

HOMEWORLD
- deve continuar extremamente leve em lógica
- idealmente sem effects, timers, listeners ou rAF próprios

AVATAR
- verificar se apenas mantém as animações já conhecidas

ALTERAÇÕES DE HOJE
- 5B/5C/5D/5E devem ser apenas lógica/render
- idioma automático não deve acrescentar runtime contínuo
- Comunidade isolada não deve afetar o TAB 1

Se estes números estiverem próximos do baseline que já tínhamos,
a probabilidade de termos reintroduzido o lag antigo é baixa.

Depois disso, o teste definitivo continua a ser no dispositivo real.
""")

print("=" * 78)
print("FIM DA AUDITORIA")
print("=" * 78)
