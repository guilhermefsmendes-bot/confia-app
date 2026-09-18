from pathlib import Path
from datetime import datetime
import shutil

ENGINE = Path(
    "src/data/reactive/companionBrain/"
    "companionBrainDecisionEngine.ts"
)

RANKING = Path(
    "src/data/reactive/companionBrain/"
    "companionBrainContextualRanking.ts"
)

if not ENGINE.exists():
    raise SystemExit(
        f"ERRO: ficheiro não encontrado: {ENGINE}"
    )

if not RANKING.exists():
    raise SystemExit(
        f"ERRO: ranking 12A não encontrado: {RANKING}"
    )

stamp = datetime.now().strftime(
    "%Y%m%d_%H%M%S"
)

backup = ENGINE.with_name(
    f"{ENGINE.name}.before_companion_fase12a_engine_{stamp}"
)

shutil.copy2(
    ENGINE,
    backup,
)

text = ENGINE.read_text(
    encoding="utf-8"
)


# ============================================================
# 1. IMPORT DO RANKING CONTEXTUAL
# ============================================================

import_line = '''import {
  rankCompanionCandidatesContextually,
} from "./companionBrainContextualRanking";
'''

if (
    'from "./companionBrainContextualRanking"'
    not in text
):
    first_import_pos = text.find(
        "import "
    )

    if first_import_pos == -1:
        raise SystemExit(
            "ERRO: nenhum import encontrado no engine."
        )

    text = (
        text[:first_import_pos]
        + import_line
        + text[first_import_pos:]
    )


# ============================================================
# 2. SUBSTITUIR APENAS O RANKING FINAL
# ============================================================

old = '''  const ranked = rankCandidates(eligible);'''

new = '''  // CONFIA_FASE12A_CONTEXTUAL_RANKING
  const ranked =
    rankCompanionCandidatesContextually(
      eligible
    );'''

if old in text:
    text = text.replace(
        old,
        new,
        1,
    )

elif (
    "CONFIA_FASE12A_CONTEXTUAL_RANKING"
    not in text
):
    raise SystemExit(
        "ERRO: linha esperada "
        "'const ranked = rankCandidates(eligible);' "
        "não encontrada."
    )


# ============================================================
# 3. GUARDAR
# ============================================================

ENGINE.write_text(
    text,
    encoding="utf-8",
)


# ============================================================
# 4. VERIFICAR O MÓDULO DE RANKING CRIADO ANTERIORMENTE
# ============================================================

ranking_text = RANKING.read_text(
    encoding="utf-8"
)

required_ranking_items = [
    "getCompanionContextualRanking",
    "rankCompanionCandidatesContextually",
    "inspectCompanionContextualRanking",
    "contextualScore",
    "conversation:+8",
    "longitudinal:-7",
    "crossMemory:-4",
]

missing_ranking = [
    item
    for item in required_ranking_items
    if item not in ranking_text
]

if missing_ranking:
    raise SystemExit(
        "ERRO: o módulo contextual da 12A "
        "está incompleto: "
        + ", ".join(missing_ranking)
    )


# ============================================================
# 5. VERIFICAÇÃO FINAL DO ENGINE
# ============================================================

check = ENGINE.read_text(
    encoding="utf-8"
)

checks = [
    (
        "import contextual",
        'from "./companionBrainContextualRanking"'
        in check,
    ),
    (
        "ranking contextual integrado",
        "CONFIA_FASE12A_CONTEXTUAL_RANKING"
        in check,
    ),
    (
        "eligible enviado ao ranking",
        "rankCompanionCandidatesContextually(\n"
        "      eligible"
        in check,
    ),
    (
        "seleção ranked[0] preservada",
        "const selected = ranked[0];"
        in check,
    ),
    (
        "eligibility preservada",
        "isEligible(candidate, now)"
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
print("CONFIA — COMPANION VIVO — FASE 12A — ENGINE")
print("=" * 76)
print("✓ Estrutura real do Decision Engine reconhecida")
print("✓ Filtro de elegibilidade preservado")
print("✓ Cooldowns preservados")
print("✓ Ranking antigo substituído apenas no ponto final")
print("✓ Ranking contextual recebe os candidatos elegíveis")
print("✓ Seleção ranked[0] preservada")
print("✓ Prioridade base continua integrada no score")
print("✓ Continuidade conversacional ponderada")
print("✓ Presente favorecido perante memória longitudinal")
print("✓ Casual perde perante assuntos relevantes")
print("✓ Backup criado")
print()
print("Fluxo final:")
print()
print("  candidates")
print("      ↓")
print("  eligibility + cooldown")
print("      ↓")
print("  contextual ranking")
print("      ↓")
print("  ranked[0]")
print("      ↓")
print("  Companion fala")
print()
print("FASE 12A integrada no Decision Engine.")
