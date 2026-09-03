from pathlib import Path
import shutil
import sys

# ============================================================
# CONFIA — FASE 4B
# MUNDO VIVO
#
# Objetivo:
#
# Fazer o HomeWorld refletir subtilmente o contexto que a
# CONFIA já conhece, sem criar um novo sistema.
#
# ARQUITETURA:
#
# dailyContext.dailyLearningLevel
#             ↓
#       worldMood
#             ↓
#        HomeWorld
#             ↓
# camada atmosférica CSS estática
#
# REGRAS:
#
# - sem novo storage
# - sem useState
# - sem useEffect
# - sem timers
# - sem listeners
# - sem requestAnimationFrame
# - sem novas animações
# - sem nova chamada ao Reactive Engine
# - sem nova recolha de memória
# - sem dependências
# - sem assets
# - sem texto
# - sem traduções
#
# ALTERA:
#   src/App.tsx
#   src/components/HomeWorld.tsx
#
# BACKUPS:
#   /tmp/App.tsx.before_fase4b_mundo_vivo
#   /tmp/HomeWorld.tsx.before_fase4b_mundo_vivo
# ============================================================

ROOT = Path.cwd()

APP = ROOT / "src/App.tsx"
HOME = ROOT / "src/components/HomeWorld.tsx"

APP_BACKUP = Path(
    "/tmp/App.tsx.before_fase4b_mundo_vivo"
)

HOME_BACKUP = Path(
    "/tmp/HomeWorld.tsx.before_fase4b_mundo_vivo"
)


def fail(message):
    print()
    print("=" * 78)
    print("ERRO — FASE 4B NÃO APLICADA")
    print("=" * 78)
    print()
    print(message)
    print()
    print("Nenhum ficheiro foi alterado.")
    print("=" * 78)
    sys.exit(1)


# ============================================================
# 1. VALIDAR FICHEIROS
# ============================================================

if not APP.exists():
    fail(f"Não encontrei:\n{APP}")

if not HOME.exists():
    fail(f"Não encontrei:\n{HOME}")

app_original = APP.read_text(
    encoding="utf-8"
)

home_original = HOME.read_text(
    encoding="utf-8"
)


# ============================================================
# 2. VALIDAR ARQUITETURA EXISTENTE
# ============================================================

app_required = [
    "CONFIA 3E.1 — CONTINUIDADE INTELIGENTE",
    "dailyLearningLevel,",
    "<HomeWorld",
    "avatar={avatar}",
    "avatarMemoryMessage={avatarMemoryMessage}",
]

home_required = [
    "interface Props {",
    "avatar: any;",
    "avatarCelebrating: boolean;",
    "avatarMemoryMessage: string;",
    "morningRating: number;",
    "afternoonRating?: number;",
    "handlePetAvatar: () => void;",
    "const HomeWorld: React.FC<Props>",
    "const refugeLevel = getRefugeLevel(avatar.xp).level;",
    "<PremiumSky isNight={isNight} />",
    "<PremiumLighting isNight={isNight} />",
    "<PremiumEnvironment level={refugeLevel} />",
]

for marker in app_required:
    if marker not in app_original:
        fail(
            "App.tsx não corresponde à arquitetura esperada.\n\n"
            f"Falta:\n{marker}"
        )

for marker in home_required:
    if marker not in home_original:
        fail(
            "HomeWorld.tsx não corresponde à arquitetura esperada.\n\n"
            f"Falta:\n{marker}"
        )


# ============================================================
# 3. IMPEDIR DUPLICAÇÃO
# ============================================================

if "CONFIA 4B — MUNDO VIVO" in app_original:
    fail("A Fase 4B já parece estar aplicada no App.tsx.")

if "CONFIA 4B — ATMOSFERA REATIVA" in home_original:
    fail("A Fase 4B já parece estar aplicada no HomeWorld.tsx.")

if "worldMood" in home_original:
    fail(
        "HomeWorld.tsx já contém worldMood. "
        "É necessária revisão antes de alterar."
    )


# ============================================================
# 4. APP — DERIVAR WORLD MOOD
#
# Não há state.
# Não há memo.
# Não há engine.
#
# É uma transformação síncrona de dailyContext já existente.
# ============================================================

context_anchor = '''const homeNowContext = (() => {'''

if app_original.count(context_anchor) != 1:
    fail(
        "Não encontrei exatamente uma vez "
        "const homeNowContext."
    )


world_mood_block = '''/**
 * ==========================================================
 * CONFIA 4B — MUNDO VIVO
 * ==========================================================
 *
 * O mundo não cria uma interpretação própria.
 *
 * Apenas recebe uma tradução visual muito leve do nível de
 * continuidade que o Ritual Diário já calculou.
 *
 * Não existe storage, estado, efeito ou motor adicional.
 */
const worldMood:
  | "growing"
  | "settling"
  | "discovering"
  | "neutral" =
  dailyContext?.dailyLearningLevel === "learned_impulse" ||
  dailyContext?.dailyLearningLevel === "repeated_signals"
    ? "growing"
    : dailyContext?.dailyLearningLevel === "effective_impulse"
      ? "settling"
      : dailyContext?.dailyLearningLevel === "early_learning"
        ? "discovering"
        : "neutral";

'''

app_updated = app_original.replace(
    context_anchor,
    world_mood_block + context_anchor,
    1,
)


# ============================================================
# 5. APP — PASSAR PROP AO HOMEWORLD
# ============================================================

homeworld_prop_anchor = '''  handlePetAvatar={handlePetAvatar}

'''

if app_updated.count(homeworld_prop_anchor) != 1:
    fail(
        "Não encontrei exatamente uma vez a âncora "
        "handlePetAvatar do HomeWorld."
    )

app_updated = app_updated.replace(
    homeworld_prop_anchor,
    '''  handlePetAvatar={handlePetAvatar}
  worldMood={worldMood}

''',
    1,
)


# ============================================================
# 6. HOMEWORLD — TIPO DA PROP
# ============================================================

props_anchor = '''  handlePetAvatar: () => void;
}'''

if home_original.count(props_anchor) != 1:
    fail(
        "Não encontrei a âncora final da interface Props."
    )

home_updated = home_original.replace(
    props_anchor,
    '''  handlePetAvatar: () => void;
  worldMood: "growing" | "settling" | "discovering" | "neutral";
}''',
    1,
)


# ============================================================
# 7. HOMEWORLD — DESESTRUTURAR PROP
# ============================================================

destructure_anchor = '''  handlePetAvatar,
}) => {'''

if home_updated.count(destructure_anchor) != 1:
    fail(
        "Não encontrei a desestruturação de handlePetAvatar."
    )

home_updated = home_updated.replace(
    destructure_anchor,
    '''  handlePetAvatar,
  worldMood,
}) => {''',
    1,
)


# ============================================================
# 8. HOMEWORLD — CAMADA ATMOSFÉRICA
#
# Uma única div.
# Sem blur.
# Sem animação.
# Sem pointer events.
# Sem novos componentes.
#
# O gradiente é deliberadamente subtil.
# ============================================================

visual_anchor = '''<Clouds />
<GrassTexture />
<Butterflies />'''

if home_updated.count(visual_anchor) != 1:
    fail(
        "Não encontrei a sequência visual "
        "Clouds / GrassTexture / Butterflies."
    )


atmosphere = '''{/* ======================================================
    CONFIA 4B — ATMOSFERA REATIVA

    Uma única camada visual estática.
    Não anima, não captura eventos e não mantém estado.
====================================================== */}
<div
  aria-hidden="true"
  className={`pointer-events-none absolute inset-0 z-[1] ${
    worldMood === "growing"
      ? "bg-gradient-to-b from-amber-50/10 via-transparent to-emerald-50/10"
      : worldMood === "settling"
        ? "bg-gradient-to-b from-rose-50/10 via-transparent to-orange-50/10"
        : worldMood === "discovering"
          ? "bg-gradient-to-b from-sky-50/10 via-transparent to-violet-50/10"
          : "bg-transparent"
  }`}
/>

<Clouds />
<GrassTexture />
<Butterflies />'''

home_updated = home_updated.replace(
    visual_anchor,
    atmosphere,
    1,
)


# ============================================================
# 9. VALIDAR NOVA ARQUITETURA
# ============================================================

required_app_new = [
    "CONFIA 4B — MUNDO VIVO",
    "const worldMood:",
    '"growing"',
    '"settling"',
    '"discovering"',
    '"neutral"',
    "worldMood={worldMood}",
]

for marker in required_app_new:
    if marker not in app_updated:
        fail(
            f"App.tsx ficou incompleto:\n{marker}"
        )


required_home_new = [
    'worldMood: "growing" | "settling" | "discovering" | "neutral";',
    "worldMood,",
    "CONFIA 4B — ATMOSFERA REATIVA",
    'worldMood === "growing"',
    'worldMood === "settling"',
    'worldMood === "discovering"',
    "pointer-events-none",
    'aria-hidden="true"',
]

for marker in required_home_new:
    if marker not in home_updated:
        fail(
            f"HomeWorld.tsx ficou incompleto:\n{marker}"
        )


# ============================================================
# 10. PERFORMANCE — APP
# ============================================================

tracked_app = [
    "useState(",
    "useEffect(",
    "useMemo(",
    "useCallback(",
    "setTimeout(",
    "setInterval(",
    "requestAnimationFrame",
    "addEventListener(",
    "localStorage.getItem",
    "localStorage.setItem",
    "collectReactiveRecentMemory(",
    "analyzeReactiveState(",
    "recordReactiveResponse(",
]

for token in tracked_app:
    before = app_original.count(token)
    after = app_updated.count(token)

    if before != after:
        fail(
            f"App.tsx alterou a contagem de {token}\n\n"
            f"Antes: {before}\n"
            f"Depois: {after}"
        )


# ============================================================
# 11. PERFORMANCE — HOMEWORLD
# ============================================================

tracked_home = [
    "useState(",
    "useEffect(",
    "useMemo(",
    "useCallback(",
    "setTimeout(",
    "setInterval(",
    "requestAnimationFrame",
    "addEventListener(",
    "localStorage.getItem",
    "localStorage.setItem",
]

for token in tracked_home:
    before = home_original.count(token)
    after = home_updated.count(token)

    if before != after:
        fail(
            f"HomeWorld alterou a contagem de {token}\n\n"
            f"Antes: {before}\n"
            f"Depois: {after}"
        )


# ============================================================
# 12. GARANTIR UMA ÚNICA CAMADA NOVA
# ============================================================

if (
    home_updated.count(
        "CONFIA 4B — ATMOSFERA REATIVA"
    )
    != 1
):
    fail(
        "A camada atmosférica não ficou única."
    )

if (
    home_updated.count(
        'aria-hidden="true"'
    )
    != home_original.count(
        'aria-hidden="true"'
    ) + 1
):
    fail(
        "Número inesperado de elementos decorativos novos."
    )


# ============================================================
# 13. SEM NOVOS TEXTOS / TRADUÇÕES
# ============================================================

if 't("world' in home_updated:
    fail(
        "A 4B não deveria criar textos de tradução."
    )


# ============================================================
# 14. PRESERVAR MUNDO PREMIUM
# ============================================================

preserved_home = [
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
    "equippedItems.map",
    "equippedTrophies",
    "avatarMemoryMessage",
    "handlePetAvatar",
]

for marker in preserved_home:
    if marker not in home_updated:
        fail(
            "Elemento existente desapareceu:\n"
            f"{marker}"
        )


# ============================================================
# 15. IMPORTS INTACTOS
# ============================================================

def imports(text):
    return "\n".join(
        line
        for line in text.splitlines()
        if line.startswith("import ")
    )


if imports(app_original) != imports(app_updated):
    fail(
        "A Fase 4B não deveria alterar imports de App.tsx."
    )

if imports(home_original) != imports(home_updated):
    fail(
        "A Fase 4B não deveria alterar imports de HomeWorld.tsx."
    )


# ============================================================
# 16. BACKUPS
# ============================================================

shutil.copy2(
    APP,
    APP_BACKUP
)

shutil.copy2(
    HOME,
    HOME_BACKUP
)


# ============================================================
# 17. ESCREVER
# ============================================================

APP.write_text(
    app_updated,
    encoding="utf-8"
)

HOME.write_text(
    home_updated,
    encoding="utf-8"
)


# ============================================================
# 18. VERIFICAÇÃO PÓS-ESCRITA
# ============================================================

try:
    written_app = APP.read_text(
        encoding="utf-8"
    )

    written_home = HOME.read_text(
        encoding="utf-8"
    )

    if (
        written_app.count(
            "CONFIA 4B — MUNDO VIVO"
        )
        != 1
    ):
        raise RuntimeError(
            "Marcador 4B inválido no App."
        )

    if (
        written_home.count(
            "CONFIA 4B — ATMOSFERA REATIVA"
        )
        != 1
    ):
        raise RuntimeError(
            "Marcador 4B inválido no HomeWorld."
        )

    if (
        written_app.count(
            "worldMood={worldMood}"
        )
        != 1
    ):
        raise RuntimeError(
            "worldMood não foi ligado corretamente."
        )

except Exception as exc:

    shutil.copy2(
        APP_BACKUP,
        APP
    )

    shutil.copy2(
        HOME_BACKUP,
        HOME
    )

    print()
    print("=" * 78)
    print("ERRO PÓS-ESCRITA — ROLLBACK EXECUTADO")
    print("=" * 78)
    print()
    print(exc)
    print()
    print("App.tsx e HomeWorld.tsx restaurados.")
    print("=" * 78)

    sys.exit(1)


# ============================================================
# 19. RESULTADO
# ============================================================

print()
print("=" * 78)
print("CONFIA — FASE 4B / MUNDO VIVO")
print("=" * 78)
print()

print("✓ worldMood derivado do contexto existente")
print("✓ growing")
print("✓ settling")
print("✓ discovering")
print("✓ neutral")
print("✓ HomeWorld recebe apenas uma prop nova")
print("✓ Uma única camada atmosférica estática")
print("✓ Nenhum novo componente")
print("✓ Nenhum asset")
print("✓ Nenhum novo storage")
print("✓ Nenhum novo useState")
print("✓ Nenhum novo useEffect")
print("✓ Nenhum useMemo")
print("✓ Nenhum timer")
print("✓ Nenhum listener")
print("✓ Nenhum requestAnimationFrame")
print("✓ Nenhuma chamada nova ao Reactive Engine")
print("✓ Nenhuma recolha nova de memória")
print("✓ Nenhuma dependência")
print("✓ Nenhuma animação nova")
print("✓ Mundo Premium preservado")
print("✓ Refúgio preservado")
print("✓ Água evolutiva preservada")
print("✓ Environment por nível preservado")
print("✓ Companion preservado")
print("✓ Inventário e troféus preservados")
print("✓ Sem textos novos — PT/EN/ES/FR não precisam de alteração")
print()
print("Backups:")
print("  /tmp/App.tsx.before_fase4b_mundo_vivo")
print("  /tmp/HomeWorld.tsx.before_fase4b_mundo_vivo")
print()
print("PRÓXIMO PASSO:")
print("  npm run build")
print("=" * 78)
