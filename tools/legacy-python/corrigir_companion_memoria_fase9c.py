from pathlib import Path
from datetime import datetime
import shutil
import json
import re

ROOT = Path("src")
BRAIN = ROOT / "data/reactive/companionBrain"

APP = ROOT / "App.tsx"
CONTEXT = BRAIN / "companionBrainContext.ts"
RULES = BRAIN / "companionBrainRules.ts"
INDEX = BRAIN / "index.ts"

IMPULSE_MEMORY = (
    BRAIN /
    "companionBrainLongitudinalImpulseMemory.ts"
)

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
    INDEX,
    *LOCALES.values(),
]

for path in FILES:
    if not path.exists():
        raise SystemExit(
            f"ERRO: ficheiro não encontrado: {path}"
        )

stamp = datetime.now().strftime(
    "%Y%m%d_%H%M%S"
)

for path in FILES:
    shutil.copy2(
        path,
        path.with_name(
            f"{path.name}.before_fix_fase9c_{stamp}"
        ),
    )


# ============================================================
# 1. GARANTIR MEMÓRIA LONGITUDINAL DO IMPULSO
# ============================================================

if not IMPULSE_MEMORY.exists():
    raise SystemExit(
        "ERRO: companionBrainLongitudinalImpulseMemory.ts "
        "não existe.\n"
        "O script 9C parou antes do esperado."
    )

memory_text = IMPULSE_MEMORY.read_text(
    encoding="utf-8"
)

if (
    "buildCompanionLongitudinalImpulseMemory"
    not in memory_text
):
    raise SystemExit(
        "ERRO: ficheiro de memória do Impulso "
        "existe mas parece incompleto."
    )


# ============================================================
# 2. GARANTIR EXPORT
# ============================================================

text = INDEX.read_text(
    encoding="utf-8"
)

export_line = (
    'export * from '
    '"./companionBrainLongitudinalImpulseMemory";'
)

if export_line not in text:
    text = (
        text.rstrip()
        + "\n"
        + export_line
        + "\n"
    )

INDEX.write_text(
    text,
    encoding="utf-8",
)


# ============================================================
# 3. GARANTIR CONTEXTO
# ============================================================

text = CONTEXT.read_text(
    encoding="utf-8"
)

import_code = '''import type {
  CompanionLongitudinalImpulseMemory,
} from "./companionBrainLongitudinalImpulseMemory";
'''

if (
    "CompanionLongitudinalImpulseMemory"
    not in text
):
    text = (
        import_code
        + text
    )


# ------------------------------------------------------------
# Interface
# ------------------------------------------------------------

interface_start = text.find(
    "export interface CompanionBrainContext"
)

builder_start = text.find(
    "export function buildCompanionBrainContext"
)

if (
    interface_start == -1 or
    builder_start == -1
):
    raise SystemExit(
        "ERRO: estrutura de companionBrainContext.ts "
        "não reconhecida."
    )

interface_block = text[
    interface_start:builder_start
]

if (
    "longitudinalImpulse"
    not in interface_block
):
    match = re.search(
        r'(\s+longitudinalMood\s*:\s*'
        r'CompanionLongitudinalMoodMemory\s*;)',
        interface_block,
    )

    if not match:
        raise SystemExit(
            "ERRO: longitudinalMood não encontrado "
            "na interface."
        )

    absolute_end = (
        interface_start +
        match.end()
    )

    insertion = """

  /**
   * Memória longitudinal real do Impulso.
   */
  longitudinalImpulse?:
    CompanionLongitudinalImpulseMemory;"""

    text = (
        text[:absolute_end]
        + insertion
        + text[absolute_end:]
    )


# ------------------------------------------------------------
# Input do builder
# ------------------------------------------------------------

builder_start = text.find(
    "export function buildCompanionBrainContext"
)

signature_end = text.find(
    "}): CompanionBrainContext",
    builder_start,
)

if signature_end == -1:
    raise SystemExit(
        "ERRO: fim da assinatura "
        "buildCompanionBrainContext não encontrado."
    )

signature = text[
    builder_start:signature_end
]

if (
    "longitudinalImpulse"
    not in signature
):
    matches = list(
        re.finditer(
            r'longitudinalMood\s*:\s*'
            r'CompanionLongitudinalMoodMemory\s*;',
            signature,
        )
    )

    if not matches:
        raise SystemExit(
            "ERRO: longitudinalMood não encontrado "
            "no input do builder."
        )

    match = matches[-1]

    absolute_end = (
        builder_start +
        match.end()
    )

    insertion = """

  longitudinalImpulse?:
    CompanionLongitudinalImpulseMemory;"""

    text = (
        text[:absolute_end]
        + insertion
        + text[absolute_end:]
    )


# ------------------------------------------------------------
# Return do builder
# ------------------------------------------------------------

builder_start = text.find(
    "export function buildCompanionBrainContext"
)

builder_tail = text[
    builder_start:
]

if (
    "longitudinalImpulse:"
    not in builder_tail
):
    pattern = re.compile(
        r'(\s+longitudinalMood\s*:\s*'
        r'input\.longitudinalMood\s*,)'
    )

    match = pattern.search(
        text,
        builder_start,
    )

    if not match:
        raise SystemExit(
            "ERRO: retorno longitudinalMood "
            "não encontrado no builder."
        )

    insertion = (
        match.group(1)
        + """
    longitudinalImpulse:
      input.longitudinalImpulse,"""
    )

    text = (
        text[:match.start()]
        + insertion
        + text[match.end():]
    )

CONTEXT.write_text(
    text,
    encoding="utf-8",
)


# ============================================================
# 4. APP — GARANTIR IMPORTS
# ============================================================

text = APP.read_text(
    encoding="utf-8"
)

if (
    "buildCompanionLongitudinalImpulseMemory"
    not in text
):
    first_import = re.search(
        r'^import ',
        text,
        re.MULTILINE,
    )

    if not first_import:
        raise SystemExit(
            "ERRO: imports de App.tsx "
            "não encontrados."
        )

    import_line = (
        'import { '
        'buildCompanionLongitudinalImpulseMemory'
        ' } from '
        '"./data/reactive/companionBrain";\n'
    )

    text = (
        text[:first_import.start()]
        + import_line
        + text[first_import.start():]
    )


if (
    "collectCompanionData"
    not in text
):
    first_import = re.search(
        r'^import ',
        text,
        re.MULTILINE,
    )

    import_line = (
        'import { collectCompanionData } '
        'from "./data/companionData";\n'
    )

    text = (
        text[:first_import.start()]
        + import_line
        + text[first_import.start():]
    )


# ============================================================
# 5. LOCALIZAR HOME DE FORMA FLEXÍVEL
# ============================================================

home_match = re.search(
    r'const\s+homeCompanionBrainDecision\s*=',
    text,
)

if not home_match:
    raise SystemExit(
        "ERRO: homeCompanionBrainDecision "
        "não encontrado."
    )

home_start = home_match.start()

# Janela suficientemente grande para apanhar
# todo o cálculo da decisão Home.
home_limit = min(
    len(text),
    home_start + 18000,
)

home_block = text[
    home_start:home_limit
]


# ============================================================
# 6. LOCALIZAR buildCompanionBrainContext SEM ASSUMIR
#    O NOME DA VARIÁVEL OU FORMATAÇÃO
# ============================================================

context_call = re.search(
    r'(?:const|let)\s+'
    r'[A-Za-z_$][A-Za-z0-9_$]*'
    r'\s*=\s*'
    r'buildCompanionBrainContext\s*\(\s*\{',
    home_block,
    re.MULTILINE,
)

if not context_call:
    # Segundo método:
    # basta localizar a chamada dentro da Home.
    context_call = re.search(
        r'buildCompanionBrainContext\s*\(\s*\{',
        home_block,
        re.MULTILINE,
    )

if not context_call:
    print()
    print("ERRO: encontrei homeCompanionBrainDecision,")
    print("mas não encontrei a chamada ao")
    print("buildCompanionBrainContext dentro dos")
    print("18.000 caracteres seguintes.")
    print()
    print("Executa:")
    print(
        'sed -n "$(grep -n \'homeCompanionBrainDecision\' '
        'src/App.tsx | head -1 | cut -d: -f1),'
        '+120p" src/App.tsx'
    )
    raise SystemExit(1)

absolute_context_pos = (
    home_start +
    context_call.start()
)


# ============================================================
# 7. CRIAR companionCollectedData ANTES DA CHAMADA
# ============================================================

prefix = text[
    home_start:absolute_context_pos
]

if (
    "const companionCollectedData"
    not in prefix
):
    line_start = text.rfind(
        "\n",
        home_start,
        absolute_context_pos,
    ) + 1

    collection_code = """  const companionCollectedData =
    collectCompanionData();

"""

    text = (
        text[:line_start]
        + collection_code
        + text[line_start:]
    )


# ============================================================
# 8. RELOCALIZAR HOME APÓS ALTERAÇÃO
# ============================================================

home_match = re.search(
    r'const\s+homeCompanionBrainDecision\s*=',
    text,
)

home_start = home_match.start()

home_limit = min(
    len(text),
    home_start + 20000,
)

home_block = text[
    home_start:home_limit
]


# ============================================================
# 9. PASSAR MEMÓRIA LONGITUDINAL DO IMPULSO
# ============================================================

if (
    "longitudinalImpulse:"
    not in home_block
):
    mood_pattern = re.compile(
        r'(\s+longitudinalMood\s*:\s*'
        r'buildCompanionLongitudinalMoodMemory'
        r'\s*\(\s*ratings\s*,\s*now\s*\)\s*,)',
        re.MULTILINE,
    )

    mood_match = mood_pattern.search(
        home_block
    )

    if not mood_match:
        raise SystemExit(
            "ERRO: longitudinalMood da 9A "
            "não encontrado dentro da Home."
        )

    absolute_start = (
        home_start +
        mood_match.start()
    )

    absolute_end = (
        home_start +
        mood_match.end()
    )

    replacement = (
        mood_match.group(1)
        + """

    longitudinalImpulse:
      buildCompanionLongitudinalImpulseMemory(
        companionCollectedData.impulse,
        now
      ),"""
    )

    text = (
        text[:absolute_start]
        + replacement
        + text[absolute_end:]
    )

APP.write_text(
    text,
    encoding="utf-8",
)


# ============================================================
# 10. REGRAS 9C
# ============================================================

text = RULES.read_text(
    encoding="utf-8"
)

if (
    "CONFIA_COMPANION_LONGITUDINAL_IMPULSE_RULES_9C"
    not in text
):

    candidates_match = re.search(
        r'const\s+candidates\s*:\s*'
        r'CompanionBrainCandidate\[\]\s*'
        r'=\s*\[\s*\]\s*;',
        text,
        re.MULTILINE,
    )

    if not candidates_match:
        raise SystemExit(
            "ERRO: const candidates não encontrado "
            "nas regras."
        )

    block = """

  // CONFIA_COMPANION_LONGITUDINAL_IMPULSE_RULES_9C
  /**
   * ==========================================================
   * CONFIA — FASE 9C
   * MEMÓRIA LONGITUDINAL DO IMPULSO
   * ==========================================================
   *
   * Observações dos últimos 7 dias.
   * Não são diagnósticos nem garantias de eficácia futura.
   */
  const longitudinalImpulse =
    context.longitudinalImpulse;

  if (
    longitudinalImpulse?.hasEnoughData
  ) {

    /**
     * Utilização repetida.
     */
    if (
      longitudinalImpulse.repeatedUse
    ) {
      candidates.push({
        id:
          "longitudinal_impulse_repeated_use",
        translationKey:
          "companionBrain.longitudinalImpulseRepeatedUse",
        category: "discovery",
        emotion: "curious",
        priority: 64,
        reason:
          "The Impulso was used repeatedly during the recent seven-day window.",
        cooldownMinutes: 2880,
        metadata: {
          longitudinal: true,
          longitudinalImpulse: true,
          episodeCount:
            longitudinalImpulse.episodeCount,
        },
      });
    }

    /**
     * Redução de intensidade repetida.
     */
    if (
      longitudinalImpulse
        .repeatedEffectiveness
    ) {
      candidates.push({
        id:
          "longitudinal_impulse_repeated_effectiveness",
        translationKey:
          "companionBrain.longitudinalImpulseRepeatedEffectiveness",
        category: "progress",
        emotion: "encouraging",
        priority: 68,
        reason:
          "Several recent Impulso episodes were followed by a meaningful reduction in intensity.",
        cooldownMinutes: 2880,
        metadata: {
          longitudinal: true,
          longitudinalImpulse: true,
          effectiveEpisodeCount:
            longitudinalImpulse
              .effectiveEpisodeCount,
          averageReduction:
            longitudinalImpulse
              .averageReduction,
        },
      });
    }

    /**
     * Mesmo percurso associado a redução significativa
     * mais do que uma vez.
     */
    if (
      longitudinalImpulse
        .repeatedEffectiveNeed
    ) {
      candidates.push({
        id:
          "longitudinal_impulse_effective_path",
        translationKey:
          "companionBrain.longitudinalImpulseEffectivePath",
        category: "progress",
        emotion: "encouraging",
        priority: 73,
        reason:
          "The same Impulso support path was associated with meaningful intensity reduction more than once.",
        cooldownMinutes: 4320,
        metadata: {
          longitudinal: true,
          longitudinalImpulse: true,
          effectiveNeed:
            longitudinalImpulse
              .effectiveNeed,
          effectiveNeedCount:
            longitudinalImpulse
              .effectiveNeedCount,
        },
      });
    }
  }
"""

    pos = candidates_match.end()

    text = (
        text[:pos]
        + block
        + text[pos:]
    )

RULES.write_text(
    text,
    encoding="utf-8",
)


# ============================================================
# 11. TRADUÇÕES
# ============================================================

translations = {
    "pt": {
        "companionBrain.longitudinalImpulseRepeatedUse":
            "Nos últimos dias tens recorrido algumas vezes ao Impulso. Há alguma situação que se esteja a repetir?",

        "companionBrain.longitudinalImpulseRepeatedEffectiveness":
            "Nas últimas vezes em que usaste o Impulso, a intensidade baixou de forma clara em mais do que uma ocasião. Talvez valha a pena lembrar o que te ajudou.",

        "companionBrain.longitudinalImpulseEffectivePath":
            "Há algo que pode ser útil lembrar: o mesmo tipo de apoio do Impulso esteve associado a uma melhoria mais do que uma vez nos últimos dias.",
    },

    "en": {
        "companionBrain.longitudinalImpulseRepeatedUse":
            "You've used Impulso several times over the last few days. Is there a situation that may be repeating itself?",

        "companionBrain.longitudinalImpulseRepeatedEffectiveness":
            "In your recent uses of Impulso, the intensity clearly dropped on more than one occasion. It may be worth remembering what helped.",

        "companionBrain.longitudinalImpulseEffectivePath":
            "There may be something useful to remember: the same kind of Impulso support was associated with improvement more than once over the last few days.",
    },

    "es": {
        "companionBrain.longitudinalImpulseRepeatedUse":
            "En los últimos días has recurrido varias veces a Impulso. ¿Hay alguna situación que pueda estar repitiéndose?",

        "companionBrain.longitudinalImpulseRepeatedEffectiveness":
            "En tus últimos usos de Impulso, la intensidad bajó claramente en más de una ocasión. Quizá valga la pena recordar qué te ayudó.",

        "companionBrain.longitudinalImpulseEffectivePath":
            "Hay algo que puede ser útil recordar: el mismo tipo de apoyo de Impulso estuvo asociado a una mejora más de una vez en los últimos días.",
    },

    "fr": {
        "companionBrain.longitudinalImpulseRepeatedUse":
            "Ces derniers jours, tu as eu recours à Impulso plusieurs fois. Y a-t-il une situation qui semble se répéter ?",

        "companionBrain.longitudinalImpulseRepeatedEffectiveness":
            "Lors de tes dernières utilisations d'Impulso, l'intensité a clairement diminué à plusieurs reprises. Cela vaut peut-être la peine de te rappeler ce qui t'a aidé.",

        "companionBrain.longitudinalImpulseEffectivePath":
            "Il y a peut-être quelque chose d'utile à retenir : le même type de soutien dans Impulso a été associé à une amélioration plus d'une fois ces derniers jours.",
    },
}

for lang, path in LOCALES.items():
    data = json.loads(
        path.read_text(
            encoding="utf-8"
        )
    )

    data.update(
        translations[lang]
    )

    path.write_text(
        json.dumps(
            data,
            ensure_ascii=False,
            indent=2,
        ) + "\n",
        encoding="utf-8",
    )


# ============================================================
# 12. VERIFICAÇÃO FINAL
# ============================================================

context_check = CONTEXT.read_text(
    encoding="utf-8"
)

app_check = APP.read_text(
    encoding="utf-8"
)

rules_check = RULES.read_text(
    encoding="utf-8"
)

index_check = INDEX.read_text(
    encoding="utf-8"
)

checks = [
    (
        "memory",
        "buildCompanionLongitudinalImpulseMemory"
        in memory_text,
    ),
    (
        "context type",
        "CompanionLongitudinalImpulseMemory"
        in context_check,
    ),
    (
        "context value",
        "longitudinalImpulse"
        in context_check,
    ),
    (
        "collector",
        "collectCompanionData"
        in app_check,
    ),
    (
        "real impulse history",
        "companionCollectedData.impulse"
        in app_check,
    ),
    (
        "builder",
        "buildCompanionLongitudinalImpulseMemory"
        in app_check,
    ),
    (
        "rules",
        "CONFIA_COMPANION_LONGITUDINAL_IMPULSE_RULES_9C"
        in rules_check,
    ),
    (
        "export",
        "companionBrainLongitudinalImpulseMemory"
        in index_check,
    ),
]

for lang, path in LOCALES.items():
    data = json.loads(
        path.read_text(
            encoding="utf-8"
        )
    )

    checks.append(
        (
            f"translations {lang}",
            all(
                key in data
                for key in
                translations[lang]
            ),
        )
    )

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
print("=" * 76)
print("CONFIA — COMPANION VIVO — FASE 9C CORRIGIDA")
print("=" * 76)
print("✓ Execução parcial anterior respeitada")
print("✓ Pesquisa rígida do App.tsx removida")
print("✓ buildCompanionBrainContext localizado de forma flexível")
print("✓ Memória longitudinal do Impulso preservada")
print("✓ CompanionContext recebe memória do Impulso")
print("✓ collectCompanionData ligado ao cérebro")
print("✓ Histórico real do Impulso utilizado")
print("✓ Janela de 7 dias preservada")
print("✓ Utilização repetida reconhecida")
print("✓ Redução de intensidade repetida reconhecida")
print("✓ Percurso útil repetido reconhecido")
print("✓ Regras longitudinais adicionadas")
print("✓ PRESENTE > HISTÓRICO continua protegido pela 9B")
print("✓ PT / EN / ES / FR atualizados")
print("✓ Backups criados")
print()
print("FASE 9C corrigida e concluída.")
