from pathlib import Path
import json
import shutil
import sys


COMPONENT = Path(
    "src/components/Companheiro/ConfiaCompanionHome.tsx"
)

APP = Path("src/App.tsx")

LOCALES = {
    "pt": Path("src/locales/pt.json"),
    "en": Path("src/locales/en.json"),
    "es": Path("src/locales/es.json"),
    "fr": Path("src/locales/fr.json"),
}

BACKUPS = {
    COMPONENT:
        Path("/tmp/ConfiaCompanionHome.tsx.before_a6_3"),
    APP:
        Path("/tmp/App.tsx.before_a6_3"),
}

for code, path in LOCALES.items():
    BACKUPS[path] = Path(
        f"/tmp/{code}.json.before_a6_3"
    )


def fail(message):
    print()
    print("ERRO:", message)
    print()
    print("Nenhuma alteração foi aplicada.")
    sys.exit(1)


# ============================================================
# PRÉ-VALIDAÇÃO
# ============================================================

required_files = [
    COMPONENT,
    APP,
    *LOCALES.values(),
]

for path in required_files:
    if not path.exists():
        fail(f"Ficheiro não encontrado: {path}")


component = COMPONENT.read_text(
    encoding="utf-8"
)

app = APP.read_text(
    encoding="utf-8"
)


if "resolveCompanionRelationalMemory" in component:
    fail("A6.3 parece já estar aplicado.")


old_import = '''import type {
  CompanionReactionState,
} from "../../data/reactive/companionReactionEngine";'''

# O import real pode estar formatado de outra maneira.
# Procuramos antes pelo import de resolveCompanionReaction.
if "resolveCompanionReaction" not in component:
    fail(
        "Não encontrei resolveCompanionReaction "
        "em ConfiaCompanionHome."
    )


# ============================================================
# BACKUPS
# ============================================================

for source, backup in BACKUPS.items():
    shutil.copy2(source, backup)


try:

    # ========================================================
    # 1. IMPORT — COMPONENTE
    # ========================================================

    import_anchor = (
        'import { Avatar } from "../Avatar";'
    )

    if import_anchor not in component:
        raise RuntimeError(
            "Âncora de import do Avatar não encontrada."
        )

    relational_import = '''import {
  resolveCompanionRelationalMemory,
  type CompanionRelationalMemoryResult,
} from "../../data/reactive/companionRelationalMemory";
import type {
  ReactiveRecentMemory,
} from "../../data/reactive/reactiveRecentMemory";
'''

    component = component.replace(
        import_anchor,
        import_anchor + "\n" + relational_import,
        1
    )


    # ========================================================
    # 2. PROP DA MEMÓRIA
    # ========================================================

    props_anchor = (
        "  reactiveResult: ReactiveResult | null;"
    )

    if props_anchor not in component:
        raise RuntimeError(
            "Prop reactiveResult não encontrada."
        )

    component = component.replace(
        props_anchor,
        props_anchor
        + "\n"
        + "  relationalMemory: "
        + "ReactiveRecentMemory | null;",
        1
    )


    # ========================================================
    # 3. DESTRUCTURING
    # ========================================================

    destructure_anchor = (
        "  reactiveResult,"
    )

    if destructure_anchor not in component:
        raise RuntimeError(
            "Destructuring de reactiveResult não encontrado."
        )

    component = component.replace(
        destructure_anchor,
        destructure_anchor
        + "\n"
        + "  relationalMemory,",
        1
    )


    # ========================================================
    # 4. RESOLVER RELACIONAL
    # ========================================================

    message_anchor = '''  const companionMessage = useMemo(() => {'''

    if message_anchor not in component:
        raise RuntimeError(
            "Bloco companionMessage não encontrado."
        )

    relational_block = '''  /**
   * A6.3 — memória relacional visível.
   *
   * Não volta a recolher dados e não cria memória.
   * Recebe a mesma ReactiveRecentMemory já construída
   * no Principal e transforma-a apenas numa possibilidade
   * de fala da criatura.
   */
  const companionRelationalMemory:
    CompanionRelationalMemoryResult | null =
      useMemo(
        () =>
          resolveCompanionRelationalMemory(
            relationalMemory
          ),
        [relationalMemory]
      );

  /**
   * Uma reação atual com prioridade >= 70 continua
   * sempre à frente da memória relacional.
   *
   * Isto protege:
   * - momentos difíceis;
   * - regressos;
   * - progresso relevante;
   * - celebrações;
   * - descobertas atuais.
   *
   * A memória relacional surge apenas quando existe
   * espaço emocional para a CONFIA demonstrar
   * continuidade da relação.
   */
  const canUseRelationalMemory =
    Boolean(companionRelationalMemory) &&
    (
      !companionReaction ||
      companionReaction.priority < 70
    );

'''

    component = component.replace(
        message_anchor,
        relational_block + message_anchor,
        1
    )


    # ========================================================
    # 5. HIERARQUIA DA MENSAGEM
    # ========================================================

    old_message_start = '''  const companionMessage = useMemo(() => {
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

    new_message_start = '''  const companionMessage = useMemo(() => {
    /**
     * A6.3 — HIERARQUIA DA VOZ
     *
     * 1. reação atual importante;
     * 2. memória relacional factual;
     * 3. resposta reativa de baixa prioridade;
     * 4. fallbacks históricos existentes.
     */

    if (
      companionReaction?.response?.translationKey &&
      companionReaction.priority >= 70
    ) {
      return t(
        companionReaction.response.translationKey
      );
    }

    if (
      canUseRelationalMemory &&
      companionRelationalMemory
    ) {
      return t(
        companionRelationalMemory.translationKey,
        companionRelationalMemory.values ?? {}
      );
    }

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

    if old_message_start not in component:
        raise RuntimeError(
            "Estrutura atual de companionMessage "
            "não corresponde ao diagnóstico."
        )

    component = component.replace(
        old_message_start,
        new_message_start,
        1
    )


    # ========================================================
    # 6. DEPENDÊNCIAS useMemo
    # ========================================================

    old_dependencies = '''    avatar.level,
    avatarMemoryMessage,
    companionReaction,
    currentMoodRating,
    t,
  ]);'''

    new_dependencies = '''    avatar.level,
    avatarMemoryMessage,
    canUseRelationalMemory,
    companionReaction,
    companionRelationalMemory,
    currentMoodRating,
    t,
  ]);'''

    if old_dependencies not in component:
        raise RuntimeError(
            "Dependências de companionMessage "
            "não encontradas."
        )

    component = component.replace(
        old_dependencies,
        new_dependencies,
        1
    )


    # ========================================================
    # 7. APP — IMPORT
    # ========================================================

    app_import_anchor = '''import {
  collectReactiveRecentMemory,
} from "./data/reactive/reactiveRecentMemory";'''

    if app_import_anchor not in app:
        raise RuntimeError(
            "Import de collectReactiveRecentMemory "
            "não encontrado no App."
        )

    # Não precisamos de novo import.
    # O App já possui exatamente a função necessária.


    # ========================================================
    # 8. APP — MEMÓRIA ÚNICA PARA A6
    # ========================================================

    home_memory_anchor = '''const homeNowMemory = (() => {'''

    if home_memory_anchor not in app:
        raise RuntimeError(
            "homeNowMemory não encontrado."
        )

    relational_memory_block = '''/**
 * A6.3 — memória relacional do companheiro.
 *
 * Reutiliza o mesmo modelo de memória do sistema reativo.
 * Não persiste nada e não cria uma segunda fonte de verdade.
 */
const homeCompanionRelationalMemory = (() => {
  if (
    currentTab !== 0 ||
    homeScreen !== "home"
  ) {
    return null;
  }

  try {
    return collectReactiveRecentMemory();
  } catch {
    return null;
  }
})();


'''

    app = app.replace(
        home_memory_anchor,
        relational_memory_block
        + home_memory_anchor,
        1
    )


    # ========================================================
    # 9. PASSAR MEMÓRIA AO COMPONENTE
    # ========================================================

    call_anchor = '''  reactiveResult={homeReactiveResult}
/>'''

    if call_anchor not in app:
        raise RuntimeError(
            "Chamada de ConfiaCompanionHome "
            "não corresponde ao diagnóstico."
        )

    app = app.replace(
        call_anchor,
        '''  reactiveResult={homeReactiveResult}
  relationalMemory={homeCompanionRelationalMemory}
/>''',
        1
    )


    # ========================================================
    # 10. TRADUÇÕES
    # ========================================================

    translations = {
        "pt": {
            "learnedImpulse":
                "Já te conheço um pouco melhor: em vários momentos recentes, {{need}} apareceu associado a experiências em que terminaste mais leve.",
            "effectiveImpulse":
                "Lembro-me de uma experiência recente em que a intensidade passou de {{before}} para {{after}}. Parece ter-te ajudado nesse momento.",
            "convergingSignals":
                "Tenho reparado em alguns sinais que se repetem nos teus registos. Ainda estamos a conhecê-los, mas já existe alguma continuidade.",
            "repeatedNeed":
                "Tenho reparado que uma necessidade semelhante tem aparecido mais do que uma vez nos teus registos.",
            "moodImproving":
                "Tenho acompanhado os teus últimos registos. Aos poucos, o teu humor tem mostrado uma direção mais favorável.",
            "moodDeclining":
                "Tenho acompanhado os teus últimos registos. Ultimamente, o teu humor tem mostrado uma direção um pouco mais difícil.",
            "moodStable":
                "Tenho acompanhado os teus últimos registos. O teu humor tem-se mantido numa direção relativamente semelhante.",
            "consistency":
                "Tenho-te visto por aqui com alguma regularidade. Cada registo ajuda-me a conhecer melhor o teu ritmo."
        },

        "en": {
            "learnedImpulse":
                "I'm getting to know you a little better: in several recent moments, {{need}} appeared alongside experiences where you ended feeling lighter.",
            "effectiveImpulse":
                "I remember a recent experience when the intensity went from {{before}} to {{after}}. It seems to have helped you in that moment.",
            "convergingSignals":
                "I've been noticing a few signals repeating across your records. We're still getting to know them, but there is already some continuity.",
            "repeatedNeed":
                "I've noticed that a similar need has appeared more than once in your recent records.",
            "moodImproving":
                "I've been following your recent records. Little by little, your mood has been moving in a more positive direction.",
            "moodDeclining":
                "I've been following your recent records. Lately, your mood has been moving in a slightly more difficult direction.",
            "moodStable":
                "I've been following your recent records. Your mood has remained in a relatively similar direction.",
            "consistency":
                "I've been seeing you here fairly regularly. Each record helps me understand your rhythm a little better."
        },

        "es": {
            "learnedImpulse":
                "Ya te conozco un poco mejor: en varios momentos recientes, {{need}} apareció asociado a experiencias en las que terminaste algo más ligero.",
            "effectiveImpulse":
                "Recuerdo una experiencia reciente en la que la intensidad pasó de {{before}} a {{after}}. Parece haberte ayudado en ese momento.",
            "convergingSignals":
                "He observado algunas señales que se repiten en tus registros. Todavía las estamos conociendo, pero ya existe cierta continuidad.",
            "repeatedNeed":
                "He observado que una necesidad parecida ha aparecido más de una vez en tus registros recientes.",
            "moodImproving":
                "He seguido tus últimos registros. Poco a poco, tu estado de ánimo ha mostrado una dirección más favorable.",
            "moodDeclining":
                "He seguido tus últimos registros. Últimamente, tu estado de ánimo ha mostrado una dirección un poco más difícil.",
            "moodStable":
                "He seguido tus últimos registros. Tu estado de ánimo se ha mantenido en una dirección relativamente parecida.",
            "consistency":
                "Te he visto por aquí con cierta regularidad. Cada registro me ayuda a conocer un poco mejor tu ritmo."
        },

        "fr": {
            "learnedImpulse":
                "Je commence à mieux te connaître : récemment, {{need}} est apparu plusieurs fois dans des expériences où tu as terminé en te sentant plus léger.",
            "effectiveImpulse":
                "Je me souviens d'une expérience récente où l'intensité est passée de {{before}} à {{after}}. Cela semble t'avoir aidé à ce moment-là.",
            "convergingSignals":
                "J'ai remarqué quelques signaux qui se répètent dans tes notes. Nous apprenons encore à les connaître, mais une certaine continuité apparaît déjà.",
            "repeatedNeed":
                "J'ai remarqué qu'un besoin similaire est apparu plus d'une fois dans tes notes récentes.",
            "moodImproving":
                "J'ai suivi tes dernières notes. Petit à petit, ton humeur montre une direction plus favorable.",
            "moodDeclining":
                "J'ai suivi tes dernières notes. Dernièrement, ton humeur montre une direction un peu plus difficile.",
            "moodStable":
                "J'ai suivi tes dernières notes. Ton humeur est restée dans une direction relativement similaire.",
            "consistency":
                "Je te vois ici assez régulièrement. Chaque note m'aide à mieux connaître ton rythme."
        },
    }


    for code, path in LOCALES.items():

        data = json.loads(
            path.read_text(
                encoding="utf-8"
            )
        )

        if "companionRelationalMemory" in data:
            raise RuntimeError(
                f"{code}: companionRelationalMemory "
                "já existe."
            )

        data["companionRelationalMemory"] = (
            translations[code]
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
    # 11. GRAVAR TSX
    # ========================================================

    COMPONENT.write_text(
        component,
        encoding="utf-8"
    )

    APP.write_text(
        app,
        encoding="utf-8"
    )


    # ========================================================
    # 12. VALIDAÇÃO
    # ========================================================

    final_component = COMPONENT.read_text(
        encoding="utf-8"
    )

    final_app = APP.read_text(
        encoding="utf-8"
    )

    checks = {
        "resolver relacional importado":
            "resolveCompanionRelationalMemory"
            in final_component,

        "ReactiveRecentMemory tipada":
            "ReactiveRecentMemory"
            in final_component,

        "prop relationalMemory":
            "relationalMemory:"
            in final_component,

        "resolver usado":
            "resolveCompanionRelationalMemory("
            in final_component,

        "proteção prioridade >= 70":
            "companionReaction.priority >= 70"
            in final_component,

        "memória só abaixo de 70":
            "companionReaction.priority < 70"
            in final_component,

        "tradução relacional usada":
            "companionRelationalMemory.translationKey"
            in final_component,

        "App recolhe memória":
            "homeCompanionRelationalMemory"
            in final_app,

        "App passa memória":
            "relationalMemory={homeCompanionRelationalMemory}"
            in final_app,

        "sem novo localStorage":
            "localStorage." not in (
                relational_memory_block
                + relational_block
            ),

        "sem novo timer":
            "setTimeout(" not in (
                relational_memory_block
                + relational_block
            )
            and
            "setInterval(" not in (
                relational_memory_block
                + relational_block
            ),

        "sem aleatoriedade":
            "Math.random" not in (
                relational_memory_block
                + relational_block
            ),
    }

    for code, path in LOCALES.items():

        parsed = json.loads(
            path.read_text(
                encoding="utf-8"
            )
        )

        block = parsed.get(
            "companionRelationalMemory"
        )

        checks[
            f"traduções {code}"
        ] = (
            isinstance(block, dict)
            and len(block) == 8
        )


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

    for source, backup in BACKUPS.items():
        if backup.exists():
            shutil.copy2(
                backup,
                source
            )

    print()
    print("ERRO:", exc)
    print()
    print("A6.3 revertido através dos backups.")
    sys.exit(1)


print("=" * 76)
print("CONFIA — A6.3 — FALA RELACIONAL")
print("=" * 76)
print()
print("✓ Memória relacional ligada à CONFIA")
print("✓ Reactive Engine continua prioritário")
print("✓ Reações >= 70 protegidas")
print("✓ Memória entra apenas em momentos tranquilos")
print("✓ Sem falsa memória")
print("✓ Sem segundo cérebro")
print("✓ Sem novo storage")
print("✓ Sem novos timers")
print("✓ Sem requestAnimationFrame")
print("✓ Sem Math.random")
print("✓ PT / EN / ES / FR")
print("✓ Fallbacks antigos preservados")
print()
print("Backups:")
for backup in BACKUPS.values():
    print(f"  {backup}")
print()
print("A6.3 aplicado.")
print("=" * 76)
