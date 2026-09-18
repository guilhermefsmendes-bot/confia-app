from pathlib import Path
import shutil
import sys

AVATAR = Path("src/components/Avatar.tsx")
BACKUP = Path(
    "/tmp/Avatar.tsx.before_companheiro_premium_a3_5"
)

if not AVATAR.exists():
    print("ERRO: Avatar.tsx não encontrado.")
    sys.exit(1)

source = AVATAR.read_text(encoding="utf-8")
avatar = source

# ============================================================
# CONFIA — COMPANHEIRO PREMIUM A3.5
# ACABAMENTO DA RELAÇÃO
#
# Baseado na estrutura REAL atual do Avatar.tsx.
#
# Remove:
# - balão interno antigo
# - mensagens aleatórias invisíveis
# - timer level-up de 5 s
# - timer welcome de 1 s
# - código morto confirmado
#
# Mantém:
# - isJumping
# - onPet()
# - micro-reação 800 ms
# - levelUpTrigger visual
# - reactionState
# - ConfiaCreature
# - XP/evolução
# ============================================================

required_before = [
    "const getRandomMessage = () => {",
    "const AFFIRMATIONS = [",
    'const [bubbleText, setBubbleText] = useState<string>("");',
    "const [showBubble, setShowBubble] = useState(false);",
    "const [isJumping, setIsJumping] = useState(false);",
    "// Show a welcome message on mount",
    "setBubbleText(getRandomMessage());",
    "const companionStatus =",
    "const levelUpProgress =",
    "const creatureState: ConfiaCreatureState",
    "<ConfiaCreature",
]

for marker in required_before:
    if marker not in avatar:
        print(
            "ERRO: estrutura esperada não encontrada:",
            marker
        )
        sys.exit(1)

shutil.copy2(AVATAR, BACKUP)

try:

    # ========================================================
    # 1. REMOVER BLOCO 35–67
    #
    # Desde getRandomMessage até imediatamente antes
    # de isJumping.
    # ========================================================

    start = avatar.find(
        "const getRandomMessage = () => {"
    )

    keep_marker = (
        "  const [isJumping, setIsJumping] = "
        "useState(false);"
    )

    end = avatar.find(
        keep_marker,
        start,
    )

    if start == -1 or end == -1:
        raise RuntimeError(
            "não foi possível delimitar o antigo "
            "bloco de mensagens"
        )

    removed_first = avatar[start:end]

    first_required = [
        "AFFIRMATIONS",
        "bubbleText",
        "showBubble",
        "levelUpTrigger",
        "5000",
    ]

    for marker in first_required:
        if marker not in removed_first:
            raise RuntimeError(
                "bloco 35–67 não contém "
                f"marcador esperado: {marker}"
            )

    avatar = (
        avatar[:start]
        + avatar[end:]
    )

    # ========================================================
    # 2. REMOVER BLOCO 70–103
    #
    # Agora procuramos pelo comentário e terminamos
    # exatamente na dependency array observada.
    # ========================================================

    welcome_start_marker = (
        "// Show a welcome message on mount"
    )

    welcome_end_marker = (
        "}, [i18n.language, moodRating, "
        "memoryMessage, avatar.level]);"
    )

    start = avatar.find(
        welcome_start_marker
    )

    end = avatar.find(
        welcome_end_marker,
        start,
    )

    if start == -1 or end == -1:
        raise RuntimeError(
            "não foi possível delimitar o antigo "
            "efeito de boas-vindas"
        )

    end += len(welcome_end_marker)

    removed_welcome = avatar[start:end]

    welcome_required = [
        "window.setTimeout",
        "setBubbleText",
        "setShowBubble",
        "Math.random()",
        "1000",
    ]

    for marker in welcome_required:
        if marker not in removed_welcome:
            raise RuntimeError(
                "bloco welcome não contém "
                f"marcador esperado: {marker}"
            )

    avatar = (
        avatar[:start]
        + avatar[end:]
    )

    # ========================================================
    # 3. LIMPAR HANDLE INTERACTION
    #
    # Não substituímos a função inteira.
    # Retiramos somente o código morto conhecido.
    # ========================================================

    old_signature = (
        "  const handleInteraction = "
        "(e: React.MouseEvent<HTMLDivElement>) => {"
    )

    new_signature = (
        "  const handleInteraction = () => {"
    )

    if avatar.count(old_signature) != 1:
        raise RuntimeError(
            "assinatura de handleInteraction inesperada"
        )

    avatar = avatar.replace(
        old_signature,
        new_signature,
        1,
    )

    dead_interaction = """// Choose random companion message
setBubbleText(getRandomMessage());
setShowBubble(true);
"""

    if avatar.count(dead_interaction) != 1:
        raise RuntimeError(
            "linhas mortas de handleInteraction "
            "não encontradas exatamente"
        )

    avatar = avatar.replace(
        dead_interaction,
        "",
        1,
    )

    # ========================================================
    # 4. REMOVER companionStatus
    #
    # Usamos creatureState como limite seguro.
    # ========================================================

    status_start = avatar.find(
        "const companionStatus ="
    )

    state_start = avatar.find(
        "const creatureState: ConfiaCreatureState",
        status_start,
    )

    if status_start == -1 or state_start == -1:
        raise RuntimeError(
            "não foi possível delimitar companionStatus"
        )

    status_block = avatar[
        status_start:state_start
    ]

    if len(status_block.splitlines()) > 40:
        raise RuntimeError(
            "companionStatus maior que o esperado; "
            "abortado por segurança"
        )

    avatar = (
        avatar[:status_start]
        + avatar[state_start:]
    )

    # ========================================================
    # 5. REMOVER levelUpProgress
    # ========================================================

    progress = (
        "  const levelUpProgress = "
        "(avatar.xp / avatar.maxXp) * 100;"
    )

    if avatar.count(progress) != 1:
        raise RuntimeError(
            "levelUpProgress não encontrado exatamente"
        )

    avatar = avatar.replace(
        progress,
        "",
        1,
    )

    # ========================================================
    # 6. LIMPAR i18n
    #
    # t continua necessário.
    # ========================================================

    translation_old = (
        "const { t, i18n } = useTranslation();"
    )

    translation_new = (
        "const { t } = useTranslation();"
    )

    if avatar.count(translation_old) != 1:
        raise RuntimeError(
            "declaração useTranslation inesperada"
        )

    avatar = avatar.replace(
        translation_old,
        translation_new,
        1,
    )

    # ========================================================
    # 7. ESCREVER
    # ========================================================

    AVATAR.write_text(
        avatar,
        encoding="utf-8",
    )

    written = AVATAR.read_text(
        encoding="utf-8"
    )

    # ========================================================
    # 8. VALIDAÇÃO — CÓDIGO MORTO
    # ========================================================

    must_be_gone = {
        "bubbleText": "bubbleText",
        "showBubble": "showBubble",
        "getRandomMessage": "getRandomMessage",
        "AFFIRMATIONS": "AFFIRMATIONS",
        "companionStatus": "companionStatus",
        "levelUpProgress": "levelUpProgress",
        "i18n.language": "i18n.language",
        "timer 5000": "5000",
        "timer 1000": "1000",
        "window.setTimeout": "window.setTimeout",
        "Math.random": "Math.random()",
    }

    failed = []

    for label, marker in must_be_gone.items():
        if marker in written:
            failed.append(
                f"{label} ainda existe"
            )

    # ========================================================
    # 9. VALIDAÇÃO — O QUE TEM DE FICAR
    # ========================================================

    must_remain = {
        "useTranslation":
            "const { t } = useTranslation();",

        "isJumping":
            "const [isJumping, setIsJumping] = "
            "useState(false);",

        "handleInteraction":
            "const handleInteraction = () => {",

        "onPet":
            "onPet();",

        "fim da micro-reação":
            "setIsJumping(false);",

        "timer 800":
            "}, 800);",

        "creatureState":
            "const creatureState: ConfiaCreatureState",

        "reactionState":
            "reactionState ??",

        "level-up visual":
            "levelUpTrigger || celebrating",

        "ConfiaCreature":
            "<ConfiaCreature",

        "estado da criatura":
            "state={creatureState}",

        "reação da criatura":
            "reacting={isJumping}",

        "motion":
            "animate={isJumping ?",
    }

    for label, marker in must_remain.items():
        if marker not in written:
            failed.append(
                f"{label} deixou de existir"
            )

    # ========================================================
    # 10. DEVE RESTAR EXATAMENTE UM TIMER
    # ========================================================

    timer_count = written.count(
        "setTimeout("
    )

    if timer_count != 1:
        failed.append(
            "esperava 1 setTimeout; "
            f"encontrei {timer_count}"
        )

    if failed:
        raise RuntimeError(
            "Validação final falhou:\n - "
            + "\n - ".join(failed)
        )

except Exception as exc:
    shutil.copy2(
        BACKUP,
        AVATAR,
    )

    print("ERRO:", exc)
    print()
    print(
        "Avatar.tsx restaurado automaticamente."
    )
    sys.exit(1)


print("=" * 76)
print("CONFIA — COMPANHEIRO PREMIUM A3.5")
print("=" * 76)
print()
print("✓ Antigo balão interno removido")
print("✓ bubbleText/showBubble removidos")
print("✓ Mensagens aleatórias invisíveis removidas")
print("✓ AFFIRMATIONS morto removido")
print("✓ Timer de level-up de 5 s removido")
print("✓ Timer de entrada de 1 s removido")
print("✓ companionStatus morto removido")
print("✓ levelUpProgress morto removido")
print("✓ i18n desnecessário removido")
print("✓ isJumping preservado")
print("✓ onPet preservado")
print("✓ Toque preservado")
print("✓ Micro-reação de 800 ms preservada")
print("✓ Apenas 1 setTimeout permanece no Avatar")
print("✓ levelUpTrigger visual preservado")
print("✓ reactionState preservado")
print("✓ ConfiaCreature preservada")
print("✓ XP/evolução preservados")
print("✓ Nenhum storage alterado")
print("✓ Nenhuma tradução alterada")
print("✓ Nenhuma dependência nova")
print()
print("Backup:")
print(f"  {BACKUP}")
print()
print("A3.5 aplicado.")
print("=" * 76)
