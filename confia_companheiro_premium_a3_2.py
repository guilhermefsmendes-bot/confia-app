from pathlib import Path
import shutil
import sys
import re

APP = Path("src/App.tsx")
HOME = Path(
    "src/components/Companheiro/ConfiaCompanionHome.tsx"
)
AVATAR = Path("src/components/Avatar.tsx")

BACKUP_APP = Path(
    "/tmp/App.tsx.before_companheiro_premium_a3_2"
)
BACKUP_HOME = Path(
    "/tmp/ConfiaCompanionHome.tsx.before_premium_a3_2"
)
BACKUP_AVATAR = Path(
    "/tmp/Avatar.tsx.before_companheiro_premium_a3_2"
)

for path in (APP, HOME, AVATAR):
    if not path.exists():
        print(f"ERRO: ficheiro não encontrado: {path}")
        sys.exit(1)

app = APP.read_text(encoding="utf-8")
home = HOME.read_text(encoding="utf-8")
avatar = AVATAR.read_text(encoding="utf-8")

# ============================================================
# VALIDAR ESTRUTURA ANTES DE ALTERAR
# ============================================================

required_app = [
    "const homeNowAction = (() => {",
    'const result = analyzeReactiveState({',
    'source: "general"',
    "<ConfiaCompanionHome",
    "worldMood={worldMood}",
]

required_home = [
    "interface ConfiaCompanionHomeProps",
    "const companionMessage = useMemo(() => {",
    "<Avatar",
    "companionWorldMood={worldMood}",
]

required_avatar = [
    "interface AvatarProps",
    "const creatureState",
    "<ConfiaCreature",
]

for marker in required_app:
    if marker not in app:
        print(f"ERRO App.tsx: estrutura não encontrada: {marker}")
        sys.exit(1)

for marker in required_home:
    if marker not in home:
        print(
            "ERRO ConfiaCompanionHome.tsx: "
            f"estrutura não encontrada: {marker}"
        )
        sys.exit(1)

for marker in required_avatar:
    if marker not in avatar:
        print(
            f"ERRO Avatar.tsx: estrutura não encontrada: {marker}"
        )
        sys.exit(1)

# ============================================================
# BACKUPS
# ============================================================

shutil.copy2(APP, BACKUP_APP)
shutil.copy2(HOME, BACKUP_HOME)
shutil.copy2(AVATAR, BACKUP_AVATAR)

try:

    # ========================================================
    # 1. APP.TSX
    #
    # Criar UMA fonte reativa para o Principal.
    # ========================================================

    home_action_marker = "const homeNowAction = (() => {"

    home_reactive_block = '''/**
 * CONFIA A3.2 — cérebro reativo único do Principal.
 *
 * O resultado é calculado uma vez e partilhado entre:
 * - ação inteligente;
 * - companheiro;
 * - balão;
 * - expressão visual.
 */
const homeReactiveResult = (() => {
  if (currentTab !== 0 || homeScreen !== "home") {
    return null;
  }

  return analyzeReactiveState({
    source: "general",
  });
})();


'''

    if "const homeReactiveResult = (() => {" not in app:
        app = app.replace(
            home_action_marker,
            home_reactive_block + home_action_marker,
            1,
        )

    # Substituir APENAS a análise general que está dentro
    # de homeNowAction.
    old_general_call = '''  const result = analyzeReactiveState({
    source: "general",
  });

  const intent = result?.intent;'''

    new_general_call = '''  const result = homeReactiveResult;

  const intent = result?.intent;'''

    if old_general_call not in app:
        raise RuntimeError(
            "não foi encontrada a chamada general "
            "dentro de homeNowAction"
        )

    app = app.replace(
        old_general_call,
        new_general_call,
        1,
    )

    # Passar exatamente o mesmo resultado ao companheiro.
    old_companion_end = '''  handlePetAvatar={handlePetAvatar}
  worldMood={worldMood}
/>'''

    new_companion_end = '''  handlePetAvatar={handlePetAvatar}
  worldMood={worldMood}
  reactiveResult={homeReactiveResult}
/>'''

    if old_companion_end not in app:
        raise RuntimeError(
            "render de ConfiaCompanionHome não encontrado"
        )

    app = app.replace(
        old_companion_end,
        new_companion_end,
        1,
    )

    # ========================================================
    # 2. CONFIA COMPANION HOME
    # ========================================================

    # Imports
    import_marker = '''import type { AvatarState } from "../../types";'''

    new_imports = '''import type { AvatarState } from "../../types";
import type {
  ReactiveResult,
} from "../../data/reactive/reactiveTypes";
import {
  resolveCompanionReaction,
} from "../../data/reactive/companionReactionEngine";'''

    if (
        "resolveCompanionReaction" not in
        home.split("interface ConfiaCompanionHomeProps")[0]
    ):
        if import_marker not in home:
            raise RuntimeError(
                "import AvatarState não encontrado"
            )

        home = home.replace(
            import_marker,
            new_imports,
            1,
        )

    # Nova prop
    prop_marker = '''  handlePetAvatar: () => void;
  worldMood:'''

    prop_replacement = '''  handlePetAvatar: () => void;
  reactiveResult: ReactiveResult | null;
  worldMood:'''

    if "reactiveResult: ReactiveResult | null;" not in home:
        if prop_marker not in home:
            raise RuntimeError(
                "posição para reactiveResult não encontrada"
            )

        home = home.replace(
            prop_marker,
            prop_replacement,
            1,
        )

    # Desestruturação
    destruct_marker = '''  handlePetAvatar,
  worldMood,
}: ConfiaCompanionHomeProps) {'''

    destruct_replacement = '''  handlePetAvatar,
  reactiveResult,
  worldMood,
}: ConfiaCompanionHomeProps) {'''

    if destruct_marker not in home:
        raise RuntimeError(
            "desestruturação do CompanionHome não encontrada"
        )

    home = home.replace(
        destruct_marker,
        destruct_replacement,
        1,
    )

    # Inserir reaction antes de companionMessage
    message_marker = '''  const companionMessage = useMemo(() => {'''

    reaction_block = '''  /**
   * A3.2
   *
   * A criatura não volta a analisar dados.
   * Apenas traduz o resultado já produzido pelo
   * Reactive Engine.
   */
  const companionReaction = useMemo(() => {
    if (!reactiveResult) {
      return null;
    }

    return resolveCompanionReaction(
      reactiveResult
    );
  }, [reactiveResult]);

  const companionMessage = useMemo(() => {'''

    if "const companionReaction = useMemo" not in home:
        if message_marker not in home:
            raise RuntimeError(
                "companionMessage não encontrado"
            )

        home = home.replace(
            message_marker,
            reaction_block,
            1,
        )

    # Dar prioridade à frase selecionada pelo motor.
    old_message_start = '''  const companionMessage = useMemo(() => {
    if (
      avatarMemoryMessage &&
      avatarMemoryMessage.trim().length > 0
    ) {
      return avatarMemoryMessage;
    }'''

    new_message_start = '''  const companionMessage = useMemo(() => {
    if (
      companionReaction?.response?.translationKey
    ) {
      return t(
        companionReaction.response.translationKey
      );
    }

    if (
      avatarMemoryMessage &&
      avatarMemoryMessage.trim().length > 0
    ) {
      return avatarMemoryMessage;
    }'''

    if old_message_start not in home:
        raise RuntimeError(
            "início de companionMessage não encontrado"
        )

    home = home.replace(
        old_message_start,
        new_message_start,
        1,
    )

    # Dependência do memo
    old_dep_start = '''  }, [
    avatar.level,
    avatarMemoryMessage,
    currentMoodRating,
    t,
  ]);'''

    new_dep_start = '''  }, [
    avatar.level,
    avatarMemoryMessage,
    companionReaction,
    currentMoodRating,
    t,
  ]);'''

    if old_dep_start not in home:
        raise RuntimeError(
            "dependências de companionMessage "
            "não encontradas"
        )

    home = home.replace(
        old_dep_start,
        new_dep_start,
        1,
    )

    # Passar reactionState ao Avatar
    avatar_marker = '''          memoryMessage={avatarMemoryMessage}
          companionWorldMood={worldMood}
        />'''

    avatar_replacement = '''          memoryMessage={avatarMemoryMessage}
          companionWorldMood={worldMood}
          reactionState={
            companionReaction?.state
          }
        />'''

    if avatar_marker not in home:
        raise RuntimeError(
            "props do Avatar não encontradas"
        )

    home = home.replace(
        avatar_marker,
        avatar_replacement,
        1,
    )

    # ========================================================
    # 3. AVATAR.TSX
    # ========================================================

    # Importar apenas o tipo.
    # Colocamos junto ao import da criatura.
    creature_import_candidates = [
        'import ConfiaCreature, { type ConfiaCreatureState } from "./Companheiro/ConfiaCreature";',
        'import ConfiaCreature from "./Companheiro/ConfiaCreature";',
        'import { ConfiaCreature } from "./Companheiro/ConfiaCreature";',
    ]

    creature_import = None

    for candidate in creature_import_candidates:
        if candidate in avatar:
            creature_import = candidate
            break

    if creature_import is None:
        raise RuntimeError(
            "import de ConfiaCreature não encontrado"
        )

    reaction_type_import = '''import type {
  CompanionReactionState,
} from "./data/reactive/companionReactionEngine";'''

    # O caminho acima estaria errado a partir de components.
    # Corrigir para ../data.
    reaction_type_import = '''import type {
  CompanionReactionState,
} from "../data/reactive/companionReactionEngine";'''

    if "CompanionReactionState" not in avatar:
        avatar = avatar.replace(
            creature_import,
            creature_import + "\n" + reaction_type_import,
            1,
        )

    # Adicionar prop opcional.
    #
    # Encontrar companionWorldMood na interface.
    match = re.search(
        r'(companionWorldMood\?\s*:\s*[^;]+;)',
        avatar,
    )

    if not match:
        raise RuntimeError(
            "prop companionWorldMood não encontrada "
            "na interface AvatarProps"
        )

    if "reactionState?: CompanionReactionState;" not in avatar:
        avatar = (
            avatar[:match.end()]
            + "\n  reactionState?: CompanionReactionState;"
            + avatar[match.end():]
        )

    # Adicionar à desestruturação.
    #
    # O nome companionWorldMood deve aparecer também
    # nos argumentos do componente.
    component_start = avatar.find(
        "const AvatarComponent: React.FC<AvatarProps> = ({"
    )

    if component_start == -1:
        raise RuntimeError(
            "AvatarComponent real não encontrado"
        )

    props_area_end = avatar.find(
        "}) => {",
        component_start,
    )

    if props_area_end == -1:
        raise RuntimeError(
            "fim real das props AvatarComponent não encontrado"
        )

    props_area = avatar[
        component_start:props_area_end
    ]

    if "reactionState" not in props_area:
        old_destruct_world = (
            '  companionWorldMood = "neutral"'
        )

        new_destruct_world = (
            '  companionWorldMood = "neutral",\n'
            '  reactionState'
        )

        if old_destruct_world not in props_area:
            raise RuntimeError(
                "companionWorldMood real não encontrado "
                "na desestruturação"
            )

        absolute_old = avatar.find(
            old_destruct_world,
            component_start,
            props_area_end,
        )

        if absolute_old == -1:
            raise RuntimeError(
                "posição de companionWorldMood não encontrada"
            )

        avatar = (
            avatar[:absolute_old]
            + new_destruct_world
            + avatar[
                absolute_old
                + len(old_destruct_world):
            ]
        )

    # ========================================================
    # CREATURE STATE
    #
    # Preservar celebração explícita de level-up.
    # Depois, usar o Reaction Engine.
    # Só depois usar fallback antigo.
    # ========================================================

    old_creature_state = '''  const creatureState: ConfiaCreatureState =
    levelUpTrigger || celebrating
      ? "celebrating"
      : moodRating !== undefined && moodRating <= 3
        ? "supportive"
        : companionWorldMood === "discovering"
          ? "curious"
          : companionWorldMood === "growing"
            ? "welcoming"
            : "neutral";
'''

    new_creature_state = '''  const creatureState: ConfiaCreatureState =
    levelUpTrigger || celebrating
      ? "celebrating"
      : reactionState ??
        (
          moodRating !== undefined && moodRating <= 3
            ? "supportive"
            : companionWorldMood === "discovering"
              ? "curious"
              : companionWorldMood === "growing"
                ? "welcoming"
                : "neutral"
        );
'''

    if old_creature_state not in avatar:
        raise RuntimeError(
            "bloco literal real de creatureState não encontrado"
        )

    avatar = avatar.replace(
        old_creature_state,
        new_creature_state,
        1,
    )

    # ========================================================
    # ESCREVER
    # ========================================================

    APP.write_text(app, encoding="utf-8")
    HOME.write_text(home, encoding="utf-8")
    AVATAR.write_text(avatar, encoding="utf-8")

    # ========================================================
    # VALIDAÇÃO FINAL
    # ========================================================

    final_app = APP.read_text(encoding="utf-8")
    final_home = HOME.read_text(encoding="utf-8")
    final_avatar = AVATAR.read_text(encoding="utf-8")

    checks = {
        "Resultado geral criado":
            "const homeReactiveResult = (() => {"
            in final_app,

        "General chamado apenas uma vez no bloco Home":
            "const result = homeReactiveResult;"
            in final_app,

        "Resultado passado ao Companion":
            "reactiveResult={homeReactiveResult}"
            in final_app,

        "Companion recebe ReactiveResult":
            "reactiveResult: ReactiveResult | null;"
            in final_home,

        "Resolver ligado":
            "resolveCompanionReaction"
            in final_home,

        "Reação calculada":
            "const companionReaction = useMemo"
            in final_home,

        "Balão usa resposta do motor":
            "companionReaction.response.translationKey"
            in final_home,

        "Avatar recebe reação":
            "reactionState={"
            in final_home,

        "Avatar aceita reação":
            "reactionState?: CompanionReactionState;"
            in final_avatar,

        "Reaction state controla criatura":
            "reactionState ??"
            in final_avatar,

        "Celebração explícita preservada":
            "levelUpTrigger || celebrating"
            in final_avatar,

        "Toque preservado":
            "onClick={handleInteraction}"
            in final_avatar,

        "Criatura preservada":
            "<ConfiaCreature"
            in final_avatar,

        "Sem novo localStorage no reaction engine":
            "localStorage.getItem("
            not in Path(
                "src/data/reactive/companionReactionEngine.ts"
            ).read_text(encoding="utf-8"),

        "Sem timer novo no CompanionHome":
            "setTimeout("
            not in final_home,

        "Sem rAF no CompanionHome":
            "requestAnimationFrame("
            not in final_home,

        "Sem canvas no CompanionHome":
            "<canvas"
            not in final_home,
    }

    failed = [
        name
        for name, ok in checks.items()
        if not ok
    ]

    if failed:
        raise RuntimeError(
            "Validação final falhou:\n - "
            + "\n - ".join(failed)
        )

except Exception as exc:
    shutil.copy2(BACKUP_APP, APP)
    shutil.copy2(BACKUP_HOME, HOME)
    shutil.copy2(BACKUP_AVATAR, AVATAR)

    print("ERRO:", exc)
    print()
    print("Os três ficheiros foram restaurados.")
    sys.exit(1)

print("=" * 76)
print("CONFIA — COMPANHEIRO PREMIUM A3.2")
print("=" * 76)
print()
print("✓ Reactive Engine ligado ao companheiro")
print("✓ Uma única análise geral partilhada")
print("✓ homeNowAction continua a usar o mesmo cérebro")
print("✓ Companion Reaction Engine ligado")
print("✓ Situação controla expressão da criatura")
print("✓ Resposta do Reactive Engine controla o balão")
print("✓ mood_low -> criatura supportive")
print("✓ mood_improving -> criatura celebrating")
print("✓ objective_completed -> criatura celebrating")
print("✓ return_after_absence -> criatura welcoming")
print("✓ multiple_signals -> criatura curious")
print("✓ mood_stable -> criatura neutral")
print("✓ Celebração de level-up continua prioritária")
print("✓ avatarMemoryMessage mantido como fallback")
print("✓ Mensagens antigas de nível mantidas como fallback")
print("✓ Toque no companheiro preservado")
print("✓ XP e evolução preservados")
print("✓ Loja e inventário não alterados")
print("✓ Navegação não alterada")
print("✓ Nenhum localStorage novo")
print("✓ Nenhum timer novo no CompanionHome")
print("✓ Nenhum requestAnimationFrame")
print("✓ Nenhum canvas")
print("✓ Nenhuma dependência nova")
print()
print("Backups:")
print(f"  {BACKUP_APP}")
print(f"  {BACKUP_HOME}")
print(f"  {BACKUP_AVATAR}")
print()
print("A3.2 aplicado.")
print("=" * 76)
