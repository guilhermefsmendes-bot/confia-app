import React, {
  useId,
  useMemo,
  useState,
} from "react";

import { useTranslation } from "react-i18next";

import { getConstellationReflection } from "./constellationReflections";
import {
  EMOTIONAL_STATES,
  FAMILY_COLORS,
  getDominantStates,
  hashAnswers,
  seededNoise,
  type EmotionalAnswers,
  type EmotionalDefinition,
  type EmotionalFamily,
} from "./innerCanvasEngine";

import {
  matchConstellation,
  type ConstellationMatch,
} from "./constellationEngine";



import {
  deleteInnerCanvasEntry,
  getInnerCanvasDayKey,
  getInnerCanvasGallery,
  getInnerCanvasRewardProgress,
  saveInnerCanvasEntry,
  type InnerCanvasEntry,
  type InnerCanvasTier,
} from "../../storage/innerCanvasStorage";




type Props = {
  onBack: () => void;
};

type Mode =
  | "intro"
  | "survey"
  | "result"
  | "gallery";

const GROUP_SIZE = 4;

const emptyAnswers = (): EmotionalAnswers =>
  Object.fromEntries(
    EMOTIONAL_STATES.map(state => [
      state.id,
      0,
    ])
  );

const clamp = (
  value: number,
  min: number,
  max: number
) =>
  Math.max(min, Math.min(max, value));

function formatDate(
  dateString: string,
  language: string
) {
  try {
    return new Intl.DateTimeFormat(language, {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
}

function focusPosition(
  state: EmotionalDefinition
) {
  return {
    x: 180 + state.x * 125,
    y: 180 + state.y * 125,
  };
}

function familyStates(
  family:
    | "serenity"
    | "expansion"
    | "tension"
    | "inward"
) {
  return EMOTIONAL_STATES.filter(
    state => state.family === family
  );
}

function getFamilyCenter(
  answers: EmotionalAnswers,
  family:
    | "serenity"
    | "expansion"
    | "tension"
    | "inward"
) {
  const states = familyStates(family);

  let total = 0;
  let weightedX = 0;
  let weightedY = 0;

  states.forEach(state => {
    const value = clamp(
      answers[state.id] ?? 0,
      0,
      10
    );

    total += value;
    weightedX += state.x * value;
    weightedY += state.y * value;
  });

  if (total <= 0) {
    const fallback = {
      serenity: { x: 0.45, y: 0.52 },
      expansion: { x: 0.50, y: -0.48 },
      tension: { x: -0.50, y: -0.48 },
      inward: { x: -0.48, y: 0.50 },
    };

    return {
      ...fallback[family],
      strength: 0,
    };
  }

  return {
    x: weightedX / total,
    y: weightedY / total,
    strength: total / Math.max(1, states.length),
  };
}

function smoothClosedPath(
  points: { x: number; y: number }[]
) {
  if (points.length < 3) return "";

  const first = points[0];

  let d =
    `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`;

  for (let i = 0; i < points.length; i += 1) {
    const current = points[i];
    const next = points[(i + 1) % points.length];

    const mx = (current.x + next.x) / 2;
    const my = (current.y + next.y) / 2;

    d +=
      ` Q ${current.x.toFixed(2)} ${current.y.toFixed(2)}` +
      ` ${mx.toFixed(2)} ${my.toFixed(2)}`;
  }

  return d + " Z";
}

function buildSculpturalBlobPath(
  answers: EmotionalAnswers,
  seed: number,
  family:
    | "serenity"
    | "expansion"
    | "tension"
    | "inward",
  layerIndex: number
) {
  const center = getFamilyCenter(
    answers,
    family
  );

  const states = familyStates(family);

  const samples = 72;

  const familyIndex = {
    serenity: 1,
    expansion: 2,
    tension: 3,
    inward: 4,
  }[family];

  const centerX =
    180 +
    center.x * 56 +
    (seededNoise(
      seed,
      500 + familyIndex * 13 + layerIndex
    ) - 0.5) *
      38;

  const centerY =
    180 +
    center.y * 56 +
    (seededNoise(
      seed,
      600 + familyIndex * 17 + layerIndex
    ) - 0.5) *
      34;

  const normalizedStrength = clamp(
    center.strength / 10,
    0,
    1
  );

  const baseRadius =
    42 +
    normalizedStrength * 45 +
    layerIndex * 15;

  const stretchX =
    0.95 +
    seededNoise(
      seed,
      700 + familyIndex * 7 + layerIndex
    ) *
      0.58;

  const stretchY =
    0.74 +
    seededNoise(
      seed,
      800 + familyIndex * 9 + layerIndex
    ) *
      0.52;

  const points = Array.from(
    { length: samples },
    (_, index) => {
      const angle =
        (Math.PI * 2 * index) / samples;

      let radius = baseRadius;

      states.forEach(state => {
        const value =
          clamp(
            answers[state.id] ?? 0,
            0,
            10
          ) / 10;

        if (value <= 0) return;

        const stateAngle =
          Math.atan2(state.y, state.x);

        let diff = Math.abs(
          angle - stateAngle
        );

        diff = Math.min(
          diff,
          Math.PI * 2 - diff
        );

        const influence =
          Math.exp(
            -(diff * diff) /
              (0.27 + state.softness * 0.52)
          );

        radius +=
          influence *
          value *
          (13 + layerIndex * 4);
      });

      const lobe1 =
        Math.sin(
          angle *
            (2 + ((seed + familyIndex) % 3)) +
            familyIndex * 0.8 +
            layerIndex * 0.55
        ) *
        (9 + normalizedStrength * 7);

      const lobe2 =
        Math.cos(
          angle * (4 + (familyIndex % 2)) +
            (seed % 29) * 0.11
        ) *
        6.5;

      const lobe3 =
        Math.sin(
          angle * 7 +
            (seed % 17) * 0.17 +
            layerIndex
        ) *
        3.4;

      const microNoise =
        (seededNoise(
          seed,
          1000 +
            familyIndex * 100 +
            layerIndex * 70 +
            index
        ) -
          0.5) *
        7;

      radius +=
        lobe1 +
        lobe2 +
        lobe3 +
        microNoise;

      return {
        x:
          centerX +
          Math.cos(angle) *
            radius *
            stretchX,

        y:
          centerY +
          Math.sin(angle) *
            radius *
            stretchY,
      };
    }
  );

  return smoothClosedPath(points);
}

function buildRibbonPath(
  state: EmotionalDefinition,
  seed: number,
  index: number
) {
  const start = focusPosition(state);

  const n1 = seededNoise(
    seed,
    2000 + index * 11
  );

  const n2 = seededNoise(
    seed,
    2100 + index * 13
  );

  const n3 = seededNoise(
    seed,
    2200 + index * 17
  );

  const startX =
    180 + (start.x - 180) * 0.60;

  const startY =
    180 + (start.y - 180) * 0.60;

  const endX =
    360 -
    startX +
    (n1 - 0.5) * 110;

  const endY =
    360 -
    startY +
    (n2 - 0.5) * 100;

  const control1X = clamp(
    180 + (n2 - 0.5) * 250,
    24,
    336
  );

  const control1Y = clamp(
    startY + (n3 - 0.5) * 230,
    24,
    336
  );

  const control2X = clamp(
    180 + (n3 - 0.5) * 240,
    24,
    336
  );

  const control2Y = clamp(
    endY + (n1 - 0.5) * 210,
    24,
    336
  );

  return (
    `M ${startX.toFixed(2)} ${startY.toFixed(2)} ` +
    `C ${control1X.toFixed(2)} ${control1Y.toFixed(2)}, ` +
    `${control2X.toFixed(2)} ${control2Y.toFixed(2)}, ` +
    `${endX.toFixed(2)} ${endY.toFixed(2)}`
  );
}

function buildCutPath(
  seed: number,
  index: number
) {
  const y1 =
    70 +
    seededNoise(
      seed,
      3000 + index * 31
    ) *
      220;

  const y2 =
    64 +
    seededNoise(
      seed,
      3100 + index * 37
    ) *
      225;

  const c1x =
    70 +
    seededNoise(
      seed,
      3200 + index * 41
    ) *
      100;

  const c1y =
    30 +
    seededNoise(
      seed,
      3300 + index * 43
    ) *
      300;

  const c2x =
    190 +
    seededNoise(
      seed,
      3400 + index * 47
    ) *
      105;

  const c2y =
    30 +
    seededNoise(
      seed,
      3500 + index * 53
    ) *
      300;

  return (
    `M 12 ${y1.toFixed(2)} ` +
    `C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ` +
    `${c2x.toFixed(2)} ${c2y.toFixed(2)}, ` +
    `348 ${y2.toFixed(2)}`
  );
}

function EmotionalArtwork({
  answers,
  seed,
  interactive = true,
  tier = "bronze",
}: {
  answers: EmotionalAnswers;
  seed: number;
  interactive?: boolean;
  tier?: InnerCanvasTier;
}) {
  const { t } = useTranslation();

  const svgId =
    useId().replace(/:/g, "");

  const uid = `${svgId}-${seed}`;

  const [showMap, setShowMap] =
    useState(false);

  const dominant = useMemo(
    () =>
      getDominantStates(
        answers,
        6
      ),
    [answers]
  );

  const activeStates = useMemo(
    () =>
      EMOTIONAL_STATES
        .map(state => ({
          ...state,
          value:
            answers[state.id] ?? 0,
        }))
        .filter(
          state =>
            state.value > 0
        ),
    [answers]
  );

  const families = useMemo(
    () => {
      const ids = [
        "serenity",
        "expansion",
        "tension",
        "inward",
      ] as const;

      return ids
        .map(
          (family, familyIndex) => {
            const center =
              getFamilyCenter(
                answers,
                family
              );

            return {
              family,
              strength: center.strength,
              backPath:
                buildSculpturalBlobPath(
                  answers,
                  seed +
                    familyIndex * 113,
                  family,
                  1
                ),
              midPath:
                buildSculpturalBlobPath(
                  answers,
                  seed +
                    familyIndex * 173,
                  family,
                  0.5
                ),
              frontPath:
                buildSculpturalBlobPath(
                  answers,
                  seed +
                    familyIndex * 229,
                  family,
                  0
                ),
            };
          }
        )
        .filter(
          item =>
            item.strength > 0.1
        )
        .sort(
          (a, b) =>
            a.strength - b.strength
        );
    },
    [answers, seed]
  );

  const complexityBoost =
    tier === "gold"
      ? 2
      : tier === "silver"
        ? 1
        : 0;

  const cuts = useMemo(
    () =>
      Array.from(
        {
          length:
            4 +
            complexityBoost * 2,
        },
        (_, index) =>
          buildCutPath(
            seed,
            index
          )
      ),
    [seed, complexityBoost]
  );

  return (
    <button
      type="button"
      onClick={() => {
        if (interactive) {
          setShowMap(
            value => !value
          );
        }
      }}
      className="relative block w-full overflow-hidden rounded-[30px] border border-[#E8DDD7]/70 bg-[#E9E8E4] text-left shadow-[0_18px_45px_rgba(72,55,47,0.10)]"
      aria-label={t(
        "innerCanvas.artworkAria"
      )}
    >
      <svg
        viewBox="0 0 360 360"
        className="block aspect-square w-full"
        role="img"
      >
        <defs>
          <radialGradient
            id={`background-${uid}`}
            cx="50%"
            cy="42%"
            r="78%"
          >
            <stop
              offset="0%"
              stopColor="#F6F4EF"
            />

            <stop
              offset="58%"
              stopColor="#E8E7E3"
            />

            <stop
              offset="100%"
              stopColor="#D6DADA"
            />
          </radialGradient>

          {(
            [
              "serenity",
              "expansion",
              "tension",
              "inward",
            ] as const
          ).map(
            (family, index) => {
              const colors =
                FAMILY_COLORS[
                  family
                ];

              return (
                <React.Fragment
                  key={family}
                >
                  <radialGradient
                    id={`family-${family}-${uid}`}
                    cx={
                      index % 2 === 0
                        ? "32%"
                        : "68%"
                    }
                    cy={
                      index < 2
                        ? "28%"
                        : "72%"
                    }
                    r="82%"
                  >
                    <stop
                      offset="0%"
                      stopColor={
                        colors[2]
                      }
                      stopOpacity="0.98"
                    />

                    <stop
                      offset="38%"
                      stopColor={
                        colors[0]
                      }
                      stopOpacity="0.96"
                    />

                    <stop
                      offset="72%"
                      stopColor={
                        colors[1]
                      }
                      stopOpacity="0.91"
                    />

                    <stop
                      offset="100%"
                      stopColor={
                        colors[1]
                      }
                      stopOpacity="0.60"
                    />
                  </radialGradient>

                  <linearGradient
                    id={`ribbon-${family}-${uid}`}
                    x1="0%"
                    y1="15%"
                    x2="100%"
                    y2="85%"
                  >
                    <stop
                      offset="0%"
                      stopColor={
                        colors[2]
                      }
                      stopOpacity="0.30"
                    />

                    <stop
                      offset="45%"
                      stopColor={
                        colors[0]
                      }
                      stopOpacity="0.95"
                    />

                    <stop
                      offset="100%"
                      stopColor={
                        colors[1]
                      }
                      stopOpacity="0.38"
                    />
                  </linearGradient>
                </React.Fragment>
              );
            }
          )}

          <filter
            id={`organic-${uid}`}
            x="-35%"
            y="-35%"
            width="170%"
            height="170%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.007 0.014"
              numOctaves="2"
              seed={(seed % 89) + 1}
              result="noise"
            />

            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="10"
              xChannelSelector="R"
              yChannelSelector="B"
            />
          </filter>

          <filter
            id={`softBlur-${uid}`}
            x="-60%"
            y="-60%"
            width="220%"
            height="220%"
          >
            <feGaussianBlur
              stdDeviation="13"
            />
          </filter>

          <filter
            id={`detailBlur-${uid}`}
            x="-40%"
            y="-40%"
            width="180%"
            height="180%"
          >
            <feGaussianBlur
              stdDeviation="4.5"
            />
          </filter>

          <filter
            id={`drop-${uid}`}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feDropShadow
              dx="0"
              dy="9"
              stdDeviation="9"
              floodColor="#383344"
              floodOpacity="0.20"
            />
          </filter>
        </defs>

        <rect
          width="360"
          height="360"
          fill={`url(#background-${uid})`}
        />

        <circle
          cx="44"
          cy="58"
          r="120"
          fill="#C7F1DF"
          opacity="0.30"
          filter={`url(#softBlur-${uid})`}
        />

        <circle
          cx="322"
          cy="72"
          r="120"
          fill="#FFD2BC"
          opacity="0.33"
          filter={`url(#softBlur-${uid})`}
        />

        <circle
          cx="300"
          cy="314"
          r="118"
          fill="#D2C4F2"
          opacity="0.30"
          filter={`url(#softBlur-${uid})`}
        />

        <circle
          cx="65"
          cy="304"
          r="110"
          fill="#C6E4F2"
          opacity="0.28"
          filter={`url(#softBlur-${uid})`}
        />

        <ellipse
          cx="180"
          cy="302"
          rx="126"
          ry="26"
          fill="#312D3B"
          opacity="0.14"
          filter={`url(#softBlur-${uid})`}
        />

        <g
          filter={`url(#drop-${uid})`}
        >
          {families.map(item => {
            const strength =
              clamp(
                item.strength / 10,
                0,
                1
              );

            return (
              <path
                key={`back-${item.family}`}
                d={item.backPath}
                fill={`url(#family-${item.family}-${uid})`}
                opacity={
                  0.30 +
                  strength * 0.38
                }
                filter={`url(#organic-${uid})`}
              />
            );
          })}
        </g>

        <g
          style={{
            mixBlendMode: "normal",
          }}
        >
          {families.map(
            (item, index) => {
              const strength =
                clamp(
                  item.strength / 10,
                  0,
                  1
                );

              return (
                <React.Fragment
                  key={`layers-${item.family}`}
                >
                  <path
                    d={item.midPath}
                    fill={`url(#family-${item.family}-${uid})`}
                    opacity={
                      0.34 +
                      strength * 0.34
                    }
                    filter={`url(#organic-${uid})`}
                    transform={
                      index % 2 === 0
                        ? "rotate(-4 180 180)"
                        : "rotate(4 180 180)"
                    }
                  />

                  <path
                    d={item.frontPath}
                    fill={`url(#family-${item.family}-${uid})`}
                    opacity={
                      0.56 +
                      strength * 0.38
                    }
                    filter={`url(#organic-${uid})`}
                    transform={
                      index % 2 === 0
                        ? "rotate(3 180 180)"
                        : "rotate(-3 180 180)"
                    }
                  />
                </React.Fragment>
              );
            }
          )}
        </g>

        <g
          fill="none"
          strokeLinecap="round"
        >
          {dominant
            .slice(0, 5)
            .map(
              (state, index) => {
                const width =
                  18 +
                  state.value * 3.2;

                const path =
                  buildRibbonPath(
                    state,
                    seed,
                    index
                  );

                return (
                  <React.Fragment
                    key={`ribbon-${state.id}`}
                  >
                    <path
                      d={path}
                      stroke="#2C2940"
                      strokeWidth={
                        width + 12
                      }
                      strokeOpacity="0.11"
                      filter={`url(#detailBlur-${uid})`}
                    />

                    <path
                      d={path}
                      stroke={`url(#ribbon-${state.family}-${uid})`}
                      strokeWidth={width}
                      strokeOpacity={
                        0.38 +
                        (state.value /
                          10) *
                          0.43
                      }
                    />

                    <path
                      d={path}
                      stroke="#FFFFFF"
                      strokeWidth={
                        Math.max(
                          2.3,
                          width * 0.11
                        )
                      }
                      strokeOpacity="0.19"
                    />
                  </React.Fragment>
                );
              }
            )}
        </g>

        <g
          fill="none"
          strokeLinecap="round"
        >
          {cuts.map(
            (cutPath, index) => {
              const cutWidth =
                15 +
                seededNoise(
                  seed,
                  4100 + index
                ) *
                  22;

              return (
                <React.Fragment
                  key={`cut-${index}`}
                >
                  <path
                    d={cutPath}
                    stroke="#2C2940"
                    strokeWidth={
                      cutWidth + 13
                    }
                    strokeOpacity="0.14"
                    filter={`url(#detailBlur-${uid})`}
                  />

                  <path
                    d={cutPath}
                    stroke="#ECEAE6"
                    strokeWidth={cutWidth}
                    strokeOpacity={
                      0.48 -
                      index * 0.055
                    }
                  />

                  <path
                    d={cutPath}
                    stroke="#FFFFFF"
                    strokeWidth="2.8"
                    strokeOpacity="0.20"
                    transform="translate(0 -4)"
                  />
                </React.Fragment>
              );
            }
          )}
        </g>

        {dominant
          .slice(0, 4)
          .map(
            (state, index) => {
              const pos =
                focusPosition(state);

              const x =
                180 +
                (pos.x - 180) *
                  0.48 +
                (seededNoise(
                  seed,
                  5000 + index
                ) -
                  0.5) *
                  58;

              const y =
                180 +
                (pos.y - 180) *
                  0.48 +
                (seededNoise(
                  seed,
                  5100 + index
                ) -
                  0.5) *
                  52;

              const rotation =
                (seededNoise(
                  seed,
                  5200 + index
                ) -
                  0.5) *
                90;

              return (
                <React.Fragment
                  key={`cavity-${state.id}`}
                >
                  <ellipse
                    cx={x}
                    cy={y}
                    rx={
                      21 +
                      state.value * 2.9
                    }
                    ry={
                      12 +
                      state.value * 1.8
                    }
                    fill="#2C2840"
                    opacity={
                      0.08 +
                      state.value *
                        0.012
                    }
                    transform={`rotate(${rotation} ${x} ${y})`}
                    filter={`url(#detailBlur-${uid})`}
                  />

                  <ellipse
                    cx={x - 5}
                    cy={y - 6}
                    rx={
                      16 +
                      state.value * 2.1
                    }
                    ry={
                      7 +
                      state.value * 1.2
                    }
                    fill="#FFFFFF"
                    opacity="0.07"
                    transform={`rotate(${rotation} ${x - 5} ${y - 6})`}
                  />
                </React.Fragment>
              );
            }
          )}

        <ellipse
          cx="118"
          cy="92"
          rx="82"
          ry="30"
          fill="#FFFFFF"
          opacity="0.15"
          transform="rotate(-25 118 92)"
          filter={`url(#detailBlur-${uid})`}
        />

        <ellipse
          cx="258"
          cy="118"
          rx="58"
          ry="21"
          fill="#FFF4C9"
          opacity="0.11"
          transform="rotate(20 258 118)"
          filter={`url(#detailBlur-${uid})`}
        />

        <ellipse
          cx="218"
          cy="260"
          rx="72"
          ry="19"
          fill="#FFFFFF"
          opacity="0.08"
          transform="rotate(-12 218 260)"
        />

        {showMap &&
          activeStates.map(state => {
            const pos =
              focusPosition(state);

            return (
              <g
                key={`map-${state.id}`}
              >
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={
                    4 +
                    state.value * 0.3
                  }
                  fill="#2F2926"
                  fillOpacity="0.80"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />

                <text
                  x={pos.x}
                  y={pos.y - 10}
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight="700"
                  fill="#2F2926"
                  paintOrder="stroke"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  strokeOpacity="0.82"
                >
                  {t(
                    `innerCanvas.states.${state.id}`
                  )}
                </text>
              </g>
            );
          })}

        {showMap && (
          <>
            <line
              x1="180"
              y1="30"
              x2="180"
              y2="330"
              stroke="#2F2926"
              strokeOpacity="0.13"
              strokeDasharray="3 5"
            />

            <line
              x1="30"
              y1="180"
              x2="330"
              y2="180"
              stroke="#2F2926"
              strokeOpacity="0.13"
              strokeDasharray="3 5"
            />
          </>
        )}
      </svg>

      {interactive && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-white/75 bg-white/80 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-[#6D5A53] shadow-sm backdrop-blur">
          {showMap
            ? t(
                "innerCanvas.hideMap"
              )
            : t(
                "innerCanvas.showMap"
              )}
        </div>
      )}
    </button>
  );
}


type ConstellationArtworkProps = {
  answers: EmotionalAnswers;
};

const CONSTELLATION_THEME_COPY = {
  perspective: {
    pt: "Talvez esta seja uma noite para olhar para o que estás a viver de um pouco mais longe. Nem tudo precisa de ser resolvido de uma só vez.",
    en: "Perhaps this is a night to look at what you are living through from a little further away. Not everything needs to be solved at once.",
    es: "Quizá esta sea una noche para mirar lo que estás viviendo desde un poco más lejos. No todo tiene que resolverse de una vez.",
    fr: "C'est peut-être une nuit pour regarder ce que tu vis avec un peu plus de recul. Tout ne doit pas être résolu en une seule fois.",
  },

  courage: {
    pt: "Há momentos em que coragem não significa avançar depressa. Pode significar apenas continuar presente e dar o próximo passo possível.",
    en: "There are moments when courage does not mean moving quickly. It can simply mean staying present and taking the next possible step.",
    es: "Hay momentos en los que el valor no significa avanzar deprisa. Puede significar simplemente seguir presente y dar el siguiente paso posible.",
    fr: "Il y a des moments où le courage ne signifie pas avancer vite. Il peut simplement signifier rester présent et faire le prochain pas possible.",
  },

  patience: {
    pt: "Algumas mudanças precisam de espaço e tempo. Hoje podes permitir-te não ter todas as respostas.",
    en: "Some changes need space and time. Today you can allow yourself not to have every answer.",
    es: "Algunos cambios necesitan espacio y tiempo. Hoy puedes permitirte no tener todas las respuestas.",
    fr: "Certains changements ont besoin d'espace et de temps. Aujourd'hui, tu peux t'autoriser à ne pas avoir toutes les réponses.",
  },

  connection: {
    pt: "Talvez haja algo importante naquilo que te liga aos outros e a ti próprio. Repara no que hoje te faz sentir acompanhado.",
    en: "There may be something important in what connects you to others and to yourself. Notice what helps you feel accompanied today.",
    es: "Quizá haya algo importante en lo que te conecta con los demás y contigo. Observa qué te hace sentir acompañado hoy.",
    fr: "Il y a peut-être quelque chose d'important dans ce qui te relie aux autres et à toi-même. Observe ce qui t'aide à te sentir accompagné aujourd'hui.",
  },

  renewal: {
    pt: "Um estado não é uma sentença. Mesmo mudanças pequenas podem abrir espaço para uma noite diferente da anterior.",
    en: "A state is not a sentence. Even small changes can make room for a night that feels different from the last.",
    es: "Un estado no es una sentencia. Incluso pequeños cambios pueden abrir espacio para una noche diferente de la anterior.",
    fr: "Un état n'est pas une condamnation. Même de petits changements peuvent ouvrir la voie à une nuit différente de la précédente.",
  },

  direction: {
    pt: "Não precisas de conhecer todo o caminho. Talvez baste perceber qual é a direção que neste momento te faz mais sentido.",
    en: "You do not need to know the whole path. It may be enough to notice which direction makes the most sense right now.",
    es: "No necesitas conocer todo el camino. Quizá baste con percibir qué dirección tiene más sentido ahora.",
    fr: "Tu n'as pas besoin de connaître tout le chemin. Il suffit peut-être de sentir quelle direction a le plus de sens maintenant.",
  },

  balance: {
    pt: "Dentro de nós podem existir sentimentos diferentes ao mesmo tempo. Não tens de escolher apenas um para que aquilo que sentes seja válido.",
    en: "Different feelings can exist within us at the same time. You do not have to choose only one for what you feel to be valid.",
    es: "Dentro de nosotros pueden existir sentimientos diferentes al mismo tiempo. No tienes que elegir solo uno para que lo que sientes sea válido.",
    fr: "Des sentiments différents peuvent coexister en nous. Tu n'as pas à n'en choisir qu'un pour que ce que tu ressens soit valable.",
  },

  rest: {
    pt: "Parar também pode fazer parte do caminho. Talvez hoje o teu corpo ou a tua mente estejam simplesmente a pedir um pouco mais de espaço.",
    en: "Stopping can also be part of the path. Perhaps today your body or mind is simply asking for a little more space.",
    es: "Parar también puede formar parte del camino. Quizá hoy tu cuerpo o tu mente simplemente estén pidiendo un poco más de espacio.",
    fr: "S'arrêter peut aussi faire partie du chemin. Peut-être qu'aujourd'hui ton corps ou ton esprit demande simplement un peu plus d'espace.",
  },

  curiosity: {
    pt: "Em vez de tentares explicar imediatamente o que sentes, experimenta observá-lo com curiosidade. O que poderá estar a pedir a tua atenção?",
    en: "Instead of immediately trying to explain what you feel, try observing it with curiosity. What might be asking for your attention?",
    es: "En lugar de intentar explicar inmediatamente lo que sientes, prueba a observarlo con curiosidad. ¿Qué podría estar pidiendo tu atención?",
    fr: "Au lieu d'essayer immédiatement d'expliquer ce que tu ressens, observe-le avec curiosité. Qu'est-ce qui pourrait demander ton attention ?",
  },

  resilience: {
    pt: "Aquilo que hoje pesa não apaga tudo o que já atravessaste. Podes reconhecer a dificuldade sem esquecer os recursos que também existem em ti.",
    en: "What feels heavy today does not erase everything you have already moved through. You can acknowledge difficulty without forgetting the resources within you.",
    es: "Lo que hoy pesa no borra todo lo que ya has atravesado. Puedes reconocer la dificultad sin olvidar los recursos que también existen en ti.",
    fr: "Ce qui pèse aujourd'hui n'efface pas tout ce que tu as déjà traversé. Tu peux reconnaître la difficulté sans oublier les ressources qui existent aussi en toi.",
  },

  openness: {
    pt: "Nem tudo precisa de ter uma forma definida hoje. Pode haver valor em deixar algum espaço para aquilo que ainda não sabes.",
    en: "Not everything needs a defined shape today. There can be value in leaving some space for what you do not yet know.",
    es: "No todo necesita tener una forma definida hoy. Puede haber valor en dejar espacio para aquello que todavía no sabes.",
    fr: "Tout n'a pas besoin d'avoir une forme définie aujourd'hui. Il peut être précieux de laisser de la place à ce que tu ne sais pas encore.",
  },
} as const;

function constellationLanguage(
  language: string
): "pt" | "en" | "es" | "fr" {
  const normalized =
    language.toLowerCase();

  if (normalized.startsWith("es")) {
    return "es";
  }

  if (normalized.startsWith("fr")) {
    return "fr";
  }

  if (normalized.startsWith("en")) {
    return "en";
  }

  return "pt";
}

function ConstellationArtwork({
  answers,
}: ConstellationArtworkProps) {
  const { i18n } = useTranslation();

  const match: ConstellationMatch =
    useMemo(
      () =>
        matchConstellation(
          answers
        ),
      [answers]
    );

  const language =
    constellationLanguage(
      i18n.language
    );

  const constellation =
    match.constellation;
const reflection =
    getConstellationReflection(
      constellation.id,
      language
    );

  const labels = {
    pt: {
      forming:
        "O teu céu de hoje",
      close:
        "A tua constelação aproxima-se de",
      sky:
        "NO CÉU",
      skyText:
        "Esta é uma das 88 constelações reconhecidas na astronomia moderna.",
      reflection:
        "PARA TI, HOJE",
      note:
        "Esta associação é simbólica e serve como convite à reflexão. Não é um diagnóstico nem uma previsão.",
      next:
        "Quando estiver escuro, olha para o céu e procura um conjunto de estrelas que te faça lembrar a forma que criaste hoje. Não precisas de encontrar esta constelação exatamente.",
    },

    en: {
      forming:
        "Your sky today",
      close:
        "Your constellation is closest to",
      sky:
        "IN THE SKY",
      skyText:
        "This is one of the 88 constellations recognised in modern astronomy.",
      reflection:
        "FOR YOU, TODAY",
      note:
        "This association is symbolic and is intended as an invitation to reflect. It is not a diagnosis or prediction.",
      next:
        "When it is dark, look at the sky and find a group of stars that reminds you of the shape you created today. You do not need to find this exact constellation.",
    },

    es: {
      forming:
        "Tu cielo de hoy",
      close:
        "Tu constelación se aproxima a",
      sky:
        "EN EL CIELO",
      skyText:
        "Esta es una de las 88 constelaciones reconocidas en la astronomía moderna.",
      reflection:
        "PARA TI, HOY",
      note:
        "Esta asociación es simbólica y sirve como invitación a la reflexión. No es un diagnóstico ni una predicción.",
      next:
        "Cuando esté oscuro, mira al cielo y busca un grupo de estrellas que te recuerde la forma que has creado hoy. No necesitas encontrar exactamente esta constelación.",
    },

    fr: {
      forming:
        "Ton ciel aujourd'hui",
      close:
        "Ta constellation se rapproche de",
      sky:
        "DANS LE CIEL",
      skyText:
        "Il s'agit de l'une des 88 constellations reconnues par l'astronomie moderne.",
      reflection:
        "POUR TOI, AUJOURD'HUI",
      note:
        "Cette association est symbolique et constitue une invitation à la réflexion. Ce n'est ni un diagnostic ni une prédiction.",
      next:
        "Quand il fera sombre, regarde le ciel et cherche un groupe d'étoiles qui te rappelle la forme que tu as créée aujourd'hui. Tu n'as pas besoin de trouver exactement cette constellation.",
    },
  }[language];


  return (
    <div className="overflow-hidden rounded-[28px] border border-[#252A4A] bg-[#090D20] shadow-[0_20px_50px_rgba(12,16,40,0.20)]">
      <div className="px-5 pb-2 pt-5 text-center">
        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#9DA8D8]">
          ✦ {labels.forming}
        </p>
      </div>

      <div className="relative mx-auto aspect-square w-full max-w-[390px]">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(circle at 28% 22%, rgba(102,126,234,.18), transparent 28%), radial-gradient(circle at 72% 68%, rgba(139,92,246,.16), transparent 32%), radial-gradient(circle at 50% 50%, rgba(255,255,255,.035), transparent 55%)",
          }}
        />

        <svg
          viewBox="0 0 360 360"
          className="relative z-10 h-full w-full"
          role="img"
          aria-label={
            constellation.name
          }
        >
          <defs>
            <filter
              id="confia-star-glow"
              x="-100%"
              y="-100%"
              width="300%"
              height="300%"
            >
              <feGaussianBlur
                stdDeviation="3.5"
                result="blur"
              />
              <feMerge>
                <feMergeNode
                  in="blur"
                />
                <feMergeNode
                  in="SourceGraphic"
                />
              </feMerge>
            </filter>

            <radialGradient
              id="confia-sky"
              cx="50%"
              cy="45%"
              r="65%"
            >
              <stop
                offset="0%"
                stopColor="#172044"
              />
              <stop
                offset="60%"
                stopColor="#0D132C"
              />
              <stop
                offset="100%"
                stopColor="#080B18"
              />
            </radialGradient>
          </defs>

          <rect
            x="0"
            y="0"
            width="360"
            height="360"
            rx="26"
            fill="url(#confia-sky)"
          />

          {Array.from(
            { length: 54 },
            (_, index) => {
              const x =
                14 +
                ((index * 83) %
                  332);

              const y =
                12 +
                ((index * 47 +
                  index * index * 3) %
                  334);

              const r =
                index % 9 === 0
                  ? 1.25
                  : index % 4 === 0
                    ? 0.85
                    : 0.55;

              return (
                <circle
                  key={
                    `background-star-${index}`
                  }
                  cx={x}
                  cy={y}
                  r={r}
                  fill="#FFFFFF"
                  opacity={
                    0.22 +
                    (index % 5) *
                      0.09
                  }
                />
              );
            }
          )}

          {match.stars.map(
            (star, index) => {
              if (
                index === 0
              ) {
                return null;
              }

              const previous =
                match.stars[
                  index - 1
                ];

              return (
                <line
                  key={
                    `constellation-line-${index}`
                  }
                  x1={
                    previous.x
                  }
                  y1={
                    previous.y
                  }
                  x2={star.x}
                  y2={star.y}
                  stroke="#AEBBFF"
                  strokeWidth="1.6"
                  strokeOpacity="0.62"
                  strokeLinecap="round"
                />
              );
            }
          )}

          {match.stars.map(
            (star, index) => (
              <g
                key={
                  `constellation-star-${index}`
                }
                filter="url(#confia-star-glow)"
              >
                <circle
                  cx={star.x}
                  cy={star.y}
                  r={
                    7 +
                    star.brightness *
                      5
                  }
                  fill="#C8D2FF"
                  opacity="0.10"
                />

                <circle
                  cx={star.x}
                  cy={star.y}
                  r={
                    2.4 +
                    star.brightness *
                      2.2
                  }
                  fill="#FFFFFF"
                />

                <circle
                  cx={star.x}
                  cy={star.y}
                  r="1.15"
                  fill="#FFFFFF"
                />
              </g>
            )
          )}
        </svg>
      </div>

      <div className="border-t border-white/10 px-5 pb-5 pt-5 text-center">
        <p className="text-[10px] font-bold text-[#9DA8D8]">
          {labels.close}
        </p>

        <h4 className="mt-1 text-[27px] font-black tracking-tight text-white">
          {constellation.name}
        </h4>

        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="rounded-full border border-white/10 bg-white/[0.07] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#C9D0F2]">
            {constellation.abbreviation}
          </span>

        </div>
      </div>

      <div className="space-y-4 bg-white px-5 py-5">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#6C72A3]">
            {labels.sky}
          </p>

          <p className="mt-1 text-[12px] font-semibold leading-relaxed text-[#55515D]">
            {labels.skyText}
          </p>
        </div>

        <div className="h-px bg-[#ECEAF2]" />

        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#934A38]">
            {labels.reflection}
          </p>

          <p className="mt-2 text-[13px] font-semibold leading-[1.65] text-[#3D3734]">
            {reflection}
          </p>
        </div>

        <div className="rounded-[18px] bg-[#F7F5FF] px-4 py-3">
          <p className="text-[11px] font-bold leading-relaxed text-[#65658A]">
            ✦ {labels.next}
          </p>
        </div>

        <p className="text-center text-[9px] font-semibold leading-relaxed text-slate-400">
          {labels.note}
        </p>
      </div>
    </div>
  );
}

export default function InnerCanvas({
  onBack,
}: Props) {
  const { t, i18n } = useTranslation();

  const [mode, setMode] =
    useState<Mode>("intro");

  const [page, setPage] =
    useState(0);

  const [answers, setAnswers] =
    useState<EmotionalAnswers>(
      emptyAnswers()
    );

  const [gallery, setGallery] =
    useState<InnerCanvasEntry[]>(
      () => getInnerCanvasGallery()
    );

  const rewardProgress =
    useMemo(
      () =>
        getInnerCanvasRewardProgress(
          gallery
        ),
      [gallery]
    );

  const [current, setCurrent] =
    useState<InnerCanvasEntry | null>(
      null
    );

  const [currentSaved, setCurrentSaved] =
    useState(false);

  const groups = useMemo(
    () =>
      Array.from(
        {
          length: Math.ceil(
            EMOTIONAL_STATES.length /
              GROUP_SIZE
          ),
        },
        (_, index) =>
          EMOTIONAL_STATES.slice(
            index * GROUP_SIZE,
            index * GROUP_SIZE +
              GROUP_SIZE
          )
      ),
    []
  );

  const currentGroup =
    groups[page] ?? [];

  const progress =
    ((page + 1) / groups.length) * 100;

  const dominant = useMemo(
    () =>
      current
        ? getDominantStates(
            current.answers,
            3
          )
        : [],
    [current]
  );

  const startSurvey = () => {
    setAnswers(emptyAnswers());
    setPage(0);
    setCurrent(null);
    setCurrentSaved(false);
    setMode("survey");
  };

  const finishSurvey = () => {
    const seed =
      hashAnswers(answers);

    const now =
      new Date();

    const createdAt =
      now.toISOString();

    const dayKey =
      getInnerCanvasDayKey(
        now
      );

    const entry: InnerCanvasEntry = {
      id:
        `bronze-${dayKey}`,

      createdAt,

      seed,

      answers,

      tier:
        "bronze",

      momentCount:
        1,

      periodStart:
        createdAt,

      periodEnd:
        createdAt,
    };

    /*
     * Resultado temporário: só será guardado
     * quando o utilizador escolher Guardar no Meu Céu.
     */
    setCurrent(
      entry
    );
    setCurrentSaved(false);

    setMode(
      "result"
    );
  };

  const nextPage = () => {
    if (page >= groups.length - 1) {
      finishSurvey();
      return;
    }

    setPage(value => value + 1);
  };

  const previousPage = () => {
    if (page === 0) {
      setMode("intro");
      return;
    }

    setPage(value => value - 1);
  };

  const openEntry = (
    entry: InnerCanvasEntry
  ) => {
    setCurrent(entry);
    setCurrentSaved(true);
    setMode("result");
  };

  const saveCurrentConstellation = () => {
    if (!current || currentSaved) {
      return;
    }

    const nextGallery =
      saveInnerCanvasEntry(current);

    const savedEntry =
      nextGallery.find(
        item => item.id === current.id
      ) ?? current;

    setGallery(nextGallery);
    setCurrent(savedEntry);
    setCurrentSaved(true);
  };

  const removeEntry = (
    id: string
  ) => {
    const next =
      deleteInnerCanvasEntry(id);

    setGallery(next);

    if (current?.id === id) {
      setCurrent(null);
      setCurrentSaved(false);
      setMode("gallery");
    }
  };

  return (
    <div className="mx-auto w-full max-w-md pb-10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            if (
              mode === "intro"
            ) {
              onBack();
              return;
            }

            if (
              mode === "gallery"
            ) {
              setMode("intro");
              return;
            }

            if (
              mode === "result"
            ) {
              setCurrent(null);
      setCurrentSaved(false);
              setMode("intro");
              return;
            }

            previousPage();
          }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E8DDD7]/80 bg-white text-[#934A38] shadow-sm active:scale-95"
          aria-label={t("back")}
        >
          ←
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#934A38]">
            CONFIA
          </p>

          <h2 className="truncate text-lg font-black tracking-tight text-[#F5F6FF]">
            {t("innerCanvas.title")}
          </h2>
        </div>

        {mode !== "gallery" && (
          <button
            type="button"
            onClick={() =>
              setMode("gallery")
            }
            className="rounded-full border border-[#E8DDD7]/70 bg-white px-3 py-2 text-[9px] font-black uppercase tracking-[0.1em] text-[#8A7167] shadow-sm"
          >
            {t("innerCanvas.gallery")}
          </button>
        )}
      </div>

      {mode === "intro" && (
        <div className="space-y-4">
          {/* O TEU CÉU — entrada principal */}
          <section className="relative overflow-hidden rounded-[32px] border border-[#6875B5]/25 bg-[#080C1D] px-6 py-7 text-white shadow-[0_20px_50px_rgba(8,12,29,0.22)]">
            {/* profundidade */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(105,120,205,0.28),transparent_31%),radial-gradient(circle_at_87%_82%,rgba(112,72,162,0.24),transparent_38%),linear-gradient(160deg,rgba(15,22,52,0.55),rgba(6,9,24,0.2))]"
            />

            {/* estrelas de fundo */}
            <div
              aria-hidden="true"
              className="absolute left-[7%] top-[10%] h-1 w-1 rounded-full bg-white/70 shadow-[32px_38px_0_rgba(255,255,255,0.38),71px_4px_0_rgba(255,255,255,0.68),112px_56px_0_rgba(255,255,255,0.30),153px_18px_0_rgba(255,255,255,0.55),201px_63px_0_rgba(255,255,255,0.42),242px_7px_0_rgba(255,255,255,0.62),284px_47px_0_rgba(255,255,255,0.35)]"
            />

            <span
              aria-hidden="true"
              className="absolute right-[13%] top-[15%] h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_9px_rgba(255,255,255,0.9)]"
            />

            <span
              aria-hidden="true"
              className="absolute bottom-[31%] left-[11%] h-1 w-1 rounded-full bg-[#DCE5FF]/70"
            />

            {/* halo */}
            <div
              aria-hidden="true"
              className="absolute -right-20 top-20 h-56 w-56 rounded-full bg-[#737BC9]/10 blur-3xl"
            />

            <div className="relative">
              <div className="mb-5 flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="text-sm text-[#DCE4FF]"
                >
                  ✦
                </span>

                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#AEB9E8]">
                  {t("innerCanvas.sixtySeconds")}
                </p>
              </div>

              <h3 className="max-w-[290px] text-[27px] font-black leading-[1.08] tracking-[-0.025em] text-white">
                {t("innerCanvas.introTitle")}
              </h3>

              <p className="mt-4 max-w-[320px] text-[13px] font-medium leading-[1.7] text-[#C4CBE5]">
                {t("innerCanvas.introText")}
              </p>

              {/* céu / constelação decorativa */}
              <div className="relative mt-6 h-[170px] overflow-hidden rounded-[26px] border border-white/[0.09] bg-[#0C122A]/70 shadow-[inset_0_0_35px_rgba(100,120,210,0.07)]">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(86,103,185,0.13),transparent_55%)]"
                />

                <svg
                  viewBox="0 0 360 170"
                  className="absolute inset-0 h-full w-full"
                  aria-hidden="true"
                >
                  <defs>
                    <filter id="intro-star-glow">
                      <feGaussianBlur
                        stdDeviation="2.8"
                        result="blur"
                      />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>

                    <linearGradient
                      id="intro-line-gradient"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#C8D4FF"
                        stopOpacity="0.34"
                      />
                      <stop
                        offset="100%"
                        stopColor="#FFFFFF"
                        stopOpacity="0.72"
                      />
                    </linearGradient>
                  </defs>

                  {/* pequenas estrelas */}
                  {[
                    [22, 28, 1.2],
                    [48, 125, 1],
                    [77, 48, 1.4],
                    [109, 142, 1],
                    [144, 24, 1.1],
                    [185, 135, 1.3],
                    [222, 31, 1],
                    [263, 143, 1.2],
                    [301, 43, 1.4],
                    [334, 113, 1],
                    [316, 18, 0.9],
                    [27, 91, 0.9],
                  ].map(([cx, cy, r], index) => (
                    <circle
                      key={`intro-background-star-${index}`}
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill="white"
                      opacity={
                        index % 3 === 0
                          ? 0.65
                          : 0.38
                      }
                    />
                  ))}

                  {/* constelação */}
                  <path
                    d="M54 111 L103 77 L151 98 L198 52 L248 78 L302 42"
                    fill="none"
                    stroke="url(#intro-line-gradient)"
                    strokeWidth="1.35"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {[
                    [54, 111, 3],
                    [103, 77, 3.6],
                    [151, 98, 2.8],
                    [198, 52, 4.2],
                    [248, 78, 3.1],
                    [302, 42, 3.7],
                  ].map(([cx, cy, r], index) => (
                    <g
                      key={`intro-main-star-${index}`}
                      filter="url(#intro-star-glow)"
                    >
                      <circle
                        cx={cx}
                        cy={cy}
                        r={r + 4}
                        fill="#AEBFFF"
                        opacity="0.08"
                      />
                      <circle
                        cx={cx}
                        cy={cy}
                        r={r}
                        fill="#FFFFFF"
                      />
                    </g>
                  ))}
                </svg>

                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <span className="rounded-full border border-white/10 bg-[#080D20]/70 px-3 py-1.5 text-[9px] font-bold tracking-[0.08em] text-[#ABB6DF] backdrop-blur">
                    ✦ 88
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={startSurvey}
                className="mt-6 w-full rounded-[22px] border border-[#8592D1]/35 bg-gradient-to-r from-[#5665B1] via-[#6875C1] to-[#7767B2] px-5 py-4 text-sm font-black text-white shadow-[0_12px_28px_rgba(65,78,151,0.28)] transition-all duration-200 active:scale-[0.99] active:opacity-95"
              >
                <span className="flex items-center justify-center gap-2">
                  <span aria-hidden="true">✦</span>
                  {t("innerCanvas.start")}
                </span>
              </button>
            </div>
          </section>

          {/* MEU CÉU — histórico */}
          {gallery.length > 0 && (
            <button
              type="button"
              onClick={() =>
                setMode("gallery")
              }
              className="group relative w-full overflow-hidden rounded-[24px] border border-[#DDE1F0] bg-gradient-to-br from-white to-[#F5F6FC] px-5 py-4 text-left shadow-[0_8px_24px_rgba(52,62,105,0.07)] transition-all duration-200 active:scale-[0.99]"
            >
              <div
                aria-hidden="true"
                className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[#7885C7]/10 blur-2xl"
              />

              <div className="relative flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[#10162F] text-[#E9EDFF] shadow-[0_6px_16px_rgba(16,22,47,0.15)]">
                    <span
                      aria-hidden="true"
                      className="text-lg"
                    >
                      ✦
                    </span>
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#626FAE]">
                      {t(
                        "innerCanvas.gallery"
                      )}
                    </p>

                    <p className="mt-1 text-sm font-bold text-[#2F3347]">
                      {t(
                        "innerCanvas.galleryCount",
                        {
                          count:
                            gallery.length,
                        }
                      )}
                    </p>
                  </div>
                </div>

                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#D8DDED] bg-white text-[#626FAE] transition-transform duration-200 group-hover:translate-x-0.5"
                >
                  →
                </span>
              </div>
            </button>
          )}
        </div>
      )}

      {mode === "survey" && (
        <section className="rounded-[30px] border border-white/10 bg-[#090D20] px-5 py-5 shadow-[0_18px_45px_rgba(5,8,24,0.30)]">
          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#9DA8D8]">
                  {t(
                    "innerCanvas.questionEyebrow",
                    {
                      current:
                        page + 1,
                      total:
                        groups.length,
                    }
                  )}
                </p>

                <h3 className="mt-1 text-xl font-black text-white">
                  {t(
                    "innerCanvas.questionTitle"
                  )}
                </h3>
              </div>

              <span className="text-xs font-black text-[#C8D2FF]">
                {Math.round(progress)}%
              </span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#6677C8] via-[#8795DC] to-[#A58AC9] transition-all duration-300"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>

          <p className="mb-5 text-xs font-semibold leading-relaxed text-slate-500">
            {t(
              "innerCanvas.scaleHelp"
            )}
          </p>

          <div className="space-y-5">
            {currentGroup.map(
              state => {
                const value =
                  answers[state.id] ?? 0;

                return (
                  <div
                    key={state.id}
                    className="rounded-[22px] border border-white/10 bg-white/[0.055] px-4 py-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-black text-[#F5F6FF]">
                        {t(
                          `innerCanvas.states.${state.id}`
                        )}
                      </span>

                      <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-[#6674BA]/20 px-2 text-xs font-black text-[#C8D2FF]">
                        {value}
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="1"
                      value={value}
                      onChange={event => {
                        const nextValue =
                          Number(
                            event.target
                              .value
                          );

                        setAnswers(
                          previous => ({
                            ...previous,
                            [state.id]:
                              nextValue,
                          })
                        );
                      }}
                      className="w-full accent-[#8C9BE2]"
                      aria-label={t(
                        `innerCanvas.states.${state.id}`
                      )}
                    />

                    <div className="mt-1 flex justify-between text-[9px] font-bold text-slate-400">
                      <span>
                        {t(
                          "innerCanvas.none"
                        )}
                      </span>
                      <span>
                        {t(
                          "innerCanvas.veryMuch"
                        )}
                      </span>
                    </div>
                  </div>
                );
              }
            )}
          </div>

          <button
            type="button"
            onClick={nextPage}
            className="mt-6 w-full rounded-[22px] bg-gradient-to-r from-[#6677C8] via-[#8795DC] to-[#A58AC9] px-5 py-4 text-sm font-black text-white shadow-[0_10px_24px_rgba(201,123,94,0.18)]"
          >
            {page === groups.length - 1
              ? t(
                  "innerCanvas.createArtwork"
                )
              : t(
                  "innerCanvas.continue"
                )}
          </button>
        </section>
      )}

      {mode === "result" &&
        current && (
          <div className="space-y-4">
            <section className="rounded-[30px] border border-[#E8DDD7]/70 bg-white p-4 shadow-[0_14px_36px_rgba(92,64,52,0.065)]">
              <div className="px-2 pb-4 pt-1">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#934A38]">
                  {t(
                    "innerCanvas.resultEyebrow"
                  )}
                </p>

                <h3 className="mt-1 text-xl font-black leading-tight text-[#F5F6FF]">
                  {t(
                    "innerCanvas.resultTitle"
                  )}
                </h3>

                <p className="mt-1 text-xs font-semibold text-slate-400">
                  {formatDate(
                    current.createdAt,
                    i18n.language
                  )}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className={
                      (current.tier ??
                        "bronze") ===
                      "gold"
                        ? "rounded-full border border-[#D9B85F]/45 bg-[#FFF8DB] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#98721F]"
                        : (current.tier ??
                            "bronze") ===
                          "silver"
                          ? "rounded-full border border-[#BCC4CC]/60 bg-[#F3F5F6] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#66717A]"
                          : "rounded-full border border-[#C98A6A]/35 bg-[#FFF2EB] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#B16B4B]"
                    }
                  >
                    {(current.tier ??
                      "bronze") ===
                    "gold"
                      ? `🥇 ${t(
                          "innerCanvas.tierGold"
                        )}`
                      : (current.tier ??
                          "bronze") ===
                        "silver"
                        ? `🥈 ${t(
                            "innerCanvas.tierSilver"
                          )}`
                        : `🥉 ${t(
                            "innerCanvas.tierBronze"
                          )}`}
                  </span>

                  {(current.tier ??
                    "bronze") !==
                    "bronze" &&
                    current.momentCount && (
                      <span className="text-[9px] font-bold text-slate-400">
                        {t(
                          "innerCanvas.createdFromMoments",
                          {
                            count:
                              current.momentCount,
                          }
                        )}
                      </span>
                    )}
                </div>
              </div>

              <ConstellationArtwork
                answers={
                  current.answers
                }
              />

              {dominant.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 px-1">
                  {dominant.map(
                    item => (
                      <div
                        key={
                          item.id
                        }
                        className="rounded-full border border-[#E8DDD7]/70 bg-[#FFF9F5] px-3 py-2"
                      >
                        <span className="text-[10px] font-black text-[#6D5A53]">
                          {t(
                            `innerCanvas.states.${item.id}`
                          )}{" "}
                          {item.value}/10
                        </span>
                      </div>
                    )
                  )}
                </div>
              )}

              <p className="mt-4 px-1 text-center text-[10px] font-semibold leading-relaxed text-slate-400">
                {t(
                  "innerCanvas.tapArtwork"
                )}
              </p>
            </section>

            <button
              type="button"
              onClick={saveCurrentConstellation}
              disabled={currentSaved}
              className={currentSaved ? "w-full rounded-[20px] border border-white/10 bg-[#171C38] px-4 py-4 text-xs font-black text-[#AEB7D9] opacity-80" : "w-full rounded-[20px] bg-gradient-to-r from-[#5665B1] via-[#6875C1] to-[#7767B2] px-4 py-4 text-xs font-black text-white shadow-[0_10px_25px_rgba(86,101,177,0.25)]"}
            >
              {currentSaved
                ? `✓ ${t("innerCanvas.savedInMySky")}`
                : `✦ ${t("innerCanvas.saveInMySky")}`}
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={startSurvey}
                className="rounded-[20px] border border-[#B85F48]/30 bg-[#FFF8F4] px-4 py-3.5 text-xs font-black text-[#C8D2FF]"
              >
                {t(
                  "innerCanvas.redo"
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  setMode("gallery")
                }
                className="rounded-[20px] bg-[#1B2242] px-4 py-3.5 text-xs font-black text-white"
              >
                {t(
                  "innerCanvas.openGallery"
                )}
              </button>
            </div>

            {!currentSaved && (
              <p className="text-center text-[10px] font-semibold text-slate-400">
                {t("innerCanvas.notSavedYet")}
              </p>
            )}
          </div>
        )}

      {mode === "gallery" && (
        <div className="space-y-4">
          <div className="px-1">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#934A38]">
              {t(
                "innerCanvas.galleryEyebrow"
              )}
            </p>

            <h3 className="mt-1 text-xl font-black text-white">
              {t(
                "innerCanvas.galleryTitle"
              )}
            </h3>

            <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-500">
              {t(
                "innerCanvas.gallerySubtitle"
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <section className="rounded-[24px] border border-[#C3C9CF]/65 bg-gradient-to-br from-white to-[#F1F3F4] p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#7B858D]">
                    🥈 {t(
                      "innerCanvas.tierSilver"
                    )}
                  </p>

                  <p className="mt-1 text-sm font-black text-[#F5F6FF]">
                    {t(
                      "innerCanvas.weeklyPiece"
                    )}
                  </p>
                </div>

                <span className="text-xs font-black text-[#737F88]">
                  {rewardProgress.week.count}/
                  {rewardProgress.week.target}
                </span>
              </div>

              <div className="mt-3 flex gap-1.5">
                {Array.from(
                  {
                    length:
                      rewardProgress.week
                        .target,
                  },
                  (_, index) => (
                    <div
                      key={
                        `week-${index}`
                      }
                      className={
                        index <
                        rewardProgress.week
                          .count
                          ? "h-2 flex-1 rounded-full bg-[#AEB7BE]"
                          : "h-2 flex-1 rounded-full bg-[#E2E6E8]"
                      }
                    />
                  )
                )}
              </div>

              <p className="mt-3 text-[10px] font-semibold leading-relaxed text-slate-500">
                {rewardProgress.week
                  .unlocked
                  ? t(
                      "innerCanvas.silverUnlocked"
                    )
                  : t(
                      "innerCanvas.silverHint"
                    )}
              </p>
            </section>

            <section className="rounded-[24px] border border-[#E2CB87]/55 bg-gradient-to-br from-[#FFFDF7] to-[#FFF5D8] p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#9C7A28]">
                    🥇 {t(
                      "innerCanvas.tierGold"
                    )}
                  </p>

                  <p className="mt-1 text-sm font-black text-[#F5F6FF]">
                    {t(
                      "innerCanvas.monthlyPiece"
                    )}
                  </p>
                </div>

                <span className="text-xs font-black text-[#9C7A28]">
                  {rewardProgress.month.count}/
                  {rewardProgress.month.target}
                </span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#EFE4C2]">
                <div
                  className="h-full rounded-full bg-[#D6B45C] transition-all duration-300"
                  style={{
                    width:
                      `${Math.min(
                        100,
                        (
                          rewardProgress
                            .month
                            .count /
                          rewardProgress
                            .month
                            .target
                        ) *
                          100
                      )}%`,
                  }}
                />
              </div>

              <p className="mt-3 text-[10px] font-semibold leading-relaxed text-slate-500">
                {rewardProgress.month
                  .unlocked
                  ? t(
                      "innerCanvas.goldUnlocked"
                    )
                  : t(
                      "innerCanvas.goldHint"
                    )}
              </p>
            </section>
          </div>

          {gallery.length === 0 ? (
            <div className="rounded-[28px] border border-[#E8DDD7]/70 bg-white px-6 py-10 text-center shadow-sm">
              <p className="text-sm font-black text-[#F5F6FF]">
                {t(
                  "innerCanvas.emptyGallery"
                )}
              </p>

              <button
                type="button"
                onClick={startSurvey}
                className="mt-4 rounded-full bg-gradient-to-r from-[#6677C8] via-[#8795DC] to-[#A58AC9] px-5 py-3 text-xs font-black text-white"
              >
                {t(
                  "innerCanvas.start"
                )}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {gallery.map(
                entry => (
                  <article
                    key={entry.id}
                    className="overflow-hidden rounded-[24px] border border-[#E8DDD7]/70 bg-white p-2 shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        openEntry(
                          entry
                        )
                      }
                      className="block w-full"
                    >
                      <EmotionalArtwork
                        answers={
                          entry.answers
                        }
                        seed={
                          entry.seed
                        }
                        interactive={
                          false
                        }
                        tier={
                          entry.tier ??
                          "bronze"
                        }
                      />

                      <p className="mt-2 px-1 text-left text-[9px] font-black text-[#6D5A53]">
                        {formatDate(
                          entry.createdAt,
                          i18n.language
                        )}
                      </p>

                      <div className="mt-1 flex items-center justify-between gap-1 px-1">
                        <span
                          className={
                            (entry.tier ??
                              "bronze") ===
                            "gold"
                              ? "text-[8px] font-black uppercase tracking-[0.1em] text-[#A37A1E]"
                              : (entry.tier ??
                                  "bronze") ===
                                "silver"
                                ? "text-[8px] font-black uppercase tracking-[0.1em] text-[#747F87]"
                                : "text-[8px] font-black uppercase tracking-[0.1em] text-[#B16B4B]"
                          }
                        >
                          {(entry.tier ??
                            "bronze") ===
                          "gold"
                            ? `🥇 ${t(
                                "innerCanvas.tierGold"
                              )}`
                            : (entry.tier ??
                                "bronze") ===
                              "silver"
                              ? `🥈 ${t(
                                  "innerCanvas.tierSilver"
                                )}`
                              : `🥉 ${t(
                                  "innerCanvas.tierBronze"
                                )}`}
                        </span>

                        {(entry.tier ??
                          "bronze") !==
                          "bronze" &&
                          entry.momentCount && (
                            <span className="text-[8px] font-bold text-slate-400">
                              {entry.momentCount}×
                            </span>
                          )}
                      </div>
                    </button>

                    {(entry.tier ??
                      "bronze") ===
                      "bronze" && (
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              t(
                                "innerCanvas.deleteConfirm"
                              )
                            )
                          ) {
                            removeEntry(
                              entry.id
                            );
                          }
                        }}
                        className="mt-1 w-full px-1 py-2 text-right text-[9px] font-bold text-slate-400"
                      >
                        {t(
                          "innerCanvas.delete"
                        )}
                      </button>
                    )}
                  </article>
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
