from pathlib import Path
import json
import shutil
import sys

# ============================================================
# CONFIA — FASE 4C
# COMPANION VIVO
#
# Objetivo:
#
# Tornar visível, de forma subtil, que o Companion acompanha
# a evolução/contexto já conhecido pela CONFIA.
#
# worldMood existente:
#
# growing
# settling
# discovering
# neutral
#
# Não criamos:
# - memória
# - storage
# - state
# - effects
# - timers
# - listeners
# - animações
# - motor
# - assets
# - dependências
#
# ALTERA:
#   src/components/HomeWorld.tsx
#   src/components/Avatar.tsx
#   src/locales/pt.json
#   src/locales/en.json
#   src/locales/es.json
#   src/locales/fr.json
# ============================================================

ROOT = Path.cwd()

HOME = ROOT / "src/components/HomeWorld.tsx"
AVATAR = ROOT / "src/components/Avatar.tsx"

LOCALES = {
    "pt": ROOT / "src/locales/pt.json",
    "en": ROOT / "src/locales/en.json",
    "es": ROOT / "src/locales/es.json",
    "fr": ROOT / "src/locales/fr.json",
}

BACKUPS = {
    HOME:
        Path("/tmp/HomeWorld.tsx.before_fase4c_companion_vivo"),

    AVATAR:
        Path("/tmp/Avatar.tsx.before_fase4c_companion_vivo"),

    LOCALES["pt"]:
        Path("/tmp/pt.json.before_fase4c_companion_vivo"),

    LOCALES["en"]:
        Path("/tmp/en.json.before_fase4c_companion_vivo"),

    LOCALES["es"]:
        Path("/tmp/es.json.before_fase4c_companion_vivo"),

    LOCALES["fr"]:
        Path("/tmp/fr.json.before_fase4c_companion_vivo"),
}


def fail(message):
    print()
    print("=" * 78)
    print("ERRO — FASE 4C NÃO APLICADA")
    print("=" * 78)
    print()
    print(message)
    print()
    print("Nenhum ficheiro foi alterado.")
    print("=" * 78)
    sys.exit(1)


# ============================================================
# 1. VALIDAR
# ============================================================

for path in [HOME, AVATAR, *LOCALES.values()]:
    if not path.exists():
        fail(f"Não encontrei:\n{path}")

home_original = HOME.read_text(encoding="utf-8")
avatar_original = AVATAR.read_text(encoding="utf-8")


# ============================================================
# 2. CONFIRMAR 4B
# ============================================================

required_home = [
    "CONFIA 4B — ATMOSFERA REATIVA",
    'worldMood: "growing" | "settling" | "discovering" | "neutral";',
    "worldMood,",
    "<Avatar",
]

for marker in required_home:
    if marker not in home_original:
        fail(
            "HomeWorld não corresponde à arquitetura esperada.\n\n"
            f"Falta:\n{marker}"
        )


required_avatar = [
    "interface AvatarProps {",
    "avatar: AvatarState;",
    "onPet: () => void;",
    "memoryMessage?: string;",
    "const AvatarComponent: React.FC<AvatarProps>",
    "const stageDetails = getStageDetails(avatar.level);",
]

for marker in required_avatar:
    if marker not in avatar_original:
        fail(
            "Avatar não corresponde à arquitetura esperada.\n\n"
            f"Falta:\n{marker}"
        )


# ============================================================
# 3. IMPEDIR DUPLICAÇÃO
# ============================================================

if "CONFIA 4C — COMPANION VIVO" in avatar_original:
    fail("A Fase 4C já parece estar aplicada.")

if "companionWorldMood" in home_original:
    fail("HomeWorld já contém companionWorldMood.")


# ============================================================
# 4. ENCONTRAR O <Avatar> NO HOMEWORLD
#
# Não assumimos a posição exata.
# Apenas localizamos o componente existente.
# ============================================================

avatar_start = home_original.find("<Avatar")

if avatar_start == -1:
    fail("Não encontrei <Avatar no HomeWorld.")

avatar_end = home_original.find("/>", avatar_start)

if avatar_end == -1:
    fail("Não encontrei o fecho do <Avatar />.")

avatar_end += 2

avatar_block = home_original[
    avatar_start:avatar_end
]

if "worldMood=" in avatar_block:
    fail(
        "O Avatar já recebe worldMood."
    )


# ============================================================
# 5. PASSAR WORLD MOOD AO AVATAR
# ============================================================

new_avatar_block = avatar_block[:-2].rstrip()

new_avatar_block += '''
  companionWorldMood={worldMood}
/>'''

home_updated = (
    home_original[:avatar_start]
    + new_avatar_block
    + home_original[avatar_end:]
)


# ============================================================
# 6. AVATAR — NOVA PROP
# ============================================================

props_anchor = '''  memoryMessage?: string;
}'''

if avatar_original.count(props_anchor) != 1:
    fail(
        "Não encontrei exatamente uma vez "
        "o final esperado de AvatarProps."
    )

avatar_updated = avatar_original.replace(
    props_anchor,
    '''  memoryMessage?: string;
  companionWorldMood?: "growing" | "settling" | "discovering" | "neutral";
}''',
    1,
)


# ============================================================
# 7. AVATAR — DESESTRUTURAR
# ============================================================

destructure_anchor = '''  moodRating,
  memoryMessage
}) => {'''

if avatar_updated.count(destructure_anchor) != 1:
    fail(
        "Não encontrei a desestruturação esperada "
        "do Avatar."
    )

avatar_updated = avatar_updated.replace(
    destructure_anchor,
    '''  moodRating,
  memoryMessage,
  companionWorldMood = "neutral"
}) => {''',
    1,
)


# ============================================================
# 8. DERIVAR APRESENTAÇÃO
#
# Apenas strings e classes.
# Não cria estado.
# ============================================================

stage_anchor = '''const stageDetails = getStageDetails(avatar.level);
const stage = Math.min(10, avatar.level);'''

if avatar_updated.count(stage_anchor) != 1:
    fail(
        "Não encontrei stageDetails/stage."
    )


status_block = '''const stageDetails = getStageDetails(avatar.level);
const stage = Math.min(10, avatar.level);

/**
 * ==========================================================
 * CONFIA 4C — COMPANION VIVO
 * ==========================================================
 *
 * Estado puramente visual derivado do worldMood existente.
 * Não interpreta, não guarda e não cria comportamento.
 */
const companionStatus =
  companionWorldMood === "growing"
    ? {
        label: t("companionWorldStatus.growing"),
        className:
          "border-emerald-200/70 bg-emerald-50/85 text-emerald-700"
      }
    : companionWorldMood === "settling"
      ? {
          label: t("companionWorldStatus.settling"),
          className:
            "border-orange-200/70 bg-orange-50/85 text-orange-700"
        }
      : companionWorldMood === "discovering"
        ? {
            label: t("companionWorldStatus.discovering"),
            className:
              "border-sky-200/70 bg-sky-50/85 text-sky-700"
          }
        : {
            label: t("companionWorldStatus.neutral"),
            className:
              "border-white/65 bg-white/80 text-slate-600"
          };'''

avatar_updated = avatar_updated.replace(
    stage_anchor,
    status_block,
    1,
)


# ============================================================
# 9. ENCONTRAR RETURN PRINCIPAL DO AVATAR
#
# Precisamos de colocar o selo dentro da UI já existente,
# não no SVG.
# ============================================================

render_marker = "const renderAvatarSVG = () => {"

render_pos = avatar_updated.find(render_marker)

if render_pos == -1:
    fail(
        "Não encontrei renderAvatarSVG."
    )

# Procuramos o último return posterior ao SVG.
main_return = avatar_updated.find(
    "return (",
    avatar_updated.find("};", render_pos) + 2
)

if main_return == -1:
    # fallback: último return do ficheiro
    main_return = avatar_updated.rfind("return (")

if main_return == -1:
    fail(
        "Não consegui localizar o return principal do Avatar."
    )

# Procuramos a primeira div aberta nesse return.
main_div = avatar_updated.find(
    "<div",
    main_return
)

if main_div == -1:
    fail(
        "Não encontrei a div principal do Avatar."
    )

main_div_end = avatar_updated.find(
    ">",
    main_div
)

if main_div_end == -1:
    fail(
        "Não encontrei o fim da div principal."
    )

main_div_end += 1


# ============================================================
# 10. INSERIR SELO
#
# Absolute, pointer-events-none.
# Sem motion.
# Sem animação.
#
# z alto para ficar legível sem interferir na interação.
# ============================================================

badge = '''

      {/* CONFIA 4C — ESTADO VISÍVEL DO COMPANION */}
      <div
        aria-hidden="true"
        className={`
          pointer-events-none
          absolute left-1/2 top-2 z-40
          -translate-x-1/2
          whitespace-nowrap
          rounded-full border
          px-3 py-1
          text-[9px] font-black
          tracking-[0.02em]
          shadow-[0_5px_16px_rgba(70,50,40,0.06)]
          ${companionStatus.className}
        `}
      >
        {companionStatus.label}
      </div>'''

avatar_updated = (
    avatar_updated[:main_div_end]
    + badge
    + avatar_updated[main_div_end:]
)


# ============================================================
# 11. VALIDAR NOVA ESTRUTURA
# ============================================================

home_new_markers = [
    "companionWorldMood={worldMood}",
]

for marker in home_new_markers:
    if marker not in home_updated:
        fail(
            f"HomeWorld incompleto:\n{marker}"
        )


avatar_new_markers = [
    "CONFIA 4C — COMPANION VIVO",
    "CONFIA 4C — ESTADO VISÍVEL DO COMPANION",
    "companionWorldMood?",
    'companionWorldMood = "neutral"',
    "const companionStatus =",
    't("companionWorldStatus.growing")',
    't("companionWorldStatus.settling")',
    't("companionWorldStatus.discovering")',
    't("companionWorldStatus.neutral")',
]

for marker in avatar_new_markers:
    if marker not in avatar_updated:
        fail(
            f"Avatar incompleto:\n{marker}"
        )


# ============================================================
# 12. PERFORMANCE
# ============================================================

tracked = [
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
    "<motion.",
]

for token in tracked:
    before = avatar_original.count(token)
    after = avatar_updated.count(token)

    if before != after:
        fail(
            f"Avatar alterou a contagem de {token}\n\n"
            f"Antes: {before}\n"
            f"Depois: {after}"
        )


home_tracked = [
    "useState(",
    "useEffect(",
    "setTimeout(",
    "setInterval(",
    "requestAnimationFrame",
    "addEventListener(",
    "localStorage.getItem",
    "localStorage.setItem",
]

for token in home_tracked:
    before = home_original.count(token)
    after = home_updated.count(token)

    if before != after:
        fail(
            f"HomeWorld alterou a contagem de {token}\n\n"
            f"Antes: {before}\n"
            f"Depois: {after}"
        )


# ============================================================
# 13. TRADUÇÕES
# ============================================================

translations = {
    "pt": {
        "growing": "A crescer contigo",
        "settling": "A encontrar equilíbrio",
        "discovering": "A conhecer-te",
        "neutral": "Aqui contigo",
    },

    "en": {
        "growing": "Growing with you",
        "settling": "Finding balance",
        "discovering": "Getting to know you",
        "neutral": "Here with you",
    },

    "es": {
        "growing": "Creciendo contigo",
        "settling": "Encontrando equilibrio",
        "discovering": "Conociéndote",
        "neutral": "Aquí contigo",
    },

    "fr": {
        "growing": "Grandir avec toi",
        "settling": "Trouver l’équilibre",
        "discovering": "Apprendre à te connaître",
        "neutral": "Ici avec toi",
    },
}

locale_updated = {}

for language, path in LOCALES.items():

    text = path.read_text(
        encoding="utf-8"
    )

    try:
        data = json.loads(text)
    except json.JSONDecodeError as exc:
        fail(
            f"{language}: JSON inválido\n{exc}"
        )

    if "companionWorldStatus" in data:
        fail(
            f"{language}: companionWorldStatus já existe."
        )

    data["companionWorldStatus"] = translations[
        language
    ]

    locale_updated[language] = (
        json.dumps(
            data,
            ensure_ascii=False,
            indent=2,
        )
        + "\n"
    )


# ============================================================
# 14. PARIDADE
# ============================================================

expected = {
    "growing",
    "settling",
    "discovering",
    "neutral",
}

for language in LOCALES:

    data = json.loads(
        locale_updated[language]
    )

    block = data.get(
        "companionWorldStatus"
    )

    if not isinstance(block, dict):
        fail(
            f"{language}: bloco de tradução ausente."
        )

    if set(block.keys()) != expected:
        fail(
            f"{language}: chaves incorretas."
        )


# ============================================================
# 15. PRESERVAR COMPORTAMENTO EXISTENTE
# ============================================================

preserved_avatar = [
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

for marker in preserved_avatar:
    if marker not in avatar_updated:
        fail(
            "Comportamento existente desapareceu:\n"
            f"{marker}"
        )


# ============================================================
# 16. IMPORTS INTACTOS
# ============================================================

def imports(text):
    return "\n".join(
        line
        for line in text.splitlines()
        if line.startswith("import ")
    )


if imports(home_original) != imports(home_updated):
    fail(
        "HomeWorld imports foram alterados."
    )

if imports(avatar_original) != imports(avatar_updated):
    fail(
        "Avatar imports foram alterados."
    )


# ============================================================
# 17. BACKUPS
# ============================================================

for source, backup in BACKUPS.items():
    shutil.copy2(
        source,
        backup
    )


# ============================================================
# 18. ESCREVER
# ============================================================

HOME.write_text(
    home_updated,
    encoding="utf-8"
)

AVATAR.write_text(
    avatar_updated,
    encoding="utf-8"
)

for language, path in LOCALES.items():
    path.write_text(
        locale_updated[language],
        encoding="utf-8"
    )


# ============================================================
# 19. VERIFICAÇÃO PÓS-ESCRITA
# ============================================================

try:

    written_home = HOME.read_text(
        encoding="utf-8"
    )

    written_avatar = AVATAR.read_text(
        encoding="utf-8"
    )

    if (
        written_home.count(
            "companionWorldMood={worldMood}"
        )
        != 1
    ):
        raise RuntimeError(
            "Ligação HomeWorld → Avatar inválida."
        )

    if (
        written_avatar.count(
            "CONFIA 4C — COMPANION VIVO"
        )
        != 1
    ):
        raise RuntimeError(
            "Marcador 4C inválido."
        )

    if (
        written_avatar.count(
            "CONFIA 4C — ESTADO VISÍVEL DO COMPANION"
        )
        != 1
    ):
        raise RuntimeError(
            "Selo do Companion inválido."
        )

    for language, path in LOCALES.items():

        data = json.loads(
            path.read_text(
                encoding="utf-8"
            )
        )

        if (
            "companionWorldStatus"
            not in data
        ):
            raise RuntimeError(
                f"Tradução ausente: {language}"
            )

except Exception as exc:

    for source, backup in BACKUPS.items():
        shutil.copy2(
            backup,
            source
        )

    print()
    print("=" * 78)
    print(
        "ERRO PÓS-ESCRITA — ROLLBACK EXECUTADO"
    )
    print("=" * 78)
    print()
    print(exc)
    print()
    print(
        "Todos os ficheiros foram restaurados."
    )
    print("=" * 78)

    sys.exit(1)


# ============================================================
# 20. RESULTADO
# ============================================================

print()
print("=" * 78)
print("CONFIA — FASE 4C / COMPANION VIVO")
print("=" * 78)
print()

print("✓ worldMood reutilizado")
print("✓ Companion ligado ao estado do mundo")
print("✓ Estado visual derivado")
print("✓ A crescer contigo")
print("✓ A encontrar equilíbrio")
print("✓ A conhecer-te")
print("✓ Aqui contigo")
print("✓ Uma única peça visual nova")
print("✓ Nenhum novo storage")
print("✓ Nenhum novo useState")
print("✓ Nenhum novo useEffect")
print("✓ Nenhum timer")
print("✓ Nenhum listener")
print("✓ Nenhum requestAnimationFrame")
print("✓ Nenhuma animação nova")
print("✓ Nenhuma dependência")
print("✓ Nenhuma nova memória")
print("✓ Nenhuma nova chamada ao Reactive Engine")
print("✓ Interação do Companion preservada")
print("✓ Mensagens existentes preservadas")
print("✓ Evolução por nível preservada")
print("✓ PT / EN / ES / FR")
print()
print("Backups:")
print("  /tmp/HomeWorld.tsx.before_fase4c_companion_vivo")
print("  /tmp/Avatar.tsx.before_fase4c_companion_vivo")
print("  /tmp/pt.json.before_fase4c_companion_vivo")
print("  /tmp/en.json.before_fase4c_companion_vivo")
print("  /tmp/es.json.before_fase4c_companion_vivo")
print("  /tmp/fr.json.before_fase4c_companion_vivo")
print()
print("PRÓXIMO PASSO:")
print("  npm run build")
print("=" * 78)
