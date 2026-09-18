from pathlib import Path
import json
import sys

# ============================================================
# CONFIA — FASE 4D
# AUDITORIA FINAL — MUNDO VIVO / COMPANION
#
# APENAS LEITURA.
#
# Valida:
# - 4B Mundo Vivo
# - 4C Companion Vivo
# - worldMood derivado da memória já existente
# - nenhuma memória paralela
# - nenhum novo storage
# - nenhuma nova chamada ao Reactive Engine
# - nenhuma nova recolha de memória
# - HomeWorld continua leve
# - Companion mantém comportamento anterior
# - evolução XP/refúgio preservada
# - PT / EN / ES / FR
#
# NÃO ALTERA FICHEIROS.
# ============================================================

ROOT = Path.cwd()

APP = ROOT / "src/App.tsx"
HOME = ROOT / "src/components/HomeWorld.tsx"
AVATAR = ROOT / "src/components/Avatar.tsx"

LOCALES = {
    "pt": ROOT / "src/locales/pt.json",
    "en": ROOT / "src/locales/en.json",
    "es": ROOT / "src/locales/es.json",
    "fr": ROOT / "src/locales/fr.json",
}


def section(text):
    print()
    print("=" * 78)
    print(text)
    print("=" * 78)


def ok(text):
    print(f"✓ {text}")


def warn(text):
    print(f"⚠ {text}")


def error(text):
    print(f"✗ {text}")


# ============================================================
# 1. FICHEIROS
# ============================================================

section("1. FICHEIROS")

paths = [
    APP,
    HOME,
    AVATAR,
    *LOCALES.values(),
]

missing = [
    path
    for path in paths
    if not path.exists()
]

if missing:
    for path in missing:
        error(str(path))
    sys.exit(1)

ok("Todos os ficheiros existem")

app = APP.read_text(encoding="utf-8")
home = HOME.read_text(encoding="utf-8")
avatar = AVATAR.read_text(encoding="utf-8")


# ============================================================
# 2. FASE 4B
# ============================================================

section("2. FASE 4B — MUNDO VIVO")

checks_4b = {
    "Mundo Vivo":
        "CONFIA 4B — MUNDO VIVO",

    "Atmosfera reativa":
        "CONFIA 4B — ATMOSFERA REATIVA",

    "worldMood":
        "const worldMood:",

    "growing":
        '"growing"',

    "settling":
        '"settling"',

    "discovering":
        '"discovering"',

    "neutral":
        '"neutral"',

    "prop HomeWorld":
        "worldMood={worldMood}",
}

phase4b_ok = True

for label, marker in checks_4b.items():
    target = app if marker in app else home

    if marker in target:
        ok(label)
    else:
        error(label)
        phase4b_ok = False


# ============================================================
# 3. WORLD MOOD NÃO TEM CÉREBRO PRÓPRIO
# ============================================================

section("3. WORLD MOOD — ORIGEM")

world_start = app.find(
    "CONFIA 4B — MUNDO VIVO"
)

world_end = app.find(
    "const homeNowContext",
    world_start,
)

if world_start == -1 or world_end == -1:
    error("Não foi possível isolar worldMood")
    world_region = ""
else:
    world_region = app[
        world_start:world_end
    ]
    ok("Bloco worldMood isolado")


if "dailyContext?.dailyLearningLevel" in world_region:
    ok("worldMood reutiliza dailyLearningLevel")
else:
    error("worldMood não usa dailyLearningLevel")


for forbidden, label in [
    (
        "analyzeReactiveState(",
        "Reactive Engine"
    ),
    (
        "collectReactiveRecentMemory(",
        "recolha de memória"
    ),
    (
        "recordReactiveResponse(",
        "histórico reativo"
    ),
    (
        "localStorage.",
        "storage"
    ),
    (
        "useState(",
        "useState"
    ),
    (
        "useEffect(",
        "useEffect"
    ),
]:
    if forbidden in world_region:
        error(
            f"worldMood contém {label}"
        )
    else:
        ok(
            f"worldMood sem {label}"
        )


# ============================================================
# 4. ATMOSFERA
# ============================================================

section("4. ATMOSFERA DO MUNDO")

atmosphere_start = home.find(
    "CONFIA 4B — ATMOSFERA REATIVA"
)

atmosphere_end = home.find(
    "<Clouds />",
    atmosphere_start,
)

if (
    atmosphere_start == -1
    or atmosphere_end == -1
):
    error(
        "Não foi possível isolar atmosfera"
    )
    atmosphere = ""
else:
    atmosphere = home[
        atmosphere_start:
        atmosphere_end
    ]
    ok("Atmosfera isolada")


if "pointer-events-none" in atmosphere:
    ok("Atmosfera não captura interação")
else:
    error("Atmosfera pode capturar interação")


if "aria-hidden" in atmosphere:
    ok("Atmosfera marcada como decorativa")
else:
    warn("aria-hidden não encontrado")


for forbidden in [
    "motion.",
    "animate-",
    "setTimeout(",
    "setInterval(",
    "requestAnimationFrame",
    "onClick=",
    "onPointer",
]:
    if forbidden in atmosphere:
        error(
            f"Atmosfera contém {forbidden}"
        )
    else:
        ok(
            f"Atmosfera sem {forbidden}"
        )


# ============================================================
# 5. MUNDO PREMIUM PRESERVADO
# ============================================================

section("5. MUNDO PREMIUM PRESERVADO")

world_components = [
    "<Clouds />",
    "<GrassTexture />",
    "<Butterflies />",
    "<PremiumRefuge xp={avatar.xp} />",
    "<GrassDetails />",
    "<PremiumSky isNight={isNight} />",
    "<PremiumLighting isNight={isNight} />",
    "<PremiumDepth />",
    "<PremiumGround />",
    "<PremiumPath />",
    "{refugeLevel >= 3 && <PremiumWater />}",
    "<PremiumVegetation />",
    "<PremiumEnvironment level={refugeLevel} />",
]

for marker in world_components:
    if marker in home:
        ok(marker)
    else:
        error(marker)


# ============================================================
# 6. EVOLUÇÃO DO REFÚGIO
# ============================================================

section("6. EVOLUÇÃO EXISTENTE")

if (
    "getRefugeLevel(avatar.xp).level"
    in home
):
    ok("Refúgio continua ligado ao XP")
else:
    error("Ligação XP → refúgio ausente")


if (
    "{refugeLevel >= 3 && <PremiumWater />}"
    in home
):
    ok("Água continua dependente do nível")
else:
    error("Água evolutiva ausente")


if (
    "<PremiumEnvironment level={refugeLevel} />"
    in home
):
    ok("Environment continua dependente do nível")
else:
    error("Environment evolutivo ausente")


# ============================================================
# 7. FASE 4C
# ============================================================

section("7. FASE 4C — COMPANION VIVO")

checks_4c = {
    "Companion Vivo":
        "CONFIA 4C — COMPANION VIVO",

    "Estado visível":
        "CONFIA 4C — ESTADO VISÍVEL DO COMPANION",

    "prop recebida":
        "companionWorldMood?",

    "default neutral":
        'companionWorldMood = "neutral"',

    "status derivado":
        "const companionStatus =",

    "ligação HomeWorld":
        "companionWorldMood={worldMood}",
}

phase4c_ok = True

for label, marker in checks_4c.items():

    if (
        marker in avatar
        or marker in home
    ):
        ok(label)
    else:
        error(label)
        phase4c_ok = False


# ============================================================
# 8. COMPANION STATUS
# ============================================================

section("8. ESTADO DO COMPANION")

status_start = avatar.find(
    "CONFIA 4C — COMPANION VIVO"
)

status_end = avatar.find(
    "const renderAvatarSVG",
    status_start,
)

if (
    status_start == -1
    or status_end == -1
):
    error(
        "Não foi possível isolar companionStatus"
    )
    status_region = ""
else:
    status_region = avatar[
        status_start:status_end
    ]
    ok("companionStatus isolado")


status_keys = [
    "companionWorldStatus.growing",
    "companionWorldStatus.settling",
    "companionWorldStatus.discovering",
    "companionWorldStatus.neutral",
]

for marker in status_keys:
    if marker in status_region:
        ok(marker)
    else:
        error(marker)


for forbidden in [
    "useState(",
    "useEffect(",
    "setTimeout(",
    "setInterval(",
    "requestAnimationFrame",
    "localStorage.",
    "analyzeReactiveState(",
    "collectReactiveRecentMemory(",
]:
    if forbidden in status_region:
        error(
            f"companionStatus contém {forbidden}"
        )
    else:
        ok(
            f"companionStatus sem {forbidden}"
        )


# ============================================================
# 9. SELO VISUAL
# ============================================================

section("9. SELO VISUAL")

badge_start = avatar.find(
    "CONFIA 4C — ESTADO VISÍVEL DO COMPANION"
)

if badge_start == -1:
    error("Selo não encontrado")
    badge_region = ""
else:
    badge_region = avatar[
        badge_start:
        badge_start + 1400
    ]
    ok("Selo encontrado")


if "pointer-events-none" in badge_region:
    ok("Selo não interfere com toque")
else:
    error("Selo pode interferir com toque")


if "companionStatus.label" in badge_region:
    ok("Selo apresenta estado derivado")
else:
    error("Label do estado não encontrado")


if "companionStatus.className" in badge_region:
    ok("Selo usa apresentação derivada")
else:
    error("Classe do estado não encontrada")


for forbidden in [
    "<motion.",
    "animate-",
    "onClick=",
    "onPointer",
    "setTimeout(",
    "setInterval(",
]:
    if forbidden in badge_region:
        error(
            f"Selo contém {forbidden}"
        )
    else:
        ok(
            f"Selo sem {forbidden}"
        )


# ============================================================
# 10. COMPORTAMENTO ANTIGO DO AVATAR
# ============================================================

section("10. AVATAR PRESERVADO")

avatar_existing = [
    "avatarLowMood",
    "avatarHighMood",
    "avatarStageMessage1",
    "avatarStageMessage5",
    "avatarStageMessage10",
    "avatarMessages",
    "memoryMessage",
    "levelUpTrigger",
    "handleInteraction",
    "renderAvatarSVG",
    "AFFIRMATIONS",
    "setShowBubble",
    "setIsJumping",
    "setHearts",
]

for marker in avatar_existing:
    if marker in avatar:
        ok(marker)
    else:
        error(marker)


# ============================================================
# 11. TRADUÇÕES
# ============================================================

section("11. PT / EN / ES / FR")

expected_keys = {
    "growing",
    "settling",
    "discovering",
    "neutral",
}

locale_ok = True

for language, path in LOCALES.items():

    try:
        data = json.loads(
            path.read_text(
                encoding="utf-8"
            )
        )
    except Exception as exc:
        error(
            f"{language}: JSON inválido — {exc}"
        )
        locale_ok = False
        continue

    block = data.get(
        "companionWorldStatus"
    )

    if not isinstance(block, dict):
        error(
            f"{language}: companionWorldStatus ausente"
        )
        locale_ok = False
        continue

    if set(block.keys()) != expected_keys:
        error(
            f"{language}: chaves diferentes"
        )
        locale_ok = False
        continue

    empty = [
        key
        for key in expected_keys
        if not isinstance(
            block.get(key),
            str
        )
        or not block[key].strip()
    ]

    if empty:
        error(
            f"{language}: textos vazios {empty}"
        )
        locale_ok = False
    else:
        ok(
            f"{language}: completo"
        )


# ============================================================
# 12. CONTAGENS DE PERFORMANCE
# ============================================================

section("12. PERFORMANCE")

tokens = {
    "useState":
        "useState(",

    "useEffect":
        "useEffect(",

    "setTimeout":
        "setTimeout(",

    "setInterval":
        "setInterval(",

    "requestAnimationFrame":
        "requestAnimationFrame",

    "addEventListener":
        "addEventListener(",

    "localStorage.getItem":
        "localStorage.getItem",

    "localStorage.setItem":
        "localStorage.setItem",
}


print()
print("HOMEWORLD")

for label, token in tokens.items():
    print(
        f"{label:28} {home.count(token)}"
    )


print()
print("AVATAR")

for label, token in tokens.items():
    print(
        f"{label:28} {avatar.count(token)}"
    )


# HomeWorld baseline antes da Fase 4:
# useState = 6
# useEffect = 0
# timers = 0
# rAF = 0
# listeners = 0
# localStorage direto = 0

home_expected = {
    "useState(": 6,
    "useEffect(": 0,
    "setTimeout(": 0,
    "setInterval(": 0,
    "requestAnimationFrame": 0,
    "addEventListener(": 0,
    "localStorage.getItem": 0,
    "localStorage.setItem": 0,
}

for token, expected in home_expected.items():

    actual = home.count(token)

    if actual == expected:
        ok(
            f"HomeWorld {token}: {actual}"
        )
    else:
        warn(
            f"HomeWorld {token}: "
            f"{actual} (baseline {expected})"
        )


# ============================================================
# 13. NENHUM STORAGE DA FASE 4
# ============================================================

section("13. STORAGE DA FASE 4")

phase4_storage_tokens = [
    "worldMoodStorage",
    "companionMoodStorage",
    "lastWorldMood",
    "companionWorldHistory",
    "worldMoodHistory",
]

found_storage = False

for token in phase4_storage_tokens:

    count = (
        app.count(token)
        + home.count(token)
        + avatar.count(token)
    )

    if count:
        error(
            f"{token}: {count}"
        )
        found_storage = True

if not found_storage:
    ok(
        "nenhum storage paralelo criado pela Fase 4"
    )


# ============================================================
# 14. SEM NOVO MOTOR / MEMÓRIA
# ============================================================

section("14. MOTOR E MEMÓRIA")

if (
    "analyzeReactiveState("
    not in home
    and "analyzeReactiveState("
    not in avatar
):
    ok(
        "HomeWorld/Avatar não executam Reactive Engine"
    )
else:
    error(
        "Reactive Engine encontrado no mundo"
    )


if (
    "collectReactiveRecentMemory("
    not in home
    and "collectReactiveRecentMemory("
    not in avatar
):
    ok(
        "HomeWorld/Avatar não recolhem memória"
    )
else:
    error(
        "recolha de memória encontrada no mundo"
    )


# ============================================================
# 15. RESULTADO
# ============================================================

section("RESULTADO FINAL")

critical = [
    phase4b_ok,
    phase4c_ok,
    locale_ok,

    "dailyContext?.dailyLearningLevel"
        in world_region,

    "analyzeReactiveState("
        not in world_region,

    "collectReactiveRecentMemory("
        not in world_region,

    "localStorage."
        not in world_region,

    "pointer-events-none"
        in atmosphere,

    "companionWorldMood={worldMood}"
        in home,

    "const companionStatus ="
        in avatar,

    "pointer-events-none"
        in badge_region,

    "getRefugeLevel(avatar.xp).level"
        in home,

    "{refugeLevel >= 3 && <PremiumWater />}"
        in home,

    "<PremiumEnvironment level={refugeLevel} />"
        in home,

    home.count("useEffect(") == 0,
    home.count("setTimeout(") == 0,
    home.count("setInterval(") == 0,
    home.count("requestAnimationFrame") == 0,
    home.count("addEventListener(") == 0,
]

if all(critical):

    print()
    print(
        "✓ FASE 4 — MUNDO VIVO / COMPANION "
        "estruturalmente coerente"
    )
    print()

    print("Arquitetura final:")
    print()
    print("MEMÓRIA EXISTENTE")
    print("   ↓")
    print("DAILY LEARNING LEVEL")
    print("   ↓")
    print("WORLD MOOD")
    print("   ↓")
    print("┌─────────────────────────────┐")
    print("│                             │")
    print("↓                             ↓")
    print("ATMOSFERA                  COMPANION")
    print("DO MUNDO                    VIVO")
    print("│                             │")
    print("└──────────────┬──────────────┘")
    print("               ↓")
    print("      EXPERIÊNCIA DO MUNDO")
    print()
    print(
        "O mundo reage sem possuir um segundo "
        "motor de interpretação."
    )

else:

    print()
    print(
        "⚠ Existem pontos críticos a rever "
        "antes de fechar a Fase 4."
    )


print()
print("-" * 78)
print()
print("Este script foi APENAS LEITURA.")
print("Nenhum ficheiro foi alterado.")
print()
print(
    "Não é necessário executar npm run build "
    "depois desta auditoria."
)
print()
print("=" * 78)
