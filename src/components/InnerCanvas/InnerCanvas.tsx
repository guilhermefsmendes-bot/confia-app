import React, {
  useId,
  useMemo,
  useState,
} from "react";

import { useTranslation } from "react-i18next";

import {
  EMOTIONAL_STATES,
  FAMILY_COLORS,
  getDominantStates,
  hashAnswers,
  seededNoise,
  type EmotionalAnswers,
  type EmotionalFamily,
} from "./innerCanvasEngine";

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
                  fill="#4E3B36"
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
                  fill="#4E3B36"
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
              stroke="#4E3B36"
              strokeOpacity="0.13"
              strokeDasharray="3 5"
            />

            <line
              x1="30"
              y1="180"
              x2="330"
              y2="180"
              stroke="#4E3B36"
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

    const nextGallery =
      saveInnerCanvasEntry(
        entry
      );

    /*
     * Recuperamos a versão já
     * normalizada pelo storage.
     */
    const savedEntry =
      nextGallery.find(
        item =>
          item.id ===
          entry.id
      ) ?? entry;

    setGallery(
      nextGallery
    );

    setCurrent(
      savedEntry
    );

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
    setMode("result");
  };

  const removeEntry = (
    id: string
  ) => {
    const next =
      deleteInnerCanvasEntry(id);

    setGallery(next);

    if (current?.id === id) {
      setCurrent(null);
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
              setMode("intro");
              return;
            }

            previousPage();
          }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E8DDD7]/80 bg-white text-[#C97B5E] shadow-sm active:scale-95"
          aria-label={t("back")}
        >
          ←
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#C97B5E]">
            CONFIA
          </p>

          <h2 className="truncate text-lg font-black tracking-tight text-[#4E3B36]">
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
          <section className="relative overflow-hidden rounded-[32px] border border-[#E5A88B]/20 bg-gradient-to-br from-[#FFF8F3] via-white to-[#F7F1ED] px-6 py-7 shadow-[0_16px_40px_rgba(92,64,52,0.07)]">
            <div
              aria-hidden="true"
              className="absolute -right-14 -top-12 h-44 w-44 rounded-full bg-[#E9C7B5]/20 blur-2xl"
            />

            <p className="relative text-[10px] font-black uppercase tracking-[0.18em] text-[#C97B5E]">
              {t(
                "innerCanvas.sixtySeconds"
              )}
            </p>

            <h3 className="relative mt-2 text-2xl font-black leading-tight text-[#4E3B36]">
              {t(
                "innerCanvas.introTitle"
              )}
            </h3>

            <p className="relative mt-3 text-sm font-medium leading-relaxed text-[#7B6A63]">
              {t(
                "innerCanvas.introText"
              )}
            </p>

            <div className="relative mt-6 overflow-hidden rounded-[25px] border border-[#E8DDD7]/70 bg-[#EEE9E4]">
              <svg
                viewBox="0 0 360 150"
                className="block w-full"
              >
                <defs>
                  <radialGradient id="preview-a">
                    <stop
                      offset="0%"
                      stopColor="#EBD8C7"
                    />
                    <stop
                      offset="55%"
                      stopColor="#C9D8D0"
                    />
                    <stop
                      offset="100%"
                      stopColor="#B28A8D"
                    />
                  </radialGradient>
                </defs>

                <path
                  d="M58 86 C50 40 97 19 139 34 C177 7 230 21 237 58 C294 54 326 91 297 120 C257 146 218 127 185 131 C151 145 112 133 92 115 C73 112 60 102 58 86Z"
                  fill="url(#preview-a)"
                  opacity="0.94"
                />

                <ellipse
                  cx="132"
                  cy="58"
                  rx="74"
                  ry="24"
                  fill="#FFFFFF"
                  opacity="0.16"
                  transform="rotate(-18 132 58)"
                />
              </svg>
            </div>

            <button
              type="button"
              onClick={startSurvey}
              className="relative mt-6 w-full rounded-[22px] bg-[#C97B5E] px-5 py-4 text-sm font-black text-white shadow-[0_10px_24px_rgba(201,123,94,0.22)] active:scale-[0.99]"
            >
              {t(
                "innerCanvas.start"
              )}
            </button>
          </section>

          {gallery.length > 0 && (
            <button
              type="button"
              onClick={() =>
                setMode("gallery")
              }
              className="w-full rounded-[24px] border border-[#E8DDD7]/70 bg-white px-5 py-4 text-left shadow-sm"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#C97B5E]">
                {t(
                  "innerCanvas.gallery"
                )}
              </p>

              <p className="mt-1 text-sm font-bold text-[#4E3B36]">
                {t(
                  "innerCanvas.galleryCount",
                  {
                    count:
                      gallery.length,
                  }
                )}
              </p>
            </button>
          )}
        </div>
      )}

      {mode === "survey" && (
        <section className="rounded-[30px] border border-[#E8DDD7]/70 bg-white px-5 py-5 shadow-[0_12px_30px_rgba(92,64,52,0.055)]">
          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#C97B5E]">
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

                <h3 className="mt-1 text-xl font-black text-[#4E3B36]">
                  {t(
                    "innerCanvas.questionTitle"
                  )}
                </h3>
              </div>

              <span className="text-xs font-black text-[#C97B5E]">
                {Math.round(progress)}%
              </span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-[#F1E8E3]">
              <div
                className="h-full rounded-full bg-[#C97B5E] transition-all duration-300"
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
                    className="rounded-[22px] border border-[#EEE5E0] bg-[#FFFCFA] px-4 py-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-black text-[#4E3B36]">
                        {t(
                          `innerCanvas.states.${state.id}`
                        )}
                      </span>

                      <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-[#FFF0E8] px-2 text-xs font-black text-[#C97B5E]">
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
                      className="w-full accent-[#C97B5E]"
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
            className="mt-6 w-full rounded-[22px] bg-[#C97B5E] px-5 py-4 text-sm font-black text-white shadow-[0_10px_24px_rgba(201,123,94,0.18)]"
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
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#C97B5E]">
                  {t(
                    "innerCanvas.resultEyebrow"
                  )}
                </p>

                <h3 className="mt-1 text-xl font-black leading-tight text-[#4E3B36]">
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

              <EmotionalArtwork
                answers={
                  current.answers
                }
                seed={
                  current.seed
                }
                tier={
                  current.tier ??
                  "bronze"
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

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={startSurvey}
                className="rounded-[20px] border border-[#E5A88B]/30 bg-[#FFF8F4] px-4 py-3.5 text-xs font-black text-[#C97B5E]"
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
                className="rounded-[20px] bg-[#4E3B36] px-4 py-3.5 text-xs font-black text-white"
              >
                {t(
                  "innerCanvas.openGallery"
                )}
              </button>
            </div>

            <p className="text-center text-[10px] font-semibold text-slate-400">
              {t(
                "innerCanvas.savedAutomatically"
              )}
            </p>
          </div>
        )}

      {mode === "gallery" && (
        <div className="space-y-4">
          <div className="px-1">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#C97B5E]">
              {t(
                "innerCanvas.galleryEyebrow"
              )}
            </p>

            <h3 className="mt-1 text-xl font-black text-[#4E3B36]">
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

                  <p className="mt-1 text-sm font-black text-[#4E3B36]">
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

                  <p className="mt-1 text-sm font-black text-[#4E3B36]">
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
              <p className="text-sm font-black text-[#4E3B36]">
                {t(
                  "innerCanvas.emptyGallery"
                )}
              </p>

              <button
                type="button"
                onClick={startSurvey}
                className="mt-4 rounded-full bg-[#C97B5E] px-5 py-3 text-xs font-black text-white"
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
