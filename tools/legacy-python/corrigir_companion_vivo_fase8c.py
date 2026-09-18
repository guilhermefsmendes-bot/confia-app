from pathlib import Path
from datetime import datetime
import shutil
import json
import re

ROOT = Path("src")

APP = ROOT / "App.tsx"
BRAIN = ROOT / "data/reactive/companionBrain"

CONTEXT = BRAIN / "companionBrainContext.ts"
RULES = BRAIN / "companionBrainRules.ts"
ENGINE = BRAIN / "companionBrainDecisionEngine.ts"

LOCALES = {
    "pt": ROOT / "locales/pt.json",
    "en": ROOT / "locales/en.json",
    "es": ROOT / "locales/es.json",
    "fr": ROOT / "locales/fr.json",
}

FILES = [
    APP,
    CONTEXT,
    RULES,
    ENGINE,
    *LOCALES.values(),
]

for path in FILES:
    if not path.exists():
        raise SystemExit(
            f"ERRO: ficheiro não encontrado: {path}"
        )

stamp = datetime.now().strftime("%Y%m%d_%H%M%S")

for path in FILES:
    backup = path.with_name(
        f"{path.name}.before_fix_companion_vivo_8c_{stamp}"
    )
    shutil.copy2(path, backup)


# ============================================================
# 1. CONTEXTO
#    O primeiro script pode já ter feito esta parte.
# ============================================================

context_text = CONTEXT.read_text(
    encoding="utf-8"
)

if "latestInteractionEvent" not in context_text:

    if "CompanionBrainEvent" not in context_text:
        context_text = (
            'import type { CompanionBrainEvent } '
            'from "./companionBrainTypes";\n'
            + context_text
        )

    interface_anchor = re.search(
        r'(\s*sessionActivityCount\s*:\s*number\s*;)',
        context_text,
    )

    if not interface_anchor:
        raise SystemExit(
            "ERRO: não encontrei sessionActivityCount "
            "na interface CompanionBrainContext."
        )

    pos = interface_anchor.end()

    context_text = (
        context_text[:pos]
        + """

  /**
   * Última interação humana relevante observada
   * pelo Companion Brain.
   */
  latestInteractionEvent?: CompanionBrainEvent;"""
        + context_text[pos:]
    )

    # Se o builder for explícito, tentar acrescentar o valor.
    explicit_patterns = [
        (
            r'(sessionActivityCount\s*:\s*'
            r'input\.sessionActivityCount\s*\?\?\s*0\s*,?)',
            r'\1\n'
            r'    latestInteractionEvent: '
            r'input.latestInteractionEvent,',
        ),
        (
            r'(sessionActivityCount\s*:\s*'
            r'input\.sessionActivityCount\s*,?)',
            r'\1\n'
            r'    latestInteractionEvent: '
            r'input.latestInteractionEvent,',
        ),
    ]

    builder_changed = False

    for pattern, replacement in explicit_patterns:
        new_text, count = re.subn(
            pattern,
            replacement,
            context_text,
            count=1,
        )

        if count:
            context_text = new_text
            builder_changed = True
            break

    # Se usa spread de input, a propriedade já passa.
    if (
        not builder_changed
        and "...input" not in context_text
    ):
        print(
            "AVISO: propriedade adicionada à interface, "
            "mas não foi necessário/possível alterar "
            "explicitamente o builder."
        )

    CONTEXT.write_text(
        context_text,
        encoding="utf-8",
    )


# ============================================================
# 2. APP — IMPORT
# ============================================================

app_text = APP.read_text(
    encoding="utf-8"
)

if "getRecentCompanionBrainEvents" not in app_text:
    import_anchor = (
        'import { emitCompanionBrainEvent } '
        'from "./data/reactive/companionBrain";'
    )

    if import_anchor in app_text:
        app_text = app_text.replace(
            import_anchor,
            import_anchor
            + '\n'
            + 'import { getRecentCompanionBrainEvents } '
              'from "./data/reactive/companionBrain";',
            1,
        )
    else:
        # Fallback robusto: inserir antes do primeiro import
        first_import = re.search(
            r'^import .*?;$',
            app_text,
            re.MULTILINE,
        )

        if not first_import:
            raise SystemExit(
                "ERRO: não consegui localizar os imports "
                "do App.tsx."
            )

        app_text = (
            app_text[:first_import.start()]
            + 'import { getRecentCompanionBrainEvents } '
              'from "./data/reactive/companionBrain";\n'
            + app_text[first_import.start():]
        )


# ============================================================
# 3. APP — ÚLTIMO EVENTO DE INTERAÇÃO
#
# Não dependemos agora do formato exato de recentImpulse.
# Inserimos imediatamente antes de sessionActivityCount.
# ============================================================

if "latestInteractionEvent:" not in app_text:

    session_match = re.search(
        r'(\n\s*sessionActivityCount\s*:)',
        app_text,
    )

    if not session_match:
        raise SystemExit(
            "ERRO: não encontrei sessionActivityCount "
            "no contexto da Home."
        )

    insertion = """

    /**
     * CONFIA — COMPANION VIVO 8C
     *
     * Última interação humana relevante dos
     * últimos 10 minutos.
     *
     * O ID do evento distingue um clique verdadeiro
     * de um simples render do React.
     */
    latestInteractionEvent:
      getRecentCompanionBrainEvents(10)
        .filter(event =>
          event.type === "avatar_tapped" ||
          event.type === "home_returned"
        )
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() -
            new Date(a.timestamp).getTime()
        )[0],
"""

    app_text = (
        app_text[:session_match.start()]
        + insertion
        + app_text[session_match.start():]
    )

APP.write_text(
    app_text,
    encoding="utf-8",
)


# ============================================================
# 4. RULES — HELPER DE VARIANTES
# ============================================================

rules_text = RULES.read_text(
    encoding="utf-8"
)

if "function selectCompanionVariant" not in rules_text:

    marker = "export function buildCompanionCandidates"

    if marker not in rules_text:
        raise SystemExit(
            "ERRO: buildCompanionCandidates "
            "não encontrado."
        )

    helper = """
/**
 * ============================================================
 * CONFIA — COMPANION VIVO
 * FASE 8C — VARIANTES ESTÁVEIS
 * ============================================================
 *
 * O mesmo evento escolhe sempre a mesma variante.
 * Um novo evento possui outro ID e pode escolher
 * outra frase.
 */
function selectCompanionVariant(
  eventId: string,
  translationKeys: string[]
): string {
  let hash = 0;

  for (let i = 0; i < eventId.length; i += 1) {
    hash =
      ((hash << 5) - hash) +
      eventId.charCodeAt(i);

    hash |= 0;
  }

  return translationKeys[
    Math.abs(hash) % translationKeys.length
  ];
}

"""

    rules_text = rules_text.replace(
        marker,
        helper + marker,
        1,
    )


# ============================================================
# 5. RULES — MICRO-REAÇÕES
# ============================================================

if "CONFIA_COMPANION_MICRO_INTERACTION_RULES" not in rules_text:

    candidates_match = re.search(
        r'const\s+candidates\s*:\s*'
        r'CompanionBrainCandidate\[\]\s*=\s*\[\s*\]\s*;',
        rules_text,
    )

    if not candidates_match:
        raise SystemExit(
            "ERRO: const candidates não encontrado "
            "em companionBrainRules.ts."
        )

    micro_rules = """

  // CONFIA_COMPANION_MICRO_INTERACTION_RULES
  /**
   * Micro-reações de interação.
   *
   * Prioridade deliberadamente baixa:
   * situações emocionais importantes continuam
   * sempre à frente.
   */
  const interaction =
    context.latestInteractionEvent;

  if (
    interaction?.type === "avatar_tapped"
  ) {
    candidates.push({
      id:
        `avatar_tapped_micro:${interaction.id}`,

      translationKey:
        selectCompanionVariant(
          interaction.id,
          [
            "companionBrain.avatarTapped1",
            "companionBrain.avatarTapped2",
            "companionBrain.avatarTapped3",
            "companionBrain.avatarTapped4",
          ]
        ),

      category: "casual",
      emotion: "warm",
      priority: 30,

      reason:
        "The user directly interacted with the companion.",

      cooldownMinutes: 10,

      metadata: {
        microInteraction: true,
        eventId: interaction.id,
      },
    });
  }

  if (
    interaction?.type === "home_returned"
  ) {
    const from =
      typeof interaction.metadata?.from === "string"
        ? interaction.metadata.from
        : undefined;

    const variantsBySource:
      Record<string, string[]> = {

        patterns: [
          "companionBrain.returnedPatterns1",
          "companionBrain.returnedPatterns2",
          "companionBrain.returnedPatterns3",
        ],

        progress: [
          "companionBrain.returnedProgress1",
          "companionBrain.returnedProgress2",
          "companionBrain.returnedProgress3",
        ],

        companion: [
          "companionBrain.returnedCompanion1",
          "companionBrain.returnedCompanion2",
          "companionBrain.returnedCompanion3",
        ],

        shop: [
          "companionBrain.returnedShop1",
          "companionBrain.returnedShop2",
          "companionBrain.returnedShop3",
        ],

        inventory: [
          "companionBrain.returnedInventory1",
          "companionBrain.returnedInventory2",
          "companionBrain.returnedInventory3",
        ],
      };

    const variants =
      from
        ? variantsBySource[from]
        : undefined;

    if (variants) {
      candidates.push({
        id:
          `home_returned_${from}:${interaction.id}`,

        translationKey:
          selectCompanionVariant(
            interaction.id,
            variants
          ),

        category:
          from === "patterns"
            ? "discovery"
            : from === "progress"
              ? "progress"
              : "casual",

        emotion: "warm",

        priority:
          from === "patterns" ||
          from === "progress"
            ? 32
            : 28,

        reason:
          `The user returned home from ${from}.`,

        cooldownMinutes: 10,

        metadata: {
          microInteraction: true,
          eventId: interaction.id,
          from,
        },
      });
    }
  }
"""

    pos = candidates_match.end()

    rules_text = (
        rules_text[:pos]
        + micro_rules
        + rules_text[pos:]
    )

RULES.write_text(
    rules_text,
    encoding="utf-8",
)


# ============================================================
# 6. DECISION ENGINE
#
# Eventos reais diferentes não devem ser bloqueados
# pelo cooldown geral da categoria.
# ============================================================

engine_text = ENGINE.read_text(
    encoding="utf-8"
)

if "CONFIA_MICRO_INTERACTION_CATEGORY_COOLDOWN" not in engine_text:

    category_pattern = re.compile(
        r'if\s*\(\s*'
        r'wasCompanionCategoryShownRecently\s*\(\s*'
        r'candidate\.category\s*,\s*'
        r'CATEGORY_COOLDOWN_MINUTES\s*'
        r'\)\s*'
        r'\)\s*\{\s*'
        r'return false;\s*'
        r'\}',
        re.MULTILINE,
    )

    category_match = category_pattern.search(
        engine_text
    )

    if not category_match:
        raise SystemExit(
            "ERRO: não encontrei o cooldown "
            "de categoria no Decision Engine."
        )

    replacement = """// CONFIA_MICRO_INTERACTION_CATEGORY_COOLDOWN
  const isMicroInteraction =
    candidate.metadata?.microInteraction === true;

  if (
    !isMicroInteraction &&
    wasCompanionCategoryShownRecently(
      candidate.category,
      CATEGORY_COOLDOWN_MINUTES
    )
  ) {
    return false;
  }"""

    engine_text = (
        engine_text[:category_match.start()]
        + replacement
        + engine_text[category_match.end():]
    )

ENGINE.write_text(
    engine_text,
    encoding="utf-8",
)


# ============================================================
# 7. TRADUÇÕES — PT / EN / ES / FR
# ============================================================

translations = {
    "pt": {
        "companionBrain.avatarTapped1":
            "Estou por aqui.",

        "companionBrain.avatarTapped2":
            "Olá outra vez. Como estás agora?",

        "companionBrain.avatarTapped3":
            "Estou contigo. Há alguma coisa a ocupar-te a cabeça?",

        "companionBrain.avatarTapped4":
            "Sim, estou a prestar atenção.",

        "companionBrain.returnedPatterns1":
            "Encontraste alguma coisa nos teus padrões que te tenha chamado a atenção?",

        "companionBrain.returnedPatterns2":
            "Às vezes um padrão só se torna claro quando paramos para olhar.",

        "companionBrain.returnedPatterns3":
            "Viste alguma coisa sobre os teus dias que ainda não tinhas reparado?",

        "companionBrain.returnedProgress1":
            "Olhar para o caminho percorrido também conta. Notaste alguma mudança?",

        "companionBrain.returnedProgress2":
            "Às vezes o progresso aparece devagar. Houve alguma coisa que te surpreendeu?",

        "companionBrain.returnedProgress3":
            "Já viste o teu percurso. Há alguma pequena evolução que mereça ser reconhecida?",

        "companionBrain.returnedCompanion1":
            "Cá estamos outra vez.",

        "companionBrain.returnedCompanion2":
            "Gostei da visita.",

        "companionBrain.returnedCompanion3":
            "Continuo por aqui contigo.",

        "companionBrain.returnedShop1":
            "Andaste a ver algumas coisas novas para mim?",

        "companionBrain.returnedShop2":
            "Vi que passaste pela loja.",

        "companionBrain.returnedShop3":
            "Alguma coisa te chamou a atenção por lá?",

        "companionBrain.returnedInventory1":
            "Foste espreitar o que já temos?",

        "companionBrain.returnedInventory2":
            "Vi que estiveste a organizar as nossas coisas.",

        "companionBrain.returnedInventory3":
            "Já viste tudo o que fomos juntando?",
    },

    "en": {
        "companionBrain.avatarTapped1":
            "I'm here.",

        "companionBrain.avatarTapped2":
            "Hi again. How are you feeling right now?",

        "companionBrain.avatarTapped3":
            "I'm with you. Is something on your mind?",

        "companionBrain.avatarTapped4":
            "Yes, I'm paying attention.",

        "companionBrain.returnedPatterns1":
            "Did you notice anything in your patterns that caught your attention?",

        "companionBrain.returnedPatterns2":
            "Sometimes a pattern only becomes clear when we stop and look.",

        "companionBrain.returnedPatterns3":
            "Did you notice anything about your days that you hadn't seen before?",

        "companionBrain.returnedProgress1":
            "Looking back at how far you've come matters too. Did you notice any change?",

        "companionBrain.returnedProgress2":
            "Progress can show up slowly. Did anything surprise you?",

        "companionBrain.returnedProgress3":
            "You've looked at your journey. Is there a small improvement worth noticing?",

        "companionBrain.returnedCompanion1":
            "Here we are again.",

        "companionBrain.returnedCompanion2":
            "I liked the visit.",

        "companionBrain.returnedCompanion3":
            "I'm still here with you.",

        "companionBrain.returnedShop1":
            "Were you looking at something new for me?",

        "companionBrain.returnedShop2":
            "I noticed you stopped by the shop.",

        "companionBrain.returnedShop3":
            "Did anything catch your eye there?",

        "companionBrain.returnedInventory1":
            "Were you checking what we already have?",

        "companionBrain.returnedInventory2":
            "I noticed you were looking through our things.",

        "companionBrain.returnedInventory3":
            "Have you seen everything we've collected so far?",
    },

    "es": {
        "companionBrain.avatarTapped1":
            "Estoy por aquí.",

        "companionBrain.avatarTapped2":
            "Hola otra vez. ¿Cómo estás ahora?",

        "companionBrain.avatarTapped3":
            "Estoy contigo. ¿Hay algo que te esté rondando la cabeza?",

        "companionBrain.avatarTapped4":
            "Sí, te estoy prestando atención.",

        "companionBrain.returnedPatterns1":
            "¿Has encontrado algo en tus patrones que te haya llamado la atención?",

        "companionBrain.returnedPatterns2":
            "A veces un patrón solo se vuelve claro cuando nos detenemos a observar.",

        "companionBrain.returnedPatterns3":
            "¿Has visto algo sobre tus días que antes no habías notado?",

        "companionBrain.returnedProgress1":
            "Mirar el camino recorrido también cuenta. ¿Has notado algún cambio?",

        "companionBrain.returnedProgress2":
            "A veces el progreso aparece poco a poco. ¿Algo te sorprendió?",

        "companionBrain.returnedProgress3":
            "Ya has mirado tu recorrido. ¿Hay alguna pequeña mejora que merezca ser reconocida?",

        "companionBrain.returnedCompanion1":
            "Aquí estamos otra vez.",

        "companionBrain.returnedCompanion2":
            "Me ha gustado la visita.",

        "companionBrain.returnedCompanion3":
            "Sigo aquí contigo.",

        "companionBrain.returnedShop1":
            "¿Estabas mirando algo nuevo para mí?",

        "companionBrain.returnedShop2":
            "He visto que pasaste por la tienda.",

        "companionBrain.returnedShop3":
            "¿Algo te llamó la atención por allí?",

        "companionBrain.returnedInventory1":
            "¿Fuiste a mirar lo que ya tenemos?",

        "companionBrain.returnedInventory2":
            "He visto que estabas revisando nuestras cosas.",

        "companionBrain.returnedInventory3":
            "¿Ya has visto todo lo que hemos ido reuniendo?",
    },

    "fr": {
        "companionBrain.avatarTapped1":
            "Je suis là.",

        "companionBrain.avatarTapped2":
            "Rebonjour. Comment te sens-tu maintenant ?",

        "companionBrain.avatarTapped3":
            "Je suis avec toi. Quelque chose t'occupe l'esprit ?",

        "companionBrain.avatarTapped4":
            "Oui, je t'écoute.",

        "companionBrain.returnedPatterns1":
            "As-tu remarqué quelque chose dans tes schémas qui a attiré ton attention ?",

        "companionBrain.returnedPatterns2":
            "Parfois, un schéma devient clair seulement quand on prend le temps de l'observer.",

        "companionBrain.returnedPatterns3":
            "As-tu remarqué quelque chose dans tes journées que tu n'avais pas vu auparavant ?",

        "companionBrain.returnedProgress1":
            "Regarder le chemin parcouru compte aussi. As-tu remarqué un changement ?",

        "companionBrain.returnedProgress2":
            "Le progrès apparaît parfois doucement. Quelque chose t'a surpris ?",

        "companionBrain.returnedProgress3":
            "Tu as regardé ton parcours. Y a-t-il une petite évolution qui mérite d'être reconnue ?",

        "companionBrain.returnedCompanion1":
            "Nous revoilà.",

        "companionBrain.returnedCompanion2":
            "J'ai aimé ta visite.",

        "companionBrain.returnedCompanion3":
            "Je suis toujours là avec toi.",

        "companionBrain.returnedShop1":
            "Tu regardais quelque chose de nouveau pour moi ?",

        "companionBrain.returnedShop2":
            "J'ai vu que tu étais passé par la boutique.",

        "companionBrain.returnedShop3":
            "Quelque chose a attiré ton attention là-bas ?",

        "companionBrain.returnedInventory1":
            "Tu es allé voir ce que nous avons déjà ?",

        "companionBrain.returnedInventory2":
            "J'ai vu que tu regardais nos affaires.",

        "companionBrain.returnedInventory3":
            "As-tu vu tout ce que nous avons rassemblé jusqu'ici ?",
    },
}


for lang, path in LOCALES.items():

    data = json.loads(
        path.read_text(encoding="utf-8")
    )

    for key, value in translations[lang].items():
        data[key] = value

    path.write_text(
        json.dumps(
            data,
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )


# ============================================================
# 8. VERIFICAÇÃO
# ============================================================

app_check = APP.read_text(encoding="utf-8")
context_check = CONTEXT.read_text(encoding="utf-8")
rules_check = RULES.read_text(encoding="utf-8")
engine_check = ENGINE.read_text(encoding="utf-8")

checks = [
    (
        "latestInteractionEvent context",
        "latestInteractionEvent"
        in context_check,
    ),
    (
        "getRecentCompanionBrainEvents",
        "getRecentCompanionBrainEvents"
        in app_check,
    ),
    (
        "latestInteractionEvent App",
        "latestInteractionEvent:"
        in app_check,
    ),
    (
        "variant selector",
        "function selectCompanionVariant"
        in rules_check,
    ),
    (
        "avatar micro",
        "avatar_tapped_micro"
        in rules_check,
    ),
    (
        "home returned",
        "home_returned_${from}"
        in rules_check,
    ),
    (
        "micro cooldown",
        "CONFIA_MICRO_INTERACTION_CATEGORY_COOLDOWN"
        in engine_check,
    ),
]

failed = [
    name
    for name, ok in checks
    if not ok
]

if failed:
    raise SystemExit(
        "ERRO FINAL: "
        + ", ".join(failed)
    )


print()
print("=" * 72)
print("CONFIA — COMPANION VIVO — FASE 8C CORRIGIDA")
print("=" * 72)
print("✓ Alteração parcial anterior respeitada")
print("✓ Contexto suporta latestInteractionEvent")
print("✓ App lê o último evento real")
print("✓ avatar_tapped gera candidato de micro-reação")
print("✓ home_returned conhece a área de origem")
print("✓ Padrões tem frases próprias")
print("✓ Progresso tem frases próprias")
print("✓ Companion tem frases próprias")
print("✓ Loja tem frases próprias")
print("✓ Inventário tem frases próprias")
print("✓ Cada evento tem identidade própria")
print("✓ Variante é estável durante renders")
print("✓ Novo evento pode gerar outra variante")
print("✓ Micro-reações escapam apenas ao cooldown global da categoria")
print("✓ Prioridades emocionais continuam superiores")
print("✓ PT / EN / ES / FR atualizados")
print("✓ Backups criados")
print()
print("FASE 8C corrigida e concluída.")
