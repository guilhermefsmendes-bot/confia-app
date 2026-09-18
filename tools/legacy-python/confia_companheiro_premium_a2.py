from pathlib import Path
import shutil
import sys

TARGET = Path("src/components/Companheiro/ConfiaCreature.tsx")
BACKUP = Path("/tmp/ConfiaCreature.tsx.before_premium_a2")

if TARGET.exists():
    shutil.copy2(TARGET, BACKUP)

TARGET.parent.mkdir(parents=True, exist_ok=True)

code = r'''import React, { memo } from "react";

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
}

/**
 * CONFIA — CRIATURA PREMIUM A2
 *
 * Motor visual deliberadamente leve:
 *
 * - SVG puro
 * - sem timers
 * - sem intervalos
 * - sem requestAnimationFrame
 * - sem canvas
 * - sem partículas
 * - sem animações infinitas
 *
 * As micro-reações são acionadas exclusivamente
 * através das props recebidas.
 */
function ConfiaCreature({
  level,
  state = "neutral",
  reacting = false,
}: ConfiaCreatureProps) {
  const safeLevel = Math.max(1, Math.min(10, level));

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

  const bodyScale =
    stage === 2
      ? 0.82
      : stage === 3
        ? 0.9
        : stage === 4
          ? 0.97
          : 1;

  const eyeY =
    state === "supportive"
      ? 102
      : state === "curious"
        ? 98
        : 100;

  const mouth =
    state === "supportive"
      ? "M94 116 Q100 112 106 116"
      : state === "curious"
        ? "M97 115 Q100 118 103 115"
        : state === "celebrating" ||
            state === "welcoming"
          ? "M92 113 Q100 122 108 113"
          : "M94 114 Q100 119 106 114";

  const flameScale =
    stage === 2
      ? 0.55
      : stage === 3
        ? 0.7
        : stage === 4
          ? 0.86
          : 1;

  return (
    <div
      className={`
        relative
        flex
        items-center
        justify-center
        transition-transform
        duration-300
        ease-out
        ${reacting ? "-translate-y-2 scale-[1.035]" : ""}
      `}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 220 220"
        className="
          h-[205px]
          w-[205px]
          select-none
          overflow-visible
          drop-shadow-[0_14px_18px_rgba(105,65,50,0.14)]
        "
      >
        <defs>
          <linearGradient
            id="confiaBody"
            x1="30"
            y1="30"
            x2="175"
            y2="190"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#F8D7C5" />
            <stop offset="0.52" stopColor="#E7A889" />
            <stop offset="1" stopColor="#C9775F" />
          </linearGradient>

          <linearGradient
            id="confiaBelly"
            x1="80"
            y1="105"
            x2="135"
            y2="170"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#FFF8F1" />
            <stop offset="1" stopColor="#F4DFD2" />
          </linearGradient>

          <linearGradient
            id="confiaFlame"
            x1="100"
            y1="40"
            x2="115"
            y2="68"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#FFE5A3" />
            <stop offset="0.5" stopColor="#E8A566" />
            <stop offset="1" stopColor="#C66C55" />
          </linearGradient>

          <radialGradient id="confiaEye">
            <stop offset="0" stopColor="#695048" />
            <stop offset="1" stopColor="#352B29" />
          </radialGradient>
        </defs>

        {/* sombra */}
        <ellipse
          cx="110"
          cy="190"
          rx={stage <= 2 ? 47 : 58}
          ry="10"
          fill="#815846"
          opacity="0.09"
        />

        {isEgg ? (
          <g>
            {/* ovo */}
            <ellipse
              cx="110"
              cy="116"
              rx="57"
              ry="72"
              fill="url(#confiaBody)"
              stroke="#B86B55"
              strokeWidth="3"
            />

            {/* zona clara */}
            <ellipse
              cx="110"
              cy="130"
              rx="39"
              ry="43"
              fill="#FFF4EC"
              opacity="0.48"
            />

            {/* símbolo CONFIA ainda adormecido */}
            <path
              d="
                M110 57
                C102 67 104 76 110 82
                C116 76 118 67 110 57
                Z
              "
              fill="url(#confiaFlame)"
              opacity="0.72"
            />

            {/* olhos fechados */}
            <path
              d="M78 117 Q88 125 98 117"
              fill="none"
              stroke="#4B3833"
              strokeWidth="4"
              strokeLinecap="round"
            />

            <path
              d="M122 117 Q132 125 142 117"
              fill="none"
              stroke="#4B3833"
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* pequenas faces */}
            <ellipse
              cx="73"
              cy="133"
              rx="9"
              ry="5"
              fill="#D77D76"
              opacity="0.25"
            />

            <ellipse
              cx="147"
              cy="133"
              rx="9"
              ry="5"
              fill="#D77D76"
              opacity="0.25"
            />

            {/* fissura discreta */}
            <path
              d="M87 69 L96 78 L103 70 L111 82 L120 71 L131 79"
              fill="none"
              stroke="#FFF4E9"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.72"
            />
          </g>
        ) : (
          <g
            transform={`
              translate(${110 - 110 * bodyScale} ${180 - 180 * bodyScale})
              scale(${bodyScale})
            `}
          >
            {/* cauda — nasce na fase pequena */}
            {stage >= 3 && (
              <path
                d="
                  M156 145
                  C188 143 191 116 175 108
                  C181 128 168 132 151 130
                  Z
                "
                fill="url(#confiaBody)"
                stroke="#A95F4D"
                strokeWidth="3"
                strokeLinejoin="round"
              />
            )}

            {/* orelha esquerda */}
            <path
              d="
                M72 80
                C54 67 46 42 59 37
                C74 38 82 57 84 76
                Z
              "
              fill="url(#confiaBody)"
              stroke="#A95F4D"
              strokeWidth="3"
              strokeLinejoin="round"
            />

            {/* interior orelha */}
            <path
              d="
                M68 69
                C59 59 56 47 61 45
                C69 47 75 59 77 70
                Z
              "
              fill="#F6C6B6"
            />

            {/* orelha direita */}
            <path
              d="
                M148 80
                C166 67 174 42 161 37
                C146 38 138 57 136 76
                Z
              "
              fill="url(#confiaBody)"
              stroke="#A95F4D"
              strokeWidth="3"
              strokeLinejoin="round"
            />

            <path
              d="
                M152 69
                C161 59 164 47 159 45
                C151 47 145 59 143 70
                Z
              "
              fill="#F6C6B6"
            />

            {/* corpo / cabeça contínuos */}
            <path
              d="
                M110 63
                C76 63 58 84 60 119
                C61 151 77 174 110 178
                C143 174 159 151 160 119
                C162 84 144 63 110 63
                Z
              "
              fill="url(#confiaBody)"
              stroke="#A95F4D"
              strokeWidth="3.2"
              strokeLinejoin="round"
            />

            {/* ventre */}
            <ellipse
              cx="110"
              cy="142"
              rx={stage >= 4 ? 34 : 30}
              ry={stage >= 4 ? 30 : 27}
              fill="url(#confiaBelly)"
              opacity="0.88"
            />

            {/* símbolo vivo da CONFIA */}
            <g
              transform={`
                translate(${110 - 110 * flameScale} ${58 - 58 * flameScale})
                scale(${flameScale})
              `}
            >
              <path
                d="
                  M110 31
                  C96 46 100 58 110 67
                  C120 58 124 46 110 31
                  Z
                "
                fill="url(#confiaFlame)"
                stroke="#B76550"
                strokeWidth="2.2"
                strokeLinejoin="round"
              />

              {stage >= 4 && (
                <path
                  d="
                    M110 39
                    C105 47 106 53 110 57
                    C114 53 115 47 110 39
                    Z
                  "
                  fill="#FFF0B9"
                  opacity="0.9"
                />
              )}
            </g>

            {/* olhos */}
            <ellipse
              cx="88"
              cy={eyeY}
              rx={state === "curious" ? 7.5 : 7}
              ry={state === "supportive" ? 7 : 9}
              fill="url(#confiaEye)"
            />

            <ellipse
              cx="132"
              cy={eyeY}
              rx={state === "curious" ? 7.5 : 7}
              ry={state === "supportive" ? 7 : 9}
              fill="url(#confiaEye)"
            />

            {/* brilho dos olhos */}
            <circle
              cx="85.5"
              cy={eyeY - 3}
              r="2.2"
              fill="#FFFFFF"
              opacity="0.92"
            />

            <circle
              cx="129.5"
              cy={eyeY - 3}
              r="2.2"
              fill="#FFFFFF"
              opacity="0.92"
            />

            {stage >= 4 && (
              <>
                <circle
                  cx="91"
                  cy={eyeY + 3}
                  r="1.15"
                  fill="#EAB69F"
                  opacity="0.55"
                />

                <circle
                  cx="135"
                  cy={eyeY + 3}
                  r="1.15"
                  fill="#EAB69F"
                  opacity="0.55"
                />
              </>
            )}

            {/* expressão */}
            <path
              d={mouth}
              fill="none"
              stroke="#513A34"
              strokeWidth="2.8"
              strokeLinecap="round"
            />

            {/* faces */}
            <ellipse
              cx="73"
              cy="116"
              rx="9"
              ry="5"
              fill="#D87670"
              opacity={
                state === "welcoming" ||
                state === "celebrating"
                  ? 0.34
                  : 0.2
              }
            />

            <ellipse
              cx="147"
              cy="116"
              rx="9"
              ry="5"
              fill="#D87670"
              opacity={
                state === "welcoming" ||
                state === "celebrating"
                  ? 0.34
                  : 0.2
              }
            />

            {/* braços — aparecem progressivamente */}
            {stage >= 3 && (
              <>
                <path
                  d="M66 132 Q52 139 58 151"
                  fill="none"
                  stroke="#A95F4D"
                  strokeWidth="7"
                  strokeLinecap="round"
                />

                <path
                  d="M154 132 Q168 139 162 151"
                  fill="none"
                  stroke="#A95F4D"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
              </>
            )}

            {/* pés */}
            <ellipse
              cx="84"
              cy="174"
              rx="17"
              ry="8"
              fill="#B96754"
            />

            <ellipse
              cx="136"
              cy="174"
              rx="17"
              ry="8"
              fill="#B96754"
            />

            {/* marca adulta muito subtil */}
            {stage === 5 && (
              <path
                d="
                  M88 151
                  Q110 164 132 151
                "
                fill="none"
                stroke="#D79A79"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.65"
              />
            )}
          </g>
        )}
      </svg>
    </div>
  );
}

export default memo(ConfiaCreature);
'''

TARGET.write_text(code, encoding="utf-8")

print("=" * 76)
print("CONFIA — COMPANHEIRO PREMIUM A2")
print("=" * 76)
print()
print("✓ Nova espécie CONFIA criada")
print("✓ SVG vetorial leve")
print("✓ Identidade visual creme / terracota / dourado")
print("✓ Símbolo luminoso CONFIA criado")
print("✓ 5 estágios visuais preparados")
print("✓ Compatível com os atuais 10 níveis")
print("✓ Estados neutral / welcoming / supportive / curious / celebrating")
print("✓ Micro-reação preparada por prop")
print("✓ Nenhuma animação infinita")
print("✓ Nenhum timer")
print("✓ Nenhum setInterval")
print("✓ Nenhum requestAnimationFrame")
print("✓ Nenhum canvas")
print("✓ Nenhuma partícula")
print("✓ Nenhuma dependência nova")
print()
print("IMPORTANTE:")
print("  O novo componente ainda NÃO substitui o Avatar atual.")
print("  Primeiro vamos validar a sua criação.")
print()
print("Ficheiro:")
print(f"  {TARGET}")
if BACKUP.exists():
    print()
    print("Backup anterior:")
    print(f"  {BACKUP}")
print("=" * 76)
