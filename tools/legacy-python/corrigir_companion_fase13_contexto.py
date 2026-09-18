from pathlib import Path
from datetime import datetime
import shutil

TEST = Path(
    "src/data/reactive/companionBrain/"
    "companionBrainManualTest.ts"
)

if not TEST.exists():
    raise SystemExit(
        f"ERRO: ficheiro não encontrado: {TEST}"
    )

stamp = datetime.now().strftime(
    "%Y%m%d_%H%M%S"
)

backup = TEST.with_name(
    f"{TEST.name}.before_fase13_context_fix_{stamp}"
)

shutil.copy2(
    TEST,
    backup,
)

text = TEST.read_text(
    encoding="utf-8"
)


# ============================================================
# 1. INSERIR MEMÓRIA LONGITUDINAL NEUTRA
# ============================================================

anchor = '''const scenarios: SimulationScenario[] = [
'''

neutral_block = '''/**
 * ============================================================
 * MEMÓRIA LONGITUDINAL NEUTRA
 * ============================================================
 *
 * A Fase 13 está a testar comportamento diário/temporal,
 * não padrões históricos.
 *
 * O Brain real recebe sempre longitudinalMood através do App.
 * No simulador fornecemos explicitamente um estado
 * "insufficient" para não ativar regras históricas.
 */
const neutralLongitudinalMood: any = {
  trend: "insufficient",

  daysAnalyzed: 0,
  ratingDays: 0,

  averageMorning: null,
  averageAfternoon: null,

  recoveryDays: 0,
  harderDays: 0,

  lowMorningCount: 0,

  repeatedLowMornings: false,
  repeatedRecoveries: false,

  lowMorningRelevance:
    "insufficient",

  recoveryRelevance:
    "insufficient",

  hasEnoughData: false,
};


/**
 * Memória longitudinal do Impulso também neutra.
 *
 * Não queremos que os cenários da Fase 13 sejam contaminados
 * por padrões históricos que não fazem parte do caso testado.
 */
const neutralLongitudinalImpulse: any = {
  episodeCount: 0,
  measurableEpisodeCount: 0,

  effectiveEpisodeCount: 0,
  partialEpisodeCount: 0,

  averageReduction: null,

  repeatedNeed: false,
  repeatedUse: false,
  repeatedEffectiveness: false,
  repeatedEffectiveNeed: false,

  effectiveNeed: undefined,
  effectiveNeedCount: 0,

  hasEnoughData: false,
};


'''

if "const neutralLongitudinalMood" not in text:
    if anchor not in text:
        raise SystemExit(
            "ERRO: ponto para inserir memória neutra "
            "não encontrado."
        )

    text = text.replace(
        anchor,
        neutral_block + anchor,
        1,
    )


# ============================================================
# 2. PASSAR longitudinalMood AO CONTEXTO
# ============================================================

old = '''        recentEvents:
          contextRecentEvents,
      });
'''

new = '''        recentEvents:
          contextRecentEvents,

        /**
         * O App real fornece estas memórias.
         *
         * Para a simulação diária usamos versões neutras,
         * impedindo padrões históricos artificiais.
         */
        longitudinalMood:
          neutralLongitudinalMood,

        longitudinalImpulse:
          neutralLongitudinalImpulse,
      });
'''

if old not in text:
    raise SystemExit(
        "ERRO: chamada buildCompanionBrainContext "
        "não encontrada no formato esperado."
    )

text = text.replace(
    old,
    new,
    1,
)


TEST.write_text(
    text,
    encoding="utf-8"
)


# ============================================================
# 3. VERIFICAÇÃO
# ============================================================

check = TEST.read_text(
    encoding="utf-8"
)

checks = [
    (
        "neutral mood",
        "const neutralLongitudinalMood"
        in check,
    ),
    (
        "mood insufficient",
        'lowMorningRelevance:' in check
        and '"insufficient"' in check,
    ),
    (
        "mood hasEnoughData false",
        "hasEnoughData: false"
        in check,
    ),
    (
        "neutral impulse",
        "const neutralLongitudinalImpulse"
        in check,
    ),
    (
        "context mood passed",
        "longitudinalMood:\n"
        "          neutralLongitudinalMood"
        in check,
    ),
    (
        "context impulse passed",
        "longitudinalImpulse:\n"
        "          neutralLongitudinalImpulse"
        in check,
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
print("=" * 76)
print("CONFIA — COMPANION VIVO — FASE 13 — CORREÇÃO DO SIMULADOR")
print("=" * 76)
print("✓ longitudinalMood neutro adicionado")
print("✓ longitudinalImpulse neutro adicionado")
print("✓ hasEnoughData = false")
print("✓ padrões históricos não contaminam os 15 cenários")
print("✓ Brain real não foi alterado")
print("✓ regras não foram alteradas")
print("✓ contexto passa a respeitar o contrato real do App")
print("✓ backup criado")
print()
print("Correção concluída.")
print()
print("Executar novamente:")
print()
print(
    "npx tsx "
    "src/data/reactive/companionBrain/"
    "companionBrainManualTest.ts"
)
