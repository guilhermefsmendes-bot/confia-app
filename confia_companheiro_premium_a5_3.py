from pathlib import Path
import shutil
import sys

HOME = Path(
    "src/components/Companheiro/ConfiaCompanionHome.tsx"
)
AVATAR = Path(
    "src/components/Avatar.tsx"
)
CREATURE = Path(
    "src/components/Companheiro/ConfiaCreature.tsx"
)

files = [HOME, AVATAR, CREATURE]

for path in files:
    if not path.exists():
        print(f"ERRO: {path} não encontrado")
        sys.exit(1)

backups = {
    HOME: Path(
        "/tmp/ConfiaCompanionHome.tsx.before_premium_a5_3"
    ),
    AVATAR: Path(
        "/tmp/Avatar.tsx.before_companheiro_premium_a5_3"
    ),
    CREATURE: Path(
        "/tmp/ConfiaCreature.tsx.before_premium_a5_3"
    ),
}

for path, backup in backups.items():
    shutil.copy2(path, backup)

home = HOME.read_text(encoding="utf-8")
avatar = AVATAR.read_text(encoding="utf-8")
creature = CREATURE.read_text(encoding="utf-8")

try:

    # ==========================================================
    # 1. COMPANION HOME — LER EQUIPAMENTO EXISTENTE
    # ==========================================================

    if (
        'from "../../storage/homeInventory"'
        not in home
    ):
        marker = (
            'import {\n'
            '  resolveCompanionReaction,\n'
            '} from "../../data/reactive/'
            'companionReactionEngine";'
        )

        if marker not in home:
            raise RuntimeError(
                "Import marker de CompanionHome não encontrado"
            )

        replacement = (
            marker
            + '\nimport { getEquipped } '
              'from "../../storage/homeInventory";'
        )

        home = home.replace(
            marker,
            replacement,
            1
        )

    if "equippedAccessoryIds" not in home:

        marker = (
            "  const { t } = useTranslation();"
        )

        if marker not in home:
            raise RuntimeError(
                "useTranslation marker não encontrado"
            )

        replacement = '''  const { t } = useTranslation();

  /**
   * A5.3 — acessórios visuais da CONFIA.
   *
   * home_equipped continua a ser a única fonte persistente.
   * IDs legacy e troféus são ignorados pela criatura.
   */
  const equippedAccessoryIds = getEquipped().filter(
    id =>
      id === "confia_bow_cream" ||
      id === "confia_scarf_terra" ||
      id === "confia_charm_gold"
  );'''

        home = home.replace(
            marker,
            replacement,
            1
        )

    avatar_call_marker = '''          reactionState={
            companionReaction?.state
          }
        />'''

    if avatar_call_marker not in home:
        raise RuntimeError(
            "Chamada Avatar esperada não encontrada"
        )

    avatar_call_replacement = '''          reactionState={
            companionReaction?.state
          }
          equippedAccessoryIds={
            equippedAccessoryIds
          }
        />'''

    home = home.replace(
        avatar_call_marker,
        avatar_call_replacement,
        1
    )

    # ==========================================================
    # 2. AVATAR — PROP NOVA
    # ==========================================================

    # Encontrar interface de props através de reactionState.
    if "equippedAccessoryIds?:" not in avatar:

        reaction_prop_candidates = [
            "  reactionState?: CompanionReactionState;\n",
            "  reactionState?: CompanionReactionState\n",
        ]

        inserted = False

        for marker in reaction_prop_candidates:
            if marker in avatar:
                suffix = (
                    ";\n"
                    if marker.endswith(";\n")
                    else "\n"
                )

                # Mantém a linha original e acrescenta nova prop.
                replacement = (
                    marker
                    + "  equippedAccessoryIds?: string[];"
                    + "\n"
                )

                avatar = avatar.replace(
                    marker,
                    replacement,
                    1
                )
                inserted = True
                break

        if not inserted:
            raise RuntimeError(
                "Prop reactionState no Avatar não encontrada"
            )

    # Adicionar à destructuring da função.
    if (
        "equippedAccessoryIds = []"
        not in avatar
    ):
        import re

        pattern = (
            r'(\breactionState\b)'
            r'(\s*)'
            r'(\}\)\s*=>\s*\{)'
        )

        match = re.search(pattern, avatar)

        if not match:
            raise RuntimeError(
                "reactionState no fim da destructuring "
                "não encontrado"
            )

        avatar = (
            avatar[:match.start()]
            + "reactionState,\n"
            + "  equippedAccessoryIds = []\n"
            + match.group(3)
            + avatar[match.end():]
        )

    # Encaminhar para ConfiaCreature.
    creature_call = '''  <ConfiaCreature
    level={avatar.level}
    state={creatureState}
    reacting={isJumping}
  />'''

    if creature_call not in avatar:
        raise RuntimeError(
            "Chamada ConfiaCreature não encontrada"
        )

    creature_call_new = '''  <ConfiaCreature
    level={avatar.level}
    state={creatureState}
    reacting={isJumping}
    equippedAccessoryIds={equippedAccessoryIds}
  />'''

    avatar = avatar.replace(
        creature_call,
        creature_call_new,
        1
    )

    # ==========================================================
    # 3. CONFIA CREATURE — PROP
    # ==========================================================

    props_marker = '''  interface ConfiaCreatureProps {
    level: number;
    state?: ConfiaCreatureState;
    reacting?: boolean;
  }'''

    # O ficheiro real não tem espaços antes de interface.
    props_marker = '''interface ConfiaCreatureProps {
    level: number;
    state?: ConfiaCreatureState;
    reacting?: boolean;
  }'''

    # Tentativa exata conforme descoberta.
    if props_marker not in creature:
        props_marker = '''interface ConfiaCreatureProps {
  level: number;
  state?: ConfiaCreatureState;
  reacting?: boolean;
}'''

    if props_marker not in creature:
        raise RuntimeError(
            "Interface ConfiaCreatureProps não encontrada"
        )

    props_new = '''interface ConfiaCreatureProps {
  level: number;
  state?: ConfiaCreatureState;
  reacting?: boolean;
  equippedAccessoryIds?: string[];
}'''

    creature = creature.replace(
        props_marker,
        props_new,
        1
    )

    destructuring_marker = '''function ConfiaCreature({
    level,
    state = "neutral",
    reacting = false,
  }: ConfiaCreatureProps) {'''

    if destructuring_marker not in creature:
        # Versão com dois espaços observada no ficheiro.
        destructuring_marker = '''function ConfiaCreature({
  level,
  state = "neutral",
  reacting = false,
}: ConfiaCreatureProps) {'''

    if destructuring_marker not in creature:
        raise RuntimeError(
            "Destructuring ConfiaCreature não encontrada"
        )

    destructuring_new = '''function ConfiaCreature({
  level,
  state = "neutral",
  reacting = false,
  equippedAccessoryIds = [],
}: ConfiaCreatureProps) {'''

    creature = creature.replace(
        destructuring_marker,
        destructuring_new,
        1
    )

    # ==========================================================
    # 4. FLAGS VISUAIS
    # ==========================================================

    if "const hasCreamBow" not in creature:

        marker = "  const isEgg = stage === 1;"

        if marker not in creature:
            raise RuntimeError(
                "isEgg marker não encontrado"
            )

        replacement = '''  const isEgg = stage === 1;

  /**
   * A5.3 — acessórios equipados.
   *
   * Apenas IDs conhecidos pela criatura produzem desenho.
   * Itens legacy/troféus permanecem invisíveis aqui.
   */
  const hasCreamBow =
    equippedAccessoryIds.includes(
      "confia_bow_cream"
    );

  const hasTerraScarf =
    equippedAccessoryIds.includes(
      "confia_scarf_terra"
    );

  const hasGoldCharm =
    equippedAccessoryIds.includes(
      "confia_charm_gold"
    );'''

        creature = creature.replace(
            marker,
            replacement,
            1
        )

    # ==========================================================
    # 5. DESENHAR ACESSÓRIOS NO MESMO SVG
    #
    # Inserimos imediatamente antes do fecho do grupo principal
    # da criatura, usando o bloco final de stage === 5 como
    # âncora estrutural.
    # ==========================================================

    if "A5.3 — ACESSÓRIOS DA CONFIA" not in creature:

        # Último fecho antes do </svg>.
        marker = '''          </g>
        )}
      </svg>'''

        if marker not in creature:
            raise RuntimeError(
                "Fecho final do SVG não encontrado"
            )

        accessories = '''          </g>
        )}

        {/* ===================================================
            A5.3 — ACESSÓRIOS DA CONFIA

            SVG estático.
            Sem imagens, partículas ou animação permanente.
        =================================================== */}

        {!isEgg && hasCreamBow && (
          <g
            aria-hidden="true"
            transform="translate(0 1)"
          >
            <path
              d="
                M78 55
                C68 48 62 51 64 59
                C66 66 72 68 80 62
                Z
              "
              fill="#F6E6D7"
              stroke="#B86F5B"
              strokeWidth="2"
            />

            <path
              d="
                M82 56
                C91 49 97 52 95 60
                C93 67 87 68 80 62
                Z
              "
              fill="#F6E6D7"
              stroke="#B86F5B"
              strokeWidth="2"
            />

            <ellipse
              cx="80"
              cy="60"
              rx="5.5"
              ry="5"
              fill="#D99A78"
              stroke="#B86F5B"
              strokeWidth="1.6"
            />
          </g>
        )}

        {!isEgg && hasTerraScarf && (
          <g aria-hidden="true">
            <path
              d="
                M78 127
                Q110 139 142 127
                Q139 139 110 143
                Q81 139 78 127
                Z
              "
              fill="#C97861"
              stroke="#A85C4B"
              strokeWidth="2"
              strokeLinejoin="round"
            />

            <path
              d="
                M124 137
                Q134 145 131 160
                L121 154
                Q125 145 124 137
                Z
              "
              fill="#B96855"
              stroke="#A85C4B"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
          </g>
        )}

        {!isEgg && hasGoldCharm && (
          <g aria-hidden="true">
            <path
              d="
                M91 130
                Q110 140 129 130
              "
              fill="none"
              stroke="#C79A45"
              strokeWidth="2"
              strokeLinecap="round"
            />

            <circle
              cx="110"
              cy="141"
              r="6"
              fill="#F2D487"
              stroke="#B88735"
              strokeWidth="1.8"
            />

            <path
              d="
                M110 137
                L111.5 140
                L115 140.5
                L112.5 143
                L113 146
                L110 144.5
                L107 146
                L107.5 143
                L105 140.5
                L108.5 140
                Z
              "
              fill="#FFF5C8"
            />
          </g>
        )}
      </svg>'''

        creature = creature.replace(
            marker,
            accessories,
            1
        )

    # ==========================================================
    # GUARDAR
    # ==========================================================

    HOME.write_text(home, encoding="utf-8")
    AVATAR.write_text(avatar, encoding="utf-8")
    CREATURE.write_text(creature, encoding="utf-8")

    final_home = HOME.read_text(encoding="utf-8")
    final_avatar = AVATAR.read_text(encoding="utf-8")
    final_creature = CREATURE.read_text(encoding="utf-8")

    checks = {
        "Home lê getEquipped":
            "getEquipped" in final_home,

        "Home filtra acessórios":
            'id === "confia_bow_cream"'
            in final_home
            and 'id === "confia_scarf_terra"'
            in final_home
            and 'id === "confia_charm_gold"'
            in final_home,

        "Home passa acessórios":
            "equippedAccessoryIds={"
            in final_home,

        "Avatar recebe prop":
            "equippedAccessoryIds?: string[]"
            in final_avatar,

        "Avatar encaminha prop":
            "equippedAccessoryIds={equippedAccessoryIds}"
            in final_avatar,

        "Creature recebe prop":
            "equippedAccessoryIds?: string[]"
            in final_creature,

        "Creature laço":
            "hasCreamBow"
            in final_creature,

        "Creature lenço":
            "hasTerraScarf"
            in final_creature,

        "Creature amuleto":
            "hasGoldCharm"
            in final_creature,

        "SVG acessórios":
            "A5.3 — ACESSÓRIOS DA CONFIA"
            in final_creature,

        "sem localStorage no SVG":
            "localStorage"
            not in final_creature,

        "sem timer novo Creature":
            "setTimeout("
            not in final_creature
            and "setInterval("
            not in final_creature,

        "sem rAF":
            "requestAnimationFrame("
            not in final_creature,

        "sem canvas":
            "<canvas"
            not in final_creature.lower(),
    }

    failed = [
        name
        for name, ok in checks.items()
        if not ok
    ]

    if failed:
        raise RuntimeError(
            "Validação falhou:\n - "
            + "\n - ".join(failed)
        )

except Exception as exc:

    for path, backup in backups.items():
        shutil.copy2(backup, path)

    print("ERRO:", exc)
    print()
    print(
        "Os três ficheiros foram restaurados."
    )
    sys.exit(1)


print("=" * 76)
print("CONFIA — COMPANHEIRO PREMIUM A5.3")
print("=" * 76)
print()
print("✓ home_equipped ligado à CONFIA")
print("✓ IDs legacy ignorados pela criatura")
print("✓ Laço Creme desenhado em SVG")
print("✓ Lenço Terracota desenhado em SVG")
print("✓ Amuleto Dourado desenhado em SVG")
print("✓ CompanionHome → Avatar → ConfiaCreature")
print("✓ Mesmo storage antigo")
print("✓ Sem novo estado persistente")
print("✓ Sem timers")
print("✓ Sem requestAnimationFrame")
print("✓ Sem canvas")
print("✓ Sem partículas")
print("✓ Sem dependências")
print()
print("Backups:")
for backup in backups.values():
    print(f"  {backup}")
print()
print("A5.3 aplicado.")
print("=" * 76)
