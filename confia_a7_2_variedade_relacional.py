from pathlib import Path
import json
import shutil
import sys


# ============================================================
# CONFIA — A7.2 — VARIEDADE RELACIONAL DETERMINÍSTICA
# ============================================================
#
# A6 decide QUAL memória factual pode ser mostrada.
# A7 decide apenas COMO essa memória é expressa.
#
# Proteções:
# - Reactive Engine intacto
# - A6 intacto
# - sem aleatoriedade
# - sem Date
# - sem novo histórico
# - sem novo storage
# - sem localStorage
# - sem timers
# - sem requestAnimationFrame
# - sem nível do avatar
# - PT / EN / ES / FR
#
# Traduções:
#
# companionRelationalMemory
# ├── learnedImpulse          <- A6
# ├── effectiveImpulse        <- A6
# ├── convergingSignals       <- A6
# ├── repeatedNeed            <- A6
# ├── moodImproving           <- A6
# ├── moodDeclining           <- A6
# ├── moodStable              <- A6
# ├── consistency             <- A6
# └── variants                <- A7
#     ├── learned_impulse
#     │   ├── a
#     │   ├── b
#     │   └── c
#     └── ...
#
# ============================================================


RESOLVER = Path(
    "src/data/reactive/companionRelationalMemory.ts"
)

COMPONENT = Path(
    "src/components/Companheiro/ConfiaCompanionHome.tsx"
)

LOCALES = {
    "pt": Path("src/locales/pt.json"),
    "en": Path("src/locales/en.json"),
    "es": Path("src/locales/es.json"),
    "fr": Path("src/locales/fr.json"),
}


BACKUPS = {
    RESOLVER:
        Path("/tmp/companionRelationalMemory.ts.before_a7_2"),

    COMPONENT:
        Path("/tmp/ConfiaCompanionHome.tsx.before_a7_2"),
}

for lang, path in LOCALES.items():
    BACKUPS[path] = Path(
        f"/tmp/{lang}.json.before_a7_2"
    )


def fail(message):
    print()
    print("ERRO:", message)
    print()
    print("Nenhuma alteração foi aplicada.")
    sys.exit(1)


# ============================================================
# 1. PRÉ-VALIDAÇÃO
# ============================================================

required_files = [
    RESOLVER,
    COMPONENT,
    *LOCALES.values(),
]

for path in required_files:
    if not path.exists():
        fail(
            f"Ficheiro não encontrado: {path}"
        )


resolver = RESOLVER.read_text(
    encoding="utf-8"
)

component = COMPONENT.read_text(
    encoding="utf-8"
)


if "resolveCompanionRelationalExpression" in resolver:
    fail(
        "A7.2 parece já estar aplicado em "
        "companionRelationalMemory.ts."
    )


if "companionRelationalExpression" in component:
    fail(
        "A7.2 parece já estar aplicado em "
        "ConfiaCompanionHome.tsx."
    )


# Validar JSON antes de alterar ficheiros.

for lang, path in LOCALES.items():

    try:
        data = json.loads(
            path.read_text(
                encoding="utf-8"
            )
        )
    except Exception as exc:
        fail(
            f"{lang}.json inválido: {exc}"
        )

    block = data.get(
        "companionRelationalMemory"
    )

    if not isinstance(block, dict):
        fail(
            f"{lang}: bloco "
            "companionRelationalMemory não encontrado."
        )

    if "variants" in block:
        fail(
            f"{lang}: bloco variants já existe. "
            "A7.2 pode já estar aplicado."
        )


# ============================================================
# 2. BACKUPS
# ============================================================

for source, backup in BACKUPS.items():
    shutil.copy2(
        source,
        backup
    )


try:

    # ========================================================
    # 3. TIPO DA EXPRESSÃO RELACIONAL
    # ========================================================

    interface_anchor = (
        "export interface "
        "CompanionRelationalMemoryResult {"
    )

    if interface_anchor not in resolver:
        raise RuntimeError(
            "Interface CompanionRelationalMemoryResult "
            "não encontrada."
        )


    expression_type = '''export interface CompanionRelationalExpression {
  translationKey: string;

  values?: Record<
    string,
    string | number
  >;
}


'''


    resolver = resolver.replace(
        interface_anchor,
        expression_type + interface_anchor,
        1
    )


    # ========================================================
    # 4. RESOLVER A7
    # ========================================================

    expression_resolver = r'''

/**
 * ============================================================
 * CONFIA — A7.2 — EXPRESSÃO RELACIONAL DETERMINÍSTICA
 * ============================================================
 *
 * Esta função NÃO escolhe o facto.
 *
 * O A6 continua responsável por decidir qual memória factual
 * é suficientemente sólida para poder ser apresentada.
 *
 * O A7 escolhe apenas COMO essa mesma verdade é expressa.
 *
 * Não cria:
 * - aleatoriedade;
 * - novo histórico;
 * - localStorage;
 * - timers;
 * - dependência de data/hora;
 * - dependência do nível do avatar;
 * - nova análise emocional.
 *
 * A mesma evidência produz sempre a mesma variante.
 */
export function resolveCompanionRelationalExpression(
  memory:
    | CompanionRelationalMemoryResult
    | null
    | undefined
): CompanionRelationalExpression | null {

  if (!memory) {
    return null;
  }

  let variant: "a" | "b" | "c" = "a";

  /**
   * A força factual é a primeira dimensão.
   *
   * soft:
   * linguagem cautelosa.
   *
   * clear:
   * observação mais direta.
   *
   * strong:
   * reconhecimento mais consolidado.
   */
  if (memory.strength === "clear") {
    variant = "b";
  }

  if (memory.strength === "strong") {
    variant = "c";
  }

  /**
   * Alguns factos possuem contagens reais.
   *
   * Dentro da mesma força factual, a quantidade
   * de evidência pode justificar uma formulação
   * mais consolidada.
   *
   * Continua a ser totalmente determinístico.
   */
  const countValue =
    typeof memory.values?.count === "number"
      ? memory.values.count
      : null;

  const daysValue =
    typeof memory.values?.days === "number"
      ? memory.values.days
      : null;

  if (
    memory.strength === "clear" &&
    countValue !== null &&
    countValue >= 4
  ) {
    variant = "c";
  }

  /**
   * Sete dias ativos representam a forma mais
   * consolidada da memória de consistência.
   */
  if (
    memory.kind === "consistency" &&
    daysValue !== null &&
    daysValue >= 7
  ) {
    variant = "c";
  }

  return {
    translationKey:
      `companionRelationalMemory.variants.${memory.kind}.${variant}`,

    values:
      memory.values,
  };
}
'''


    resolver = (
        resolver.rstrip()
        + expression_resolver
        + "\n"
    )


    # ========================================================
    # 5. IMPORT NO COMPONENTE
    # ========================================================

    old_import = '''import {
  resolveCompanionRelationalMemory,
  type CompanionRelationalMemoryResult,
} from "../../data/reactive/companionRelationalMemory";'''


    new_import = '''import {
  resolveCompanionRelationalMemory,
  resolveCompanionRelationalExpression,
  type CompanionRelationalMemoryResult,
} from "../../data/reactive/companionRelationalMemory";'''


    if old_import not in component:
        raise RuntimeError(
            "Import relacional atual não encontrado."
        )


    component = component.replace(
        old_import,
        new_import,
        1
    )


    # ========================================================
    # 6. CRIAR EXPRESSÃO DERIVADA
    # ========================================================

    expression_anchor = '''  const canUseRelationalMemory =
    Boolean(companionRelationalMemory) &&
    (
      !companionReaction ||
      companionReaction.priority < 70
    );'''


    if expression_anchor not in component:
        raise RuntimeError(
            "Bloco canUseRelationalMemory "
            "não encontrado."
        )


    expression_block = expression_anchor + '''

  /**
   * A7.2
   *
   * A memória já foi escolhida pelo A6.
   * Aqui escolhemos apenas a forma linguística
   * dessa mesma memória.
   */
  const companionRelationalExpression =
    useMemo(
      () =>
        resolveCompanionRelationalExpression(
          companionRelationalMemory
        ),
      [companionRelationalMemory]
    );'''


    component = component.replace(
        expression_anchor,
        expression_block,
        1
    )


    # ========================================================
    # 7. USAR EXPRESSÃO A7
    # ========================================================

    old_message = '''    if (
      canUseRelationalMemory &&
      companionRelationalMemory
    ) {
      return t(
        companionRelationalMemory.translationKey,
        companionRelationalMemory.values ?? {}
      );
    }'''


    new_message = '''    if (
      canUseRelationalMemory &&
      companionRelationalMemory
    ) {
      if (companionRelationalExpression) {
        return t(
          companionRelationalExpression.translationKey,
          companionRelationalExpression.values ?? {}
        );
      }

      /**
       * Fallback A6.
       *
       * Se o A7 não produzir uma expressão,
       * a memória original continua disponível.
       */
      return t(
        companionRelationalMemory.translationKey,
        companionRelationalMemory.values ?? {}
      );
    }'''


    if old_message not in component:
        raise RuntimeError(
            "Bloco de mensagem relacional A6 "
            "não encontrado."
        )


    component = component.replace(
        old_message,
        new_message,
        1
    )


    # ========================================================
    # 8. DEPENDÊNCIA DO useMemo
    # ========================================================

    old_dep = '''    companionReaction,
    companionRelationalMemory,
    currentMoodRating,'''


    new_dep = '''    companionReaction,
    companionRelationalExpression,
    companionRelationalMemory,
    currentMoodRating,'''


    if old_dep not in component:
        raise RuntimeError(
            "Dependências do companionMessage "
            "não encontradas."
        )


    component = component.replace(
        old_dep,
        new_dep,
        1
    )


    # ========================================================
    # 9. TRADUÇÕES A7
    # ========================================================

    translations = {

        # ====================================================
        # PORTUGUÊS
        # ====================================================

        "pt": {

            "learned_impulse": {
                "a":
                    "Começo a reconhecer algo em ti: "
                    "já houve mais do que uma experiência "
                    "recente em que terminaste mais leve.",

                "b":
                    "Tenho reparado numa aprendizagem tua: "
                    "já houve várias experiências recentes "
                    "em que terminaste mais leve.",

                "c":
                    "Já há algo que reconheço no teu percurso: "
                    "em várias experiências recentes "
                    "terminaste mais leve."
            },

            "effective_impulse": {
                "a":
                    "Há uma experiência recente que guardo "
                    "como referência: a intensidade passou "
                    "de {{before}} para {{after}}.",

                "b":
                    "Lembro-me de um momento recente em que "
                    "passaste de {{before}} para {{after}}. "
                    "Nesse momento, a experiência pareceu ajudar.",

                "c":
                    "Uma das tuas experiências recentes deixou "
                    "um sinal claro: a intensidade desceu de "
                    "{{before}} para {{after}}."
            },

            "converging_signals": {
                "a":
                    "Começo a notar alguns sinais que aparecem "
                    "em conjunto nos teus registos.",

                "b":
                    "Há vários sinais nos teus registos que "
                    "começam a apontar numa direção semelhante.",

                "c":
                    "Já consigo reconhecer continuidade entre "
                    "vários sinais dos teus registos, embora "
                    "continue a observá-los com cuidado."
            },

            "repeated_need": {
                "a":
                    "Há uma necessidade que começou a aparecer "
                    "novamente nos teus registos.",

                "b":
                    "Tenho reparado que uma necessidade semelhante "
                    "se tem repetido nos teus últimos registos.",

                "c":
                    "Esta necessidade já apareceu várias vezes "
                    "nos teus registos. É algo que vale a pena "
                    "continuarmos a observar."
            },

            "mood_improving": {
                "a":
                    "Começo a notar uma direção um pouco mais "
                    "favorável no teu humor.",

                "b":
                    "Nos teus últimos registos, o humor tem "
                    "mostrado uma direção mais favorável.",

                "c":
                    "Ao acompanhar os teus últimos registos, "
                    "já consigo reconhecer uma evolução mais "
                    "favorável no teu humor."
            },

            "mood_declining": {
                "a":
                    "Começo a notar uma direção um pouco mais "
                    "difícil nos teus últimos registos.",

                "b":
                    "Nos teus últimos registos, o humor tem "
                    "mostrado uma direção um pouco mais difícil.",

                "c":
                    "Tenho acompanhado os teus registos e há "
                    "uma direção mais difícil que merece a nossa "
                    "atenção, sem tirarmos conclusões precipitadas."
            },

            "mood_stable": {
                "a":
                    "O teu humor parece ter mantido uma direção "
                    "semelhante nos últimos registos.",

                "b":
                    "Tenho reparado em alguma estabilidade na "
                    "direção do teu humor.",

                "c":
                    "Os teus últimos registos mostram uma "
                    "continuidade relativamente estável no humor."
            },

            "consistency": {
                "a":
                    "Tenho-te visto por aqui com alguma "
                    "regularidade. Isso ajuda-me a conhecer "
                    "melhor o teu ritmo.",

                "b":
                    "A tua presença tem sido bastante regular "
                    "nos últimos dias. Cada registo acrescenta "
                    "um pouco ao que vou conhecendo de ti.",

                "c":
                    "Estiveste presente ao longo de toda esta "
                    "semana. Já existe uma continuidade que me "
                    "ajuda a compreender melhor o teu ritmo."
            }
        },


        # ====================================================
        # ENGLISH
        # ====================================================

        "en": {

            "learned_impulse": {
                "a":
                    "I'm beginning to recognize something about "
                    "you: there has been more than one recent "
                    "experience where you ended feeling lighter.",

                "b":
                    "I've noticed something you're learning about "
                    "yourself: there have already been several "
                    "recent experiences where you ended feeling "
                    "lighter.",

                "c":
                    "There's something I now recognize in your "
                    "journey: across several recent experiences, "
                    "you ended feeling lighter."
            },

            "effective_impulse": {
                "a":
                    "There's a recent experience I can keep as "
                    "a reference: the intensity went from "
                    "{{before}} to {{after}}.",

                "b":
                    "I remember a recent moment when you went "
                    "from {{before}} to {{after}}. In that moment, "
                    "the experience seemed to help.",

                "c":
                    "One of your recent experiences left a clear "
                    "signal: the intensity dropped from {{before}} "
                    "to {{after}}."
            },

            "converging_signals": {
                "a":
                    "I'm beginning to notice a few signals "
                    "appearing together across your records.",

                "b":
                    "Several signals in your records are beginning "
                    "to point in a similar direction.",

                "c":
                    "I can now recognize some continuity across "
                    "several signals in your records, while still "
                    "observing them carefully."
            },

            "repeated_need": {
                "a":
                    "There's a need that has started to appear "
                    "again in your records.",

                "b":
                    "I've noticed that a similar need has been "
                    "repeating across your recent records.",

                "c":
                    "This need has appeared several times in your "
                    "records. It's something worth continuing to "
                    "observe together."
            },

            "mood_improving": {
                "a":
                    "I'm beginning to notice a slightly more "
                    "positive direction in your mood.",

                "b":
                    "Across your recent records, your mood has "
                    "been moving in a more positive direction.",

                "c":
                    "As I follow your recent records, I can now "
                    "recognize a more positive development in "
                    "your mood."
            },

            "mood_declining": {
                "a":
                    "I'm beginning to notice a slightly more "
                    "difficult direction in your recent records.",

                "b":
                    "Across your recent records, your mood has "
                    "been moving in a slightly more difficult "
                    "direction.",

                "c":
                    "I've been following your records, and there "
                    "is a more difficult direction worth paying "
                    "attention to without jumping to conclusions."
            },

            "mood_stable": {
                "a":
                    "Your mood seems to have maintained a similar "
                    "direction across your recent records.",

                "b":
                    "I've noticed some stability in the direction "
                    "of your mood.",

                "c":
                    "Your recent records show relatively stable "
                    "continuity in your mood."
            },

            "consistency": {
                "a":
                    "I've been seeing you here fairly regularly. "
                    "That helps me understand your rhythm a little "
                    "better.",

                "b":
                    "You've been quite present over the last few "
                    "days. Each record adds a little to what I'm "
                    "learning about you.",

                "c":
                    "You've been here throughout this whole week. "
                    "There's now a continuity that helps me "
                    "understand your rhythm better."
            }
        },


        # ====================================================
        # ESPAÑOL
        # ====================================================

        "es": {

            "learned_impulse": {
                "a":
                    "Empiezo a reconocer algo en ti: ya ha habido "
                    "más de una experiencia reciente en la que "
                    "terminaste algo más ligero.",

                "b":
                    "He observado algo que estás aprendiendo sobre "
                    "ti: ya ha habido varias experiencias recientes "
                    "en las que terminaste más ligero.",

                "c":
                    "Ya hay algo que reconozco en tu recorrido: "
                    "en varias experiencias recientes terminaste "
                    "más ligero."
            },

            "effective_impulse": {
                "a":
                    "Hay una experiencia reciente que puedo guardar "
                    "como referencia: la intensidad pasó de "
                    "{{before}} a {{after}}.",

                "b":
                    "Recuerdo un momento reciente en el que pasaste "
                    "de {{before}} a {{after}}. En ese momento, "
                    "la experiencia pareció ayudarte.",

                "c":
                    "Una de tus experiencias recientes dejó una "
                    "señal clara: la intensidad bajó de {{before}} "
                    "a {{after}}."
            },

            "converging_signals": {
                "a":
                    "Empiezo a observar algunas señales que "
                    "aparecen juntas en tus registros.",

                "b":
                    "Varias señales de tus registros empiezan a "
                    "apuntar en una dirección parecida.",

                "c":
                    "Ya puedo reconocer cierta continuidad entre "
                    "varias señales de tus registros, aunque sigo "
                    "observándolas con cuidado."
            },

            "repeated_need": {
                "a":
                    "Hay una necesidad que ha empezado a aparecer "
                    "de nuevo en tus registros.",

                "b":
                    "He observado que una necesidad parecida se "
                    "ha repetido en tus últimos registros.",

                "c":
                    "Esta necesidad ya ha aparecido varias veces "
                    "en tus registros. Merece la pena que sigamos "
                    "observándola."
            },

            "mood_improving": {
                "a":
                    "Empiezo a notar una dirección algo más "
                    "favorable en tu estado de ánimo.",

                "b":
                    "En tus últimos registros, tu estado de ánimo "
                    "ha mostrado una dirección más favorable.",

                "c":
                    "Al seguir tus últimos registros, ya puedo "
                    "reconocer una evolución más favorable en "
                    "tu estado de ánimo."
            },

            "mood_declining": {
                "a":
                    "Empiezo a notar una dirección algo más difícil "
                    "en tus últimos registros.",

                "b":
                    "En tus últimos registros, tu estado de ánimo "
                    "ha mostrado una dirección algo más difícil.",

                "c":
                    "He seguido tus registros y hay una dirección "
                    "más difícil a la que merece la pena prestar "
                    "atención, sin sacar conclusiones precipitadas."
            },

            "mood_stable": {
                "a":
                    "Tu estado de ánimo parece haber mantenido "
                    "una dirección parecida en los últimos registros.",

                "b":
                    "He observado cierta estabilidad en la "
                    "dirección de tu estado de ánimo.",

                "c":
                    "Tus últimos registros muestran una continuidad "
                    "relativamente estable en tu estado de ánimo."
            },

            "consistency": {
                "a":
                    "Te he visto por aquí con cierta regularidad. "
                    "Eso me ayuda a conocer un poco mejor tu ritmo.",

                "b":
                    "Has estado bastante presente durante los "
                    "últimos días. Cada registro añade algo a lo "
                    "que voy conociendo de ti.",

                "c":
                    "Has estado presente durante toda esta semana. "
                    "Ya existe una continuidad que me ayuda a "
                    "comprender mejor tu ritmo."
            }
        },


        # ====================================================
        # FRANÇAIS
        # ====================================================

        "fr": {

            "learned_impulse": {
                "a":
                    "Je commence à reconnaître quelque chose chez "
                    "toi : plusieurs expériences récentes se sont "
                    "déjà terminées en te laissant plus léger.",

                "b":
                    "J'ai remarqué quelque chose que tu apprends "
                    "sur toi : plusieurs expériences récentes se "
                    "sont déjà terminées en te laissant plus léger.",

                "c":
                    "Il y a maintenant quelque chose que je "
                    "reconnais dans ton parcours : plusieurs "
                    "expériences récentes t'ont laissé plus léger."
            },

            "effective_impulse": {
                "a":
                    "Il y a une expérience récente que je peux "
                    "garder comme repère : l'intensité est passée "
                    "de {{before}} à {{after}}.",

                "b":
                    "Je me souviens d'un moment récent où tu es "
                    "passé de {{before}} à {{after}}. À ce moment-là, "
                    "l'expérience semble t'avoir aidé.",

                "c":
                    "L'une de tes expériences récentes a laissé "
                    "un signal clair : l'intensité est passée de "
                    "{{before}} à {{after}}."
            },

            "converging_signals": {
                "a":
                    "Je commence à remarquer quelques signaux qui "
                    "apparaissent ensemble dans tes notes.",

                "b":
                    "Plusieurs signaux dans tes notes commencent "
                    "à aller dans une direction similaire.",

                "c":
                    "Je peux maintenant reconnaître une certaine "
                    "continuité entre plusieurs signaux de tes "
                    "notes, tout en continuant à les observer "
                    "avec prudence."
            },

            "repeated_need": {
                "a":
                    "Il y a un besoin qui a commencé à réapparaître "
                    "dans tes notes.",

                "b":
                    "J'ai remarqué qu'un besoin similaire s'est "
                    "répété dans tes dernières notes.",

                "c":
                    "Ce besoin est déjà apparu plusieurs fois dans "
                    "tes notes. Cela vaut la peine de continuer "
                    "à l'observer ensemble."
            },

            "mood_improving": {
                "a":
                    "Je commence à remarquer une direction un peu "
                    "plus favorable dans ton humeur.",

                "b":
                    "Dans tes dernières notes, ton humeur montre "
                    "une direction plus favorable.",

                "c":
                    "En suivant tes dernières notes, je peux "
                    "maintenant reconnaître une évolution plus "
                    "favorable de ton humeur."
            },

            "mood_declining": {
                "a":
                    "Je commence à remarquer une direction un peu "
                    "plus difficile dans tes dernières notes.",

                "b":
                    "Dans tes dernières notes, ton humeur montre "
                    "une direction un peu plus difficile.",

                "c":
                    "J'ai suivi tes notes et une direction plus "
                    "difficile mérite notre attention, sans tirer "
                    "de conclusions trop vite."
            },

            "mood_stable": {
                "a":
                    "Ton humeur semble avoir gardé une direction "
                    "similaire dans tes dernières notes.",

                "b":
                    "J'ai remarqué une certaine stabilité dans "
                    "la direction de ton humeur.",

                "c":
                    "Tes dernières notes montrent une continuité "
                    "relativement stable de ton humeur."
            },

            "consistency": {
                "a":
                    "Je te vois ici assez régulièrement. Cela "
                    "m'aide à mieux connaître ton rythme.",

                "b":
                    "Tu as été assez présent ces derniers jours. "
                    "Chaque note ajoute quelque chose à ce que "
                    "j'apprends de toi.",

                "c":
                    "Tu as été présent tout au long de cette "
                    "semaine. Il existe maintenant une continuité "
                    "qui m'aide à mieux comprendre ton rythme."
            }
        },
    }


    # ========================================================
    # 10. INSERIR TRADUÇÕES
    # ========================================================

    for lang, path in LOCALES.items():

        data = json.loads(
            path.read_text(
                encoding="utf-8"
            )
        )

        block = data.get(
            "companionRelationalMemory"
        )

        if not isinstance(block, dict):
            raise RuntimeError(
                f"{lang}: bloco "
                "companionRelationalMemory não encontrado."
            )


        # A6 permanece intacto.
        # A7 recebe um namespace próprio.

        if "variants" in block:
            raise RuntimeError(
                f"{lang}: bloco variants A7 "
                "já existe."
            )


        block["variants"] = (
            translations[lang]
        )


        path.write_text(
            json.dumps(
                data,
                ensure_ascii=False,
                indent=2
            ) + "\n",
            encoding="utf-8"
        )


    # ========================================================
    # 11. GRAVAR TYPESCRIPT
    # ========================================================

    RESOLVER.write_text(
        resolver,
        encoding="utf-8"
    )

    COMPONENT.write_text(
        component,
        encoding="utf-8"
    )


    # ========================================================
    # 12. VALIDAÇÃO
    # ========================================================

    final_resolver = RESOLVER.read_text(
        encoding="utf-8"
    )

    final_component = COMPONENT.read_text(
        encoding="utf-8"
    )


    checks = {

        "resolver A6 preservado":
            "resolveCompanionRelationalMemory("
            in final_resolver,

        "resolver A7 criado":
            "resolveCompanionRelationalExpression("
            in final_resolver,

        "tipo de expressão criado":
            "CompanionRelationalExpression"
            in final_resolver,

        "namespace variants":
            "companionRelationalMemory.variants."
            in final_resolver,

        # Procuramos chamadas reais e não texto em comentários.
        "sem Math.random":
            "Math.random("
            not in expression_resolver,

        "sem localStorage":
            "localStorage."
            not in expression_resolver,

        "sem setTimeout":
            "setTimeout("
            not in expression_resolver,

        "sem setInterval":
            "setInterval("
            not in expression_resolver,

        "sem requestAnimationFrame":
            "requestAnimationFrame("
            not in expression_resolver,

        "sem Date":
            "new Date("
            not in expression_resolver
            and
            "Date.now("
            not in expression_resolver,

        "sem avatar level":
            "avatar.level"
            not in expression_resolver,

        "expressão integrada":
            "companionRelationalExpression"
            in final_component,

        "resolver A7 chamado":
            "resolveCompanionRelationalExpression("
            in final_component,

        "hierarquia A6 >=70 preservada":
            "companionReaction.priority >= 70"
            in final_component,

        "hierarquia A6 <70 preservada":
            "companionReaction.priority < 70"
            in final_component,

        "fallback A6 preservado":
            "companionRelationalMemory.translationKey"
            in final_component,

        "translation A7 usada":
            "companionRelationalExpression.translationKey"
            in final_component,
    }


    # ========================================================
    # 13. VALIDAR A6 + 24 VARIANTES POR IDIOMA
    # ========================================================

    expected_kinds = {
        "learned_impulse",
        "effective_impulse",
        "converging_signals",
        "repeated_need",
        "mood_improving",
        "mood_declining",
        "mood_stable",
        "consistency",
    }


    a6_keys = {
        "learnedImpulse",
        "effectiveImpulse",
        "convergingSignals",
        "repeatedNeed",
        "moodImproving",
        "moodDeclining",
        "moodStable",
        "consistency",
    }


    for lang, path in LOCALES.items():

        data = json.loads(
            path.read_text(
                encoding="utf-8"
            )
        )

        block = data.get(
            "companionRelationalMemory"
        )

        valid = True


        if not isinstance(block, dict):

            valid = False


        elif not a6_keys.issubset(
            set(block.keys())
        ):

            valid = False


        else:

            variants_root = block.get(
                "variants"
            )

            if not isinstance(
                variants_root,
                dict
            ):

                valid = False


            elif set(
                variants_root.keys()
            ) != expected_kinds:

                valid = False


            else:

                for kind in expected_kinds:

                    variants = (
                        variants_root.get(kind)
                    )

                    if not isinstance(
                        variants,
                        dict
                    ):

                        valid = False
                        break


                    if set(
                        variants.keys()
                    ) != {
                        "a",
                        "b",
                        "c",
                    }:

                        valid = False
                        break


        checks[
            f"A6 preservado + 24 variantes {lang}"
        ] = valid


    # ========================================================
    # 14. RESULTADO
    # ========================================================

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

    # ========================================================
    # ROLLBACK
    # ========================================================

    for source, backup in BACKUPS.items():

        if backup.exists():

            shutil.copy2(
                backup,
                source
            )


    print()
    print("ERRO:", exc)
    print()
    print(
        "A7.2 revertido através dos backups."
    )

    sys.exit(1)


# ============================================================
# 15. SUCESSO
# ============================================================

print("=" * 76)
print("CONFIA — A7.2 — VARIEDADE RELACIONAL")
print("=" * 76)
print()

print("✓ Resolver de expressão relacional criado")
print("✓ A6 continua a escolher o facto")
print("✓ A7 escolhe apenas como dizer")
print("✓ Namespace A7 separado de A6")
print("✓ 8 traduções A6 preservadas")
print("✓ kind preservado")
print("✓ strength usado")
print("✓ Evidência factual pode refinar variante")
print("✓ 3 variantes por memória")
print("✓ 24 variantes por idioma")
print("✓ PT / EN / ES / FR")
print("✓ Hierarquia >= 70 preservada")
print("✓ Fallback A6 preservado")
print("✓ Sem Math.random")
print("✓ Sem Date")
print("✓ Sem novo histórico")
print("✓ Sem novo storage")
print("✓ Sem localStorage")
print("✓ Sem timers")
print("✓ Sem requestAnimationFrame")
print("✓ Sem nível do avatar")

print()
print("Backups:")

for backup in BACKUPS.values():
    print(
        f"  {backup}"
    )

print()
print("A7.2 aplicado.")
print("=" * 76)
