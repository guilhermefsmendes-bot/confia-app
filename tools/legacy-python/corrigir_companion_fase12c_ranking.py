from pathlib import Path
from datetime import datetime
import shutil

RANKING = Path(
    "src/data/reactive/companionBrain/"
    "companionBrainContextualRanking.ts"
)

if not RANKING.exists():
    raise SystemExit(
        f"ERRO: ficheiro não encontrado: {RANKING}"
    )

stamp = datetime.now().strftime("%Y%m%d_%H%M%S")

backup = RANKING.with_name(
    f"{RANKING.name}.before_companion_fase12c_fix_{stamp}"
)

shutil.copy2(
    RANKING,
    backup,
)

text = RANKING.read_text(
    encoding="utf-8"
)


# ============================================================
# 1. SUBSTITUIR A FUNÇÃO 12B POR DECAIMENTO SEMÂNTICO 12C
# ============================================================

old = '''function getRecencyModifier(
  ageMinutes: number
): number {
  /**
   * Recência é um desempate contextual,
   * não substitui importância emocional.
   */
  if (ageMinutes <= 2) {
    return 8;
  }

  if (ageMinutes <= 5) {
    return 6;
  }

  if (ageMinutes <= 10) {
    return 4;
  }

  if (ageMinutes <= 20) {
    return 2;
  }

  if (ageMinutes <= 30) {
    return 0;
  }

  if (ageMinutes <= 45) {
    return -3;
  }

  return -6;
}'''

new = '''function getRecencyModifier(
  ageMinutes: number,
  sourceEventType?: string
): number {
  /**
   * ==========================================================
   * CONFIA — FASE 12C
   * DECAIMENTO TEMPORAL SEMÂNTICO
   * ==========================================================
   *
   * Nem todos os eventos envelhecem da mesma forma.
   *
   * Um toque no avatar é muito efémero.
   * Um regresso ao Home mantém algum contexto
   * durante mais alguns minutos.
   *
   * A curva genérica da 12B continua disponível
   * para futuros eventos.
   */

  if (
    sourceEventType === "avatar_tapped"
  ) {
    if (ageMinutes <= 1) {
      return 8;
    }

    if (ageMinutes <= 3) {
      return 5;
    }

    if (ageMinutes <= 5) {
      return 2;
    }

    if (ageMinutes <= 10) {
      return -2;
    }

    return -8;
  }

  if (
    sourceEventType === "home_returned"
  ) {
    if (ageMinutes <= 2) {
      return 7;
    }

    if (ageMinutes <= 5) {
      return 5;
    }

    if (ageMinutes <= 10) {
      return 2;
    }

    if (ageMinutes <= 20) {
      return 0;
    }

    if (ageMinutes <= 30) {
      return -3;
    }

    return -7;
  }

  /**
   * Fallback genérico:
   * comportamento original da Fase 12B.
   */
  if (ageMinutes <= 2) {
    return 8;
  }

  if (ageMinutes <= 5) {
    return 6;
  }

  if (ageMinutes <= 10) {
    return 4;
  }

  if (ageMinutes <= 20) {
    return 2;
  }

  if (ageMinutes <= 30) {
    return 0;
  }

  if (ageMinutes <= 45) {
    return -3;
  }

  return -6;
}'''

if old not in text:
    raise SystemExit(
        "ERRO: função getRecencyModifier da 12B "
        "não encontrada exatamente como esperado."
    )

text = text.replace(
    old,
    new,
    1,
)


# ============================================================
# 2. PASSAR sourceEventType À FUNÇÃO
# ============================================================

old = '''    const recencyModifier =
      getRecencyModifier(
        sourceEventAgeMinutes
      );'''

new = '''    const sourceEventType =
      readMetadataString(
        candidate,
        "sourceEventType"
      );

    const recencyModifier =
      getRecencyModifier(
        sourceEventAgeMinutes,
        sourceEventType
      );'''

if old not in text:
    raise SystemExit(
        "ERRO: chamada getRecencyModifier da 12B "
        "não encontrada."
    )

text = text.replace(
    old,
    new,
    1,
)


# ============================================================
# 3. MELHORAR DIAGNÓSTICO
# ============================================================

old = '''    modifiers.push(
      `recency:${recencyModifier}`
    );'''

new = '''    modifiers.push(
      `recency:${recencyModifier}`
    );

    if (sourceEventType) {
      modifiers.push(
        `eventType:${sourceEventType}`
      );
    }'''

if old not in text:
    raise SystemExit(
        "ERRO: diagnóstico recency "
        "não encontrado."
    )

text = text.replace(
    old,
    new,
    1,
)


# ============================================================
# 4. GUARDAR
# ============================================================

RANKING.write_text(
    text,
    encoding="utf-8",
)


# ============================================================
# 5. VERIFICAÇÕES
# ============================================================

check = RANKING.read_text(
    encoding="utf-8"
)

checks = [
    (
        "assinatura sourceEventType",
        "sourceEventType?: string"
        in check,
    ),
    (
        "avatar curve",
        'sourceEventType === "avatar_tapped"'
        in check,
    ),
    (
        "home curve",
        'sourceEventType === "home_returned"'
        in check,
    ),
    (
        "avatar decay",
        "return -8;"
        in check,
    ),
    (
        "home decay",
        "return -7;"
        in check,
    ),
    (
        "sourceEventType lido",
        '"sourceEventType"'
        in check,
    ),
    (
        "sourceEventType passado",
        "sourceEventAgeMinutes,\n        sourceEventType"
        in check,
    ),
    (
        "diagnóstico eventType",
        "`eventType:${sourceEventType}`"
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
print("CONFIA — COMPANION VIVO — FASE 12C — CORREÇÃO")
print("=" * 76)
print("✓ Regras 12C existentes preservadas")
print("✓ Ranking 12B reconhecido exatamente")
print("✓ sourceEventType integrado no ranking")
print("✓ avatar_tapped usa curva própria")
print("✓ home_returned usa curva própria")
print("✓ Curva genérica 12B preservada")
print("✓ Diagnóstico eventType adicionado")
print("✓ Backup criado")
print()
print("avatar_tapped")
print("  0–1 min   → +8")
print("  1–3 min   → +5")
print("  3–5 min   → +2")
print("  5–10 min  → -2")
print("  >10 min   → -8")
print()
print("home_returned")
print("  0–2 min   → +7")
print("  2–5 min   → +5")
print("  5–10 min  → +2")
print("  10–20 min → 0")
print("  20–30 min → -3")
print("  >30 min   → -7")
print()
print("FASE 12C concluída.")
