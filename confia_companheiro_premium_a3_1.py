from pathlib import Path
import sys

TARGET = Path(
    "src/data/reactive/companionReactionEngine.ts"
)

if TARGET.exists():
    print(
        "ERRO: companionReactionEngine.ts já existe. "
        "Não vou sobrescrever."
    )
    sys.exit(1)

TARGET.parent.mkdir(parents=True, exist_ok=True)

code = r'''/**
 * ============================================================
 * CONFIA — COMPANION REACTION ENGINE A3.1
 * ============================================================
 *
 * Esta camada NÃO analisa novamente o utilizador.
 *
 * O Reactive Engine continua a ser a fonte de verdade.
 *
 * Responsabilidade desta camada:
 *
 *   ReactiveResult
 *        ↓
 *   comportamento visível da CONFIA
 *
 * Define:
 * - estado visual;
 * - postura emocional;
 * - tipo de reação;
 * - prioridade;
 * - intensidade visual.
 *
 * Não:
 * - grava dados;
 * - lê localStorage;
 * - cria timers;
 * - calcula padrões;
 * - diagnostica o utilizador;
 * - substitui o Reactive Engine.
 */

import type {
  ReactiveResult,
  ReactiveSituation,
} from "./reactiveTypes";

export type CompanionReactionState =
  | "neutral"
  | "welcoming"
  | "supportive"
  | "curious"
  | "celebrating";

export type CompanionReactionKind =
  | "presence"
  | "discovery"
  | "support"
  | "encouragement"
  | "celebration"
  | "reflection"
  | "welcome_back";

export interface CompanionReaction {
  state: CompanionReactionState;

  kind: CompanionReactionKind;

  /**
   * 0–100.
   *
   * Serve apenas para a camada de apresentação decidir
   * quão expressiva pode ser a reação.
   */
  priority: number;

  /**
   * Intensidade VISUAL.
   *
   * Não representa intensidade psicológica.
   */
  visualIntensity:
    | "quiet"
    | "normal"
    | "strong";

  /**
   * Situação que originou a reação.
   *
   * Útil para debug e futura memória conversacional.
   */
  sourceSituation: ReactiveSituation;

  /**
   * A resposta continua a vir do Reactive Engine.
   *
   * Esta camada não cria uma segunda biblioteca de frases.
   */
  response: ReactiveResult["response"];

  confidence: number;
}

/**
 * Traduz uma situação já identificada pelo Reactive Engine
 * para comportamento do companheiro.
 */
function resolveReactionPresentation(
  situation: ReactiveSituation
): Pick<
  CompanionReaction,
  "state" | "kind" | "priority" | "visualIntensity"
> {
  switch (situation) {
    /*
     * ========================================================
     * APOIO
     * ========================================================
     *
     * A CONFIA não imita tristeza.
     * Mantém-se calma, próxima e disponível.
     */

    case "mood_low":
      return {
        state: "supportive",
        kind: "support",
        priority: 100,
        visualIntensity: "strong",
      };

    case "mood_declining":
      return {
        state: "supportive",
        kind: "support",
        priority: 95,
        visualIntensity: "normal",
      };

    case "objectives_declining":
      return {
        state: "supportive",
        kind: "encouragement",
        priority: 84,
        visualIntensity: "normal",
      };

    case "impulse_not_effective":
      return {
        state: "supportive",
        kind: "support",
        priority: 98,
        visualIntensity: "strong",
      };

    case "impulse_partially_effective":
      return {
        state: "supportive",
        kind: "encouragement",
        priority: 90,
        visualIntensity: "normal",
      };

    /*
     * ========================================================
     * CELEBRAÇÃO
     * ========================================================
     */

    case "objective_completed":
      return {
        state: "celebrating",
        kind: "celebration",
        priority: 100,
        visualIntensity: "strong",
      };

    case "mood_high":
      return {
        state: "celebrating",
        kind: "celebration",
        priority: 88,
        visualIntensity: "normal",
      };

    case "mood_improving":
      return {
        state: "celebrating",
        kind: "encouragement",
        priority: 91,
        visualIntensity: "normal",
      };

    case "objectives_improving":
      return {
        state: "celebrating",
        kind: "celebration",
        priority: 90,
        visualIntensity: "normal",
      };

    case "objectives_consistent":
      return {
        state: "welcoming",
        kind: "encouragement",
        priority: 80,
        visualIntensity: "quiet",
      };

    case "impulse_effective":
      return {
        state: "celebrating",
        kind: "encouragement",
        priority: 94,
        visualIntensity: "normal",
      };

    case "consistent_use":
      return {
        state: "welcoming",
        kind: "encouragement",
        priority: 78,
        visualIntensity: "quiet",
      };

    /*
     * ========================================================
     * REGRESSO
     * ========================================================
     *
     * Nunca culpabilizar.
     * Nunca falar em "abandono".
     * Nunca fazer o companheiro regredir.
     */

    case "return_after_absence":
      return {
        state: "welcoming",
        kind: "welcome_back",
        priority: 96,
        visualIntensity: "strong",
      };

    /*
     * ========================================================
     * DESCOBERTA / CURIOSIDADE
     * ========================================================
     */

    case "first_mood_record":
      return {
        state: "curious",
        kind: "discovery",
        priority: 82,
        visualIntensity: "normal",
      };

    case "first_use":
      return {
        state: "welcoming",
        kind: "discovery",
        priority: 75,
        visualIntensity: "normal",
      };

    case "multiple_signals":
      return {
        state: "curious",
        kind: "reflection",
        priority: 70,
        visualIntensity: "quiet",
      };

    /*
     * ========================================================
     * CALMA / PRESENÇA
     * ========================================================
     */

    case "mood_stable":
      return {
        state: "neutral",
        kind: "presence",
        priority: 55,
        visualIntensity: "quiet",
      };

    case "no_data":
      return {
        state: "welcoming",
        kind: "discovery",
        priority: 50,
        visualIntensity: "quiet",
      };

    default:
      return {
        state: "neutral",
        kind: "presence",
        priority: 40,
        visualIntensity: "quiet",
      };
  }
}

/**
 * Função pública.
 *
 * Recebe o resultado FINAL do Reactive Engine.
 * Não volta a analisar os dados.
 */
export function resolveCompanionReaction(
  reactiveResult: ReactiveResult
): CompanionReaction {
  const presentation =
    resolveReactionPresentation(
      reactiveResult.situation
    );

  return {
    ...presentation,

    sourceSituation:
      reactiveResult.situation,

    response:
      reactiveResult.response,

    confidence:
      reactiveResult.confidence,
  };
}
'''

TARGET.write_text(code, encoding="utf-8")

written = TARGET.read_text(encoding="utf-8")

checks = {
    "Motor criado":
        "resolveCompanionReaction" in written,

    "ReactiveResult usado":
        "ReactiveResult" in written,

    "Sem localStorage":
        "localStorage.getItem(" not in written and "localStorage.setItem(" not in written,

    "Sem timer":
        "setTimeout(" not in written,

    "Sem interval":
        "setInterval(" not in written,

    "Sem rAF":
        "requestAnimationFrame(" not in written,

    "Sem canvas":
        "<canvas" not in written,

    "Regresso suportado":
        'case "return_after_absence"' in written,

    "Humor baixo suportado":
        'case "mood_low"' in written,

    "Objetivo concluído suportado":
        'case "objective_completed"' in written,

    "Impulso suportado":
        'case "impulse_effective"' in written,

    "Resposta original preservada":
        'reactiveResult.response' in written,
}

failed = [
    name
    for name, ok in checks.items()
    if not ok
]

if failed:
    TARGET.unlink(missing_ok=True)

    print("ERRO: validação falhou.")

    for item in failed:
        print(" -", item)

    print()
    print("Ficheiro removido automaticamente.")
    sys.exit(1)

print("=" * 76)
print("CONFIA — COMPANHEIRO PREMIUM A3.1")
print("=" * 76)
print()
print("✓ Companion Reaction Engine criado")
print("✓ Reactive Engine permanece como cérebro")
print("✓ Nenhuma análise duplicada")
print("✓ Humor baixo -> supportive")
print("✓ Queda -> supportive")
print("✓ Melhoria -> celebrating")
print("✓ Humor alto -> celebrating")
print("✓ Objetivo concluído -> celebrating")
print("✓ Objetivos em queda -> supportive")
print("✓ Impulso eficaz -> celebrating")
print("✓ Impulso pouco eficaz -> supportive")
print("✓ Regresso após ausência -> welcoming")
print("✓ Primeiro contacto -> welcoming / curious")
print("✓ Situações ambíguas -> curious")
print("✓ Estado estável -> neutral")
print("✓ Resposta textual original preservada")
print("✓ Confiança preservada")
print("✓ Nenhum localStorage novo")
print("✓ Nenhum timer")
print("✓ Nenhum setInterval")
print("✓ Nenhum requestAnimationFrame")
print("✓ Nenhum canvas")
print("✓ Nenhuma dependência nova")
print()
print("Ficheiro:")
print(f"  {TARGET}")
print()
print("A3.1 criado — ainda NÃO ligado à interface.")
print("=" * 76)
