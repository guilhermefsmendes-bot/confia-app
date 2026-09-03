import React, { memo } from "react";

export type ConfiaCreatureState =
  | "neutral"
  | "welcoming"
  | "supportive"
  | "curious"
  | "celebrating";

interface ConfiaCreatureProps {
  level: number;
  state?: ConfiaCreatureState;
  reacting?: boolean;
  equippedAccessoryIds?: string[];
}

/**
 * ============================================================
 * CONFIA — CRIATURA PREMIUM A2.2
 * ============================================================
 *
 * Espécie visual própria da CONFIA.
 *
 * PERFORMANCE:
 * - SVG puro
 * - zero timers
 * - zero intervalos
 * - zero requestAnimationFrame
 * - zero canvas
 * - zero partículas
 * - zero animações infinitas
 *
 * A sensação de vida é obtida através de:
 * - expressão
 * - postura
 * - evolução
 * - micro-reação acionada externamente
 */

function ConfiaCreature({
  level,
  state = "neutral",
  reacting = false,
  equippedAccessoryIds = [],
}: ConfiaCreatureProps) {
  const safeLevel = Math.max(
    1,
    Math.min(10, level)
  );

  /*
   * 1       Ovo
   * 2–3     Nascente
   * 4–5     Pequena CONFIA
   * 6–8     Jovem CONFIA
   * 9–10    CONFIA adulta
   */
  const stage =
    safeLevel === 1
      ? 1
      : safeLevel <= 3
        ? 2
        : safeLevel <= 5
          ? 3
          : safeLevel <= 8
            ? 4
            : 5;

  const isEgg = stage === 1;

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
    );

  const bodyScale =
    stage === 2
      ? 0.84
      : stage === 3
        ? 0.91
        : stage === 4
          ? 0.97
          : 1.02;

  /**
   * ==========================================================
   * A4.1 — ASSINATURA VISUAL DAS 5 FORMAS
   * ==========================================================
   *
   * Não são cinco SVGs.
   *
   * A espécie continua a ser a mesma, mas cada etapa ganha
   * proporções próprias.
   *
   * 1 — Ovo
   * 2 — Nascente
   * 3 — Pequena CONFIA
   * 4 — Jovem CONFIA
   * 5 — CONFIA Adulta
   */

  const evolutionHeadScale =
    stage === 2
      ? 1.055
      : stage === 3
        ? 1.025
        : stage === 4
          ? 0.99
          : 0.965;

  const evolutionBodyStretch =
    stage === 2
      ? 0.94
      : stage === 3
        ? 0.98
        : stage === 4
          ? 1.025
          : 1.055;

  const evolutionEarScale =
    stage === 2
      ? 0.82
      : stage === 3
        ? 0.92
        : stage === 4
          ? 1.03
          : 1.10;

  const evolutionEyeScale =
    stage === 2
      ? 1.08
      : stage === 3
        ? 1.04
        : stage === 4
          ? 1
          : 0.97;

  /**
   * ==========================================================
   * A4.3 — MICROPROGRESSÃO DOS 10 NÍVEIS
   * ==========================================================
   *
   * As grandes mudanças continuam a ser as 5 formas.
   * Estes valores dão apenas uma pequena recompensa visual
   * entre níveis pertencentes à mesma forma.
   */

  const levelFlameBoost =
    safeLevel === 3
      ? 1.025
      : safeLevel === 5
        ? 1.035
        : safeLevel === 7
          ? 1.025
          : safeLevel === 8
            ? 1.055
            : safeLevel === 10
              ? 1.065
              : 1;

  const levelMarkOpacity =
    safeLevel === 2
      ? 0.30
      : safeLevel === 3
        ? 0.46
        : safeLevel === 4
          ? 0.30
          : safeLevel === 5
            ? 0.48
            : safeLevel === 6
              ? 0.36
              : safeLevel === 7
                ? 0.46
                : safeLevel === 8
                  ? 0.58
                  : safeLevel === 9
                    ? 0.48
                    : safeLevel === 10
                      ? 0.66
                      : 0.38;

  const levelTailBoost =
    safeLevel === 5
      ? 1.035
      : safeLevel === 7
        ? 1.025
        : safeLevel === 8
          ? 1.05
          : safeLevel === 10
            ? 1.045
            : 1;

  const eyeY =
    state === "supportive"
      ? 103
      : state === "curious"
        ? 99
        : 101;

  const eyeRY =
    state === "supportive"
      ? 7
      : state === "curious"
        ? 10
        : 9;

  const mouth =
    state === "supportive"
      ? "M101 119 Q110 116 119 119"
      : state === "curious"
        ? "M106 119 Q110 122 114 119"
        : state === "celebrating"
          ? "M99 116 Q110 128 121 116"
          : state === "welcoming"
            ? "M100 117 Q110 126 120 117"
            : "M102 118 Q110 124 118 118";

  const cheekOpacity =
    state === "celebrating" ||
    state === "welcoming"
      ? 0.38
      : state === "supportive"
        ? 0.18
        : 0.25;

  /**
   * A3.4 — linguagem corporal contextual.
   *
   * São transformações ESTÁTICAS.
   * Mudam apenas quando muda o estado reativo.
   * Não existe loop de animação.
   */
  const reactionTransform =
    state === "supportive"
      ? "translate(0 3)"
      : state === "curious"
        ? "translate(2 -2) rotate(1 110 110)"
        : state === "welcoming"
          ? "translate(0 -2)"
          : state === "celebrating"
            ? "translate(0 -4)"
            : "translate(0 0)";

  const reactionOpacity =
    state === "supportive"
      ? 0.97
      : 1;

  const flameReactionScale =
    state === "celebrating"
      ? 1.08
      : state === "welcoming"
        ? 1.04
        : state === "supportive"
          ? 0.96
          : 1;

  const flameScale =
    stage === 2
      ? 0.68
      : stage === 3
        ? 0.82
        : stage === 4
          ? 0.94
          : 1.08;

  return (
    <div
      style={{
        transform:
          state === "supportive"
            ? "translateY(3px)"
            : state === "curious"
              ? "translate(2px, -2px) rotate(1deg)"
              : state === "welcoming"
                ? "translateY(-2px)"
                : state === "celebrating"
                  ? "translateY(-4px)"
                  : "none",
        opacity: reactionOpacity,
        transformOrigin: "50% 80%",
      }}
      className={`
        relative
        flex
        items-center
        justify-center
        transition-transform
        duration-300
        ease-out
        will-change-auto
        ${
          reacting
            ? "-translate-y-2 scale-[1.045]"
            : ""
        }
      `}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 220 220"
        className="
          h-[245px]
          w-[245px]
          max-w-full
          select-none
          overflow-visible
          drop-shadow-[0_16px_18px_rgba(105,65,50,0.13)]
        "
      >
        <defs>
          {/* Corpo quente e orgânico */}
          <linearGradient
            id="confiaBodyPremium"
            x1="55"
            y1="48"
            x2="165"
            y2="184"
            gradientUnits="userSpaceOnUse"
          >
            <stop
              offset="0"
              stopColor="#F6D4C2"
            />

            <stop
              offset="0.46"
              stopColor="#E7A485"
            />

            <stop
              offset="1"
              stopColor="#C8735B"
            />
          </linearGradient>

          {/* Luz subtil do rosto */}
          <radialGradient
            id="confiaFaceLight"
            cx="42%"
            cy="28%"
            r="68%"
          >
            <stop
              offset="0"
              stopColor="#FFF8F1"
              stopOpacity="0.58"
            />

            <stop
              offset="1"
              stopColor="#FFF8F1"
              stopOpacity="0"
            />
          </radialGradient>

          {/* Ventre */}
          <linearGradient
            id="confiaBellyPremium"
            x1="90"
            y1="118"
            x2="132"
            y2="169"
            gradientUnits="userSpaceOnUse"
          >
            <stop
              offset="0"
              stopColor="#FFF9F3"
            />

            <stop
              offset="1"
              stopColor="#F3DCCF"
            />
          </linearGradient>

          {/* Símbolo emocional */}
          <linearGradient
            id="confiaSoul"
            x1="110"
            y1="27"
            x2="110"
            y2="67"
            gradientUnits="userSpaceOnUse"
          >
            <stop
              offset="0"
              stopColor="#FFE9A8"
            />

            <stop
              offset="0.5"
              stopColor="#E8A05F"
            />

            <stop
              offset="1"
              stopColor="#C66550"
            />
          </linearGradient>

          <radialGradient
            id="confiaEyePremium"
            cx="35%"
            cy="28%"
            r="75%"
          >
            <stop
              offset="0"
              stopColor="#6C5149"
            />

            <stop
              offset="1"
              stopColor="#302725"
            />
          </radialGradient>
        </defs>

        {/* ===================================================
            SOMBRA
        =================================================== */}

        <ellipse
          cx="110"
          cy="194"
          rx={
            stage <= 2
              ? 45
              : stage === 3
                ? 51
                : 57
          }
          ry="9"
          fill="#765143"
          opacity="0.085"
        />

        {/* ===================================================
            OVO
        =================================================== */}

        {isEgg ? (
          <g>
            <ellipse
              cx="110"
              cy="116"
              rx="58"
              ry="73"
              fill="url(#confiaBodyPremium)"
              stroke="#AD6552"
              strokeWidth="3"
            />

            {/* brilho frontal */}
            <ellipse
              cx="91"
              cy="88"
              rx="28"
              ry="38"
              fill="#FFF9F3"
              opacity="0.18"
            />

            {/* ventre ainda embrionário */}
            <ellipse
              cx="110"
              cy="136"
              rx="38"
              ry="39"
              fill="#FFF6EF"
              opacity="0.46"
            />

            {/* símbolo da CONFIA */}
            <path
              d="
                M110 55
                C100 65 101 75 110 83
                C119 75 120 65 110 55
                Z
              "
              fill="url(#confiaSoul)"
              stroke="#B86750"
              strokeWidth="1.8"
            />

            {/* olhos adormecidos */}
            <path
              d="M76 116 Q87 125 98 116"
              fill="none"
              stroke="#4A3833"
              strokeWidth="4"
              strokeLinecap="round"
            />

            <path
              d="M122 116 Q133 125 144 116"
              fill="none"
              stroke="#4A3833"
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* faces */}
            <ellipse
              cx="72"
              cy="134"
              rx="9"
              ry="5"
              fill="#D87770"
              opacity="0.22"
            />

            <ellipse
              cx="148"
              cy="134"
              rx="9"
              ry="5"
              fill="#D87770"
              opacity="0.22"
            />

            {/* fissura */}
            <path
              d="
                M83 71
                L94 80
                L102 70
                L111 82
                L120 70
                L135 78
              "
              fill="none"
              stroke="#FFF7F0"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.78"
            />
          </g>
        ) : (
          /* =================================================
             CRIATURA
          ================================================= */
          <g
            transform={`
              translate(
                ${110 - 110 * bodyScale}
                ${184 - 184 * bodyScale}
              )
              scale(${bodyScale})
              translate(
                0
                ${184 - 184 * evolutionBodyStretch}
              )
              scale(
                1
                ${evolutionBodyStretch}
              )
            `}
          >
            {/* ===============================================
                CAUDA — assinatura posterior
            =============================================== */}

            {stage >= 3 && (
              <g
                transform={`
                  translate(
                    ${160 - 160 * levelTailBoost}
                    ${135 - 135 * levelTailBoost}
                  )
                  scale(${levelTailBoost})
                `}
              >
              <path
                d={
                  stage === 3
                    ? `
                      M157 145
                      C173 145 180 136 176 127
                      C173 121 168 120 164 123
                      C170 129 168 136 158 137
                      Z
                    `
                    : stage === 4
                      ? `
                        M157 143
                        C181 143 188 128 182 115
                        C178 107 171 105 166 109
                        C175 117 173 129 159 132
                        Z
                      `
                      : `
                        M157 142
                        C184 142 193 123 184 109
                        C179 101 171 100 166 104
                        C177 113 175 126 160 129
                        Z
                      `
                }
                fill="url(#confiaBodyPremium)"
                stroke="#A75D4B"
                strokeWidth={
                  stage === 3
                    ? 2.6
                    : 3
                }
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              </g>
            )}

            {/* ===============================================
                ORELHAS CONFIA

                Curtas, abertas e arredondadas para fugir
                da leitura visual de coelho.
            =============================================== */}

            <g
              transform={`
                translate(
                  ${110 - 110 * evolutionEarScale}
                  ${78 - 78 * evolutionEarScale}
                )
                scale(${evolutionEarScale})
              `}
            >
            <path
              d="
                M75 79
                C58 75 47 61 51 49
                C55 38 68 41 77 51
                C83 58 86 68 87 76
                Z
              "
              fill="url(#confiaBodyPremium)"
              stroke="#A75D4B"
              strokeWidth="3"
              strokeLinejoin="round"
            />

            <path
              d="
                M67 68
                C59 64 55 56 58 51
                C63 49 71 56 76 67
                Z
              "
              fill="#F5BCAE"
              opacity="0.9"
            />

            <path
              d="
                M145 79
                C162 75 173 61 169 49
                C165 38 152 41 143 51
                C137 58 134 68 133 76
                Z
              "
              fill="url(#confiaBodyPremium)"
              stroke="#A75D4B"
              strokeWidth="3"
              strokeLinejoin="round"
            />

            <path
              d="
                M153 68
                C161 64 165 56 162 51
                C157 49 149 56 144 67
                Z
              "
              fill="#F5BCAE"
              opacity="0.9"
            />

            </g>

            {/* ===============================================
                CORPO PRINCIPAL

                Cabeça/corpo contínuos para criar uma
                silhueta imediatamente reconhecível.
            =============================================== */}

            <path
              d="
                M110 61
                C78 61 59 79 57 109

                C54 132 62 154 77 168

                C85 177 96 181 110 182

                C124 181 135 177 143 168

                C158 154 166 132 163 109

                C161 79 142 61 110 61

                Z
              "
              fill="url(#confiaBodyPremium)"
              stroke="#A75D4B"
              strokeWidth="3.2"
              strokeLinejoin="round"
            />

            {/* luz no rosto */}
            <ellipse
              cx="98"
              cy="93"
              rx="43"
              ry="40"
              fill="url(#confiaFaceLight)"
            />

            {/* ===============================================
                VENTRE / CORAÇÃO VISUAL
            =============================================== */}

            <path
              d="
                M110 126
                C91 126 81 137 83 153
                C85 169 96 176 110 177
                C124 176 135 169 137 153
                C139 137 129 126 110 126
                Z
              "
              fill="url(#confiaBellyPremium)"
              opacity="0.94"
            />

            {/* ===============================================
                MARCA CONFIA NA TESTA
            =============================================== */}

            <g
              transform={`
                translate(
                  ${110 - 110 * flameScale}
                  ${58 - 58 * flameScale}
                )
                scale(${flameScale * flameReactionScale * levelFlameBoost})
              `}
            >
              {/* pequena base integrada na testa */}
              <ellipse
                cx="110"
                cy="62"
                rx="8"
                ry="4"
                fill="#C46C55"
                opacity="0.2"
              />

              <path
                d="
                  M110 28

                  C101 38 99 46 102 53

                  C104 58 107 62 110 65

                  C113 62 116 58 118 53

                  C121 46 119 38 110 28

                  Z
                "
                fill="url(#confiaSoul)"
                stroke="#B8614D"
                strokeWidth="2"
                strokeLinejoin="round"
              />

              {stage >= 4 && (
                <path
                  d="
                    M110 37
                    C106 43 106 49 110 54
                    C114 49 114 43 110 37
                    Z
                  "
                  fill="#FFF2BE"
                  opacity="0.95"
                />
              )}

              {stage === 4 && (
                <circle
                  cx="110"
                  cy="48"
                  r="1.35"
                  fill="#FFF8D8"
                  opacity="0.72"
                />
              )}

              {stage === 5 && (
                <circle
                  cx="110"
                  cy="47"
                  r="2.3"
                  fill="#FFFFFF"
                  opacity="0.88"
                />
              )}
            </g>

            {/* ===============================================
                SOBRANCELHAS / EXPRESSÃO
            =============================================== */}

            {state === "supportive" && (
              <>
                <path
                  d="M78 88 Q88 84 97 89"
                  fill="none"
                  stroke="#8E574A"
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.7"
                />

                <path
                  d="M123 89 Q132 84 142 88"
                  fill="none"
                  stroke="#8E574A"
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.7"
                />
              </>
            )}

            {state === "curious" && (
              <path
                d="M122 87 Q133 81 143 86"
                fill="none"
                stroke="#8E574A"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.75"
              />
            )}

            {/* ===============================================
                OLHOS
            =============================================== */}

            <ellipse
              cx="87"
              cy={eyeY}
              rx={
                (state === "curious"
                  ? 8
                  : 7.5) * evolutionEyeScale
              }
              ry={eyeRY * evolutionEyeScale}
              fill="url(#confiaEyePremium)"
            />

            <ellipse
              cx="133"
              cy={eyeY}
              rx={
                (state === "curious"
                  ? 8
                  : 7.5) * evolutionEyeScale
              }
              ry={eyeRY * evolutionEyeScale}
              fill="url(#confiaEyePremium)"
            />

            {/* reflexo principal */}
            <circle
              cx="84.5"
              cy={eyeY - 3.2}
              r="2.5"
              fill="#FFFFFF"
              opacity="0.94"
            />

            <circle
              cx="130.5"
              cy={eyeY - 3.2}
              r="2.5"
              fill="#FFFFFF"
              opacity="0.94"
            />

            {/* reflexo secundário — níveis altos */}
            {stage >= 4 && (
              <>
                <circle
                  cx="89"
                  cy={eyeY + 3}
                  r="1"
                  fill="#FFFFFF"
                  opacity="0.42"
                />

                <circle
                  cx="135"
                  cy={eyeY + 3}
                  r="1"
                  fill="#FFFFFF"
                  opacity="0.42"
                />
              </>
            )}

            {/* ===============================================
                BOCA
            =============================================== */}

            <path
              d={mouth}
              fill="none"
              stroke="#503934"
              strokeWidth="2.7"
              strokeLinecap="round"
            />

            {/* ===============================================
                BOCHECHAS
            =============================================== */}

            <ellipse
              cx="70"
              cy="117"
              rx="10"
              ry="5.5"
              fill="#D87570"
              opacity={cheekOpacity}
            />

            <ellipse
              cx="150"
              cy="117"
              rx="10"
              ry="5.5"
              fill="#D87570"
              opacity={cheekOpacity}
            />

            {/* ===============================================
                BRAÇOS
            =============================================== */}

            {stage >= 3 && (
              <>
                <path
                  d={
                    state === "welcoming" ||
                    state === "celebrating"
                      ? "M65 133 Q48 128 45 116"
                      : "M66 134 Q53 140 58 151"
                  }
                  fill="none"
                  stroke="#B96652"
                  strokeWidth="7"
                  strokeLinecap="round"
                />

                <path
                  d={
                    state === "welcoming" ||
                    state === "celebrating"
                      ? "M155 133 Q172 128 175 116"
                      : "M154 134 Q167 140 162 151"
                  }
                  fill="none"
                  stroke="#B96652"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
              </>
            )}

            {/* ===============================================
                PÉS
            =============================================== */}

            <ellipse
              cx={
                stage === 2
                  ? 89
                  : stage === 3
                    ? 86
                    : 84
              }
              cy={
                stage === 2
                  ? 175
                  : 177
              }
              rx={
                stage === 2
                  ? 11
                  : stage === 3
                    ? 14
                    : stage === 4
                      ? 16
                      : 17
              }
              ry={
                stage === 2
                  ? 6
                  : stage === 3
                    ? 6.8
                    : 7.5
              }
              fill="#B76350"
            />

            <ellipse
              cx={
                stage === 2
                  ? 131
                  : stage === 3
                    ? 134
                    : 136
              }
              cy={
                stage === 2
                  ? 175
                  : 177
              }
              rx={
                stage === 2
                  ? 11
                  : stage === 3
                    ? 14
                    : stage === 4
                      ? 16
                      : 17
              }
              ry={
                stage === 2
                  ? 6
                  : stage === 3
                    ? 6.8
                    : 7.5
              }
              fill="#B76350"
            />

            {/* A4.2/A4.3 — Nascente: identidade cresce com o nível */}
            {stage === 2 && (
              <circle
                cx="110"
                cy="158"
                r={
                  safeLevel === 3
                    ? 2.35
                    : 2
                }
                fill="#E6AE83"
                opacity={levelMarkOpacity}
              />
            )}

            {/* A4.2/A4.3 — Pequena CONFIA: marca amadurece */}
            {stage === 3 && (
              <path
                d={
                  safeLevel === 5
                    ? "M96 153 Q110 161 124 153"
                    : "M98 154 Q110 160 122 154"
                }
                fill="none"
                stroke="#D99A78"
                strokeWidth={
                  safeLevel === 5
                    ? 1.9
                    : 1.7
                }
                strokeLinecap="round"
                opacity={levelMarkOpacity}
              />
            )}

            {/* ===============================================
                MATURIDADE

                Em vez de acessórios aleatórios, a própria
                marca corporal amadurece.
            =============================================== */}

            {stage >= 4 && (
              <>
                <path
                  d="M88 151 Q110 162 132 151"
                  fill="none"
                  stroke="#D49678"
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity={levelMarkOpacity}
                />

                <circle
                  cx="110"
                  cy="166"
                  r="2.2"
                  fill="#D49678"
                  opacity="0.42"
                />
              </>
            )}

            {stage === 5 && (
              <>
                <path
                  d="
                    M91 158
                    Q110 170 129 158
                  "
                  fill="none"
                  stroke="#C77A5F"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  opacity="0.5"
                />

                <circle
                  cx="110"
                  cy="171"
                  r="1.8"
                  fill="#C77A5F"
                  opacity="0.48"
                />
                              {/* A4.1 — assinatura final da espécie */}
                {safeLevel === 10 && (
                  <>
<circle
                  cx="101"
                  cy="162"
                  r="1.6"
                  fill="#D99A72"
                  opacity="0.55"
                />

                <circle
                  cx="119"
                  cy="162"
                  r="1.6"
                  fill="#D99A72"
                  opacity="0.55"
                />
                  </>
                )}

</>
            )}
          </g>
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
      </svg>
    </div>
  );
}

export default memo(ConfiaCreature);
