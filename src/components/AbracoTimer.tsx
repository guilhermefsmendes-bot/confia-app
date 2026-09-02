import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, Heart, Sparkles, Smile, ShieldAlert } from 'lucide-react';
import { SOOTHING_PHRASES } from '../data/initialData';
import { useTranslation } from "react-i18next";
import { App } from '@capacitor/app';
interface AbracoTimerProps {
  onAddXp: (amount: number) => void;
  onRegisterStop?: (stopFunction: () => void) => void;
}

type DoodlePoint = {
  x: number;
  y: number;
};

type DoodleStroke = {
  color: string;
  width: number;
  points: DoodlePoint[];
};

const DOODLE_PROMPT_KEYS = [
  "hugDoodle.prompts.landscape",
  "hugDoodle.prompts.shape",
  "hugDoodle.prompts.place",
  "hugDoodle.prompts.lines",
  "hugDoodle.prompts.smile",
  "hugDoodle.prompts.weather",
  "hugDoodle.prompts.safeCorner",
  "hugDoodle.prompts.animal",
  "hugDoodle.prompts.goat",
  "hugDoodle.prompts.badCat",
  "hugDoodle.prompts.cloudHouse",
  "hugDoodle.prompts.tinyWorld",
] as const;

export const AbracoTimer: React.FC<AbracoTimerProps> = ({ onAddXp, onRegisterStop }) => {
const { t } = useTranslation();
  const TOTAL_SECONDS = 300; // 5 minutes
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [isActive, setIsActive] = useState(false);
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [breatheState, setBreatheState] = useState<'Inalar' | 'Exalar'>('Inalar');
  const [completed, setCompleted] = useState(false);
const [selectedSound, setSelectedSound] = useState("rain");
const [showDoodle, setShowDoodle] = useState(false);
const [doodleColor, setDoodleColor] = useState("#C97B5E");
const [doodleWidth, setDoodleWidth] = useState(3);
const [doodleStrokeCount, setDoodleStrokeCount] = useState(0);
const [doodlePromptIndex, setDoodlePromptIndex] = useState(
  () => Math.floor(Math.random() * DOODLE_PROMPT_KEYS.length)
);
const [doodleFinished, setDoodleFinished] = useState(false);
const audioRef = useRef<HTMLAudioElement | null>(null);
const doodleCanvasRef = useRef<HTMLCanvasElement | null>(null);
const doodleDrawingRef = useRef(false);
const doodleLastPointRef = useRef<{ x: number; y: number } | null>(null);
const doodleStrokesRef = useRef<DoodleStroke[]>([]);
const doodleCurrentStrokeRef = useRef<DoodleStroke | null>(null);
const stopAudio = () => {
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    audioRef.current = null;
  }

  setIsActive(false);
};
useEffect(() => {
  const listener = () => {
    stopAudio();
  };

  window.addEventListener("stop-background-audio", listener);

  return () => {
    window.removeEventListener("stop-background-audio", listener);
  };
}, []);
useEffect(() => {
  if (onRegisterStop) {
    onRegisterStop(stopAudio);
  }
}, []);

  // Phrase rotation timer (every 15 seconds)
  useEffect(() => {
    if (!isActive) return;

    const phraseTimer = setInterval(() => {
      setPhraseIdx(prev => (prev + 1) % SOOTHING_PHRASES.length);
    }, 15000);

    return () => clearInterval(phraseTimer);
  }, [isActive]);

  // Main countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);
} else if (secondsLeft === 0 && isActive) {
stopAudio();
      setIsActive(false);
      setCompleted(true);
      onAddXp(30); // Great effort gets +30 XP!
}
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsLeft]);

  // Breathing pulse controller (every 5 seconds)
  useEffect(() => {
    if (!isActive) return;

    const breatheTimer = setInterval(() => {
      setBreatheState(prev => (prev === 'Inalar' ? 'Exalar' : 'Inalar'));
    }, 5000);

    return () => clearInterval(breatheTimer);
}, [isActive]);

// Stop audio when app goes background
useEffect(() => {

  const stopSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    setIsActive(false);
  };


  const listener = App.addListener(
    "appStateChange",
    ({ isActive }) => {
      if (!isActive) {
        stopSound();
      }
    }
  );


  const visibility = () => {
    if (document.hidden) {
      stopSound();
    }
  };


  document.addEventListener(
    "visibilitychange",
    visibility
  );


  return () => {
    listener.then(l => l.remove());
    document.removeEventListener(
      "visibilitychange",
      visibility
    );
  };

}, []);

const handleToggle = () => {
  if (!isActive) {
    const sound = new Audio(`/audio/${selectedSound}.mp3`);
    sound.loop = true;
    sound.play();

audioRef.current = sound;
  } else {
if (audioRef.current) {
  audioRef.current.pause();
  audioRef.current.currentTime = 0;
  audioRef.current = null;
}
  }

  setIsActive(!isActive);
  setCompleted(false);
};
const handleReset = () => {
stopAudio();
  setIsActive(false);
  setSecondsLeft(TOTAL_SECONDS);
  setPhraseIdx(0);
  setCompleted(false);
  setBreatheState('Inalar');
};
  
const DOODLE_MAX_STROKES = 120;
const DOODLE_MAX_POINTS_PER_STROKE = 900;

const getDoodlePixelRatio = () =>
  Math.min(window.devicePixelRatio || 1, 2);

const getDoodlePoint = (
  event: React.PointerEvent<HTMLCanvasElement>
): DoodlePoint | null => {
  const canvas = doodleCanvasRef.current;

  if (!canvas) {
    return null;
  }

  const rect = canvas.getBoundingClientRect();

  if (rect.width <= 0 || rect.height <= 0) {
    return null;
  }

  return {
    x: Math.max(
      0,
      Math.min(
        1,
        (event.clientX - rect.left) / rect.width
      )
    ),
    y: Math.max(
      0,
      Math.min(
        1,
        (event.clientY - rect.top) / rect.height
      )
    ),
  };
};

const configureDoodleContext = (
  context: CanvasRenderingContext2D,
  color: string,
  width: number
) => {
  const pixelRatio = getDoodlePixelRatio();

  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineWidth = Math.max(
    2,
    width * pixelRatio
  );
};

const drawDoodleStroke = (
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  stroke: DoodleStroke
) => {
  if (stroke.points.length === 0) {
    return;
  }

  configureDoodleContext(
    context,
    stroke.color,
    stroke.width
  );

  const firstPoint = stroke.points[0];

  const firstX = firstPoint.x * canvas.width;
  const firstY = firstPoint.y * canvas.height;

  if (stroke.points.length === 1) {
    context.beginPath();
    context.arc(
      firstX,
      firstY,
      context.lineWidth / 2,
      0,
      Math.PI * 2
    );
    context.fill();
    return;
  }

  context.beginPath();
  context.moveTo(firstX, firstY);

  for (
    let index = 1;
    index < stroke.points.length;
    index += 1
  ) {
    const point = stroke.points[index];

    context.lineTo(
      point.x * canvas.width,
      point.y * canvas.height
    );
  }

  context.stroke();
};

const redrawDoodle = () => {
  const canvas = doodleCanvasRef.current;

  if (!canvas) {
    return;
  }

  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  context.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  for (const stroke of doodleStrokesRef.current) {
    drawDoodleStroke(
      context,
      canvas,
      stroke
    );
  }
};

const prepareDoodleCanvas = (
  canvas: HTMLCanvasElement | null
) => {
  if (!canvas) {
    doodleCanvasRef.current = null;
    return;
  }

  doodleCanvasRef.current = canvas;

  const rect = canvas.getBoundingClientRect();

  if (rect.width <= 0 || rect.height <= 0) {
    return;
  }

  const pixelRatio = getDoodlePixelRatio();

  const nextWidth = Math.max(
    1,
    Math.round(rect.width * pixelRatio)
  );

  const nextHeight = Math.max(
    1,
    Math.round(rect.height * pixelRatio)
  );

  const sizeChanged =
    canvas.width !== nextWidth ||
    canvas.height !== nextHeight;

  if (sizeChanged) {
    canvas.width = nextWidth;
    canvas.height = nextHeight;
  }

  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  configureDoodleContext(
    context,
    doodleColor,
    doodleWidth
  );

  if (
    sizeChanged &&
    doodleStrokesRef.current.length > 0
  ) {
    redrawDoodle();
  }
};

const getDoodleContext = () => {
  const canvas = doodleCanvasRef.current;

  if (!canvas) {
    return null;
  }

  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  configureDoodleContext(
    context,
    doodleColor,
    doodleWidth
  );

  return context;
};

const handleDoodlePointerDown = (
  event: React.PointerEvent<HTMLCanvasElement>
) => {
  if (
    event.pointerType === "mouse" &&
    event.button !== 0
  ) {
    return;
  }

  const canvas = doodleCanvasRef.current;
  const point = getDoodlePoint(event);

  if (!canvas || !point) {
    return;
  }

  doodleDrawingRef.current = true;
  doodleLastPointRef.current = point;

  doodleCurrentStrokeRef.current = {
    color: doodleColor,
    width: doodleWidth,
    points: [point],
  };

  if (
    typeof canvas.setPointerCapture === "function"
  ) {
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture é uma otimização, não requisito.
    }
  }

  const context = getDoodleContext();

  if (!context) {
    return;
  }

  const x = point.x * canvas.width;
  const y = point.y * canvas.height;

  context.beginPath();
  context.arc(
    x,
    y,
    context.lineWidth / 2,
    0,
    Math.PI * 2
  );
  context.fill();
};

const handleDoodlePointerMove = (
  event: React.PointerEvent<HTMLCanvasElement>
) => {
  if (!doodleDrawingRef.current) {
    return;
  }

  const canvas = doodleCanvasRef.current;
  const previousPoint = doodleLastPointRef.current;
  const nextPoint = getDoodlePoint(event);
  const currentStroke = doodleCurrentStrokeRef.current;

  if (
    !canvas ||
    !previousPoint ||
    !nextPoint ||
    !currentStroke
  ) {
    return;
  }

  const dx = nextPoint.x - previousPoint.x;
  const dy = nextPoint.y - previousPoint.y;

  const distanceSquared =
    dx * dx + dy * dy;

  if (distanceSquared < 0.000004) {
    return;
  }

  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  configureDoodleContext(
    context,
    currentStroke.color,
    currentStroke.width
  );

  context.beginPath();

  context.moveTo(
    previousPoint.x * canvas.width,
    previousPoint.y * canvas.height
  );

  context.lineTo(
    nextPoint.x * canvas.width,
    nextPoint.y * canvas.height
  );

  context.stroke();

  if (
    currentStroke.points.length <
    DOODLE_MAX_POINTS_PER_STROKE
  ) {
    currentStroke.points.push(nextPoint);
  } else {
    currentStroke.points[
      currentStroke.points.length - 1
    ] = nextPoint;
  }

  doodleLastPointRef.current = nextPoint;
};

const stopDoodleDrawing = (
  event?: React.PointerEvent<HTMLCanvasElement>
) => {
  if (!doodleDrawingRef.current) {
    return;
  }

  const canvas = doodleCanvasRef.current;

  if (
    canvas &&
    event &&
    typeof canvas.hasPointerCapture === "function" &&
    typeof canvas.releasePointerCapture === "function"
  ) {
    try {
      if (
        canvas.hasPointerCapture(event.pointerId)
      ) {
        canvas.releasePointerCapture(
          event.pointerId
        );
      }
    } catch {
      // Sem impacto funcional.
    }
  }

  const completedStroke =
    doodleCurrentStrokeRef.current;

  if (
    completedStroke &&
    completedStroke.points.length > 0
  ) {
    const strokes = doodleStrokesRef.current;

    if (
      strokes.length >= DOODLE_MAX_STROKES
    ) {
      strokes.shift();
    }

    strokes.push(completedStroke);

    setDoodleStrokeCount(strokes.length);
  }

  doodleCurrentStrokeRef.current = null;
  doodleDrawingRef.current = false;
  doodleLastPointRef.current = null;
};

const undoDoodle = () => {
  if (doodleDrawingRef.current) {
    return;
  }

  if (doodleStrokesRef.current.length === 0) {
    return;
  }

  doodleStrokesRef.current.pop();

  setDoodleStrokeCount(
    doodleStrokesRef.current.length
  );

  redrawDoodle();
};

const clearDoodle = () => {
  const canvas = doodleCanvasRef.current;

  doodleDrawingRef.current = false;
  doodleLastPointRef.current = null;
  doodleCurrentStrokeRef.current = null;
  doodleStrokesRef.current = [];

  setDoodleStrokeCount(0);

  if (!canvas) {
    return;
  }

  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  context.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );
};

const chooseNextDoodlePrompt = () => {
  setDoodlePromptIndex(current => {
    if (DOODLE_PROMPT_KEYS.length <= 1) {
      return 0;
    }

    let next = current;

    while (next === current) {
      next = Math.floor(
        Math.random() * DOODLE_PROMPT_KEYS.length
      );
    }

    return next;
  });
};

const resetDoodleExperience = (
  changePrompt: boolean
) => {
  clearDoodle();
  setDoodleFinished(false);

  if (changePrompt) {
    chooseNextDoodlePrompt();
  }
};

const openDoodle = () => {
  clearDoodle();
  setDoodleFinished(false);
  chooseNextDoodlePrompt();
  setShowDoodle(true);
};

const finishDoodle = () => {
  doodleDrawingRef.current = false;
  doodleLastPointRef.current = null;
  doodleCurrentStrokeRef.current = null;

  // O desenho deixa de ser necessário quando entramos
  // no ritual final. Libertamos imediatamente a memória
  // vetorial temporária.
  doodleStrokesRef.current = [];

  setDoodleStrokeCount(0);
  setDoodleFinished(true);
};

const closeDoodle = () => {
  doodleDrawingRef.current = false;
  doodleLastPointRef.current = null;
  doodleCurrentStrokeRef.current = null;
  doodleStrokesRef.current = [];
  doodleCanvasRef.current = null;

  setDoodleStrokeCount(0);
  setDoodleFinished(false);
  setShowDoodle(false);
};


/*
 * CONFIA A4 — ciclo de vida do canvas
 *
 * O canvas usa agora um ref React estável.
 *
 * Este efeito só fica ativo enquanto:
 * - o Rabisco está aberto;
 * - o utilizador ainda está a desenhar.
 *
 * Não existe loop permanente.
 * ResizeObserver só reage a alterações reais de dimensão.
 */
useEffect(() => {
  if (!showDoodle || doodleFinished) {
    return;
  }

  const canvas = doodleCanvasRef.current;

  if (!canvas) {
    return;
  }

  prepareDoodleCanvas(canvas);

  let doodleCanvasResizeObserver:
    ResizeObserver | null = null;

  if (
    typeof ResizeObserver !== "undefined"
  ) {
    doodleCanvasResizeObserver =
      new ResizeObserver(() => {
        const currentCanvas =
          doodleCanvasRef.current;

        if (!currentCanvas) {
          return;
        }

        prepareDoodleCanvas(
          currentCanvas
        );
      });

    doodleCanvasResizeObserver.observe(
      canvas
    );
  }

  return () => {
    doodleCanvasResizeObserver?.disconnect();
  };
}, [showDoodle, doodleFinished]);

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Circular progress stroke calculation
  const progress = (TOTAL_SECONDS - secondsLeft) / TOTAL_SECONDS;
  const radius = 80;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="flex flex-col items-center max-w-md mx-auto space-y-6 py-4">
      {/* Tab Header Banner */}
      <div className="text-center space-y-1.5 w-full">
        <h2 className="text-xl font-black text-[#4E3B36] flex items-center justify-center gap-2 font-display">
<span className="text-[#E5A88B]">🫂</span> {t("mindHug")}
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto font-medium">
       {t("mindHugDescription")}
        </p>
      </div>

      {/* Main Visual breathing circle and Timer */}
      <div className="relative flex items-center justify-center w-64 h-64 my-4 bg-[#FFF0E8]/40 rounded-full border border-[#E5A88B]/15 shadow-inner">
        {/* Pulsing breathing back aura */}
        {isActive && (
          <motion.div
            animate={{
              scale: breatheState === 'Inalar' ? 1.3 : 0.9,
              opacity: breatheState === 'Inalar' ? 0.35 : 0.15,
            }}
            transition={{
              duration: 5,
              ease: "easeInOut",
            }}
            className="absolute inset-4 rounded-full bg-[#E5A88B]/20 blur-md pointer-events-none"
          />
        )}

        {/* SVG Circle Progress bar */}
        <svg className="absolute w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="128"
            cy="128"
            r={radius}
            className="text-[#FFF0E8] stroke-current"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Active progress circle */}
          <motion.circle
            cx="128"
            cy="128"
            r={radius}
            className="text-[#E5A88B] stroke-current"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "linear" }}
            strokeLinecap="round"
          />
        </svg>

        {/* Inner Content */}
        <div className="z-10 flex flex-col items-center text-center">
          {isActive ? (
            <motion.div
              key={breatheState}
              initial={{ scale: 0.9, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-xs font-extrabold uppercase tracking-widest text-[#C97B5E] mb-1 font-display"
            >
             {breatheState === 'Inalar'
 ? t("hugInhale")
 : t("hugExhale")}
            </motion.div>
          ) : (
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1 font-display">
             {completed ? t("completed") : t("ready")}
            </div>
          )}

          <div className="text-4xl font-mono font-bold text-[#4E3B36] tracking-tight">
            {formatTime(secondsLeft)}
          </div>

          {isActive && (
            <div className="text-[10px] text-slate-400 mt-1 font-medium">
             {t("breathingRhythm")}
            </div>
          )}
        </div>
      </div>

      {/* Soothing Phrase Display */}
      <div className="min-h-[85px] w-full flex items-center justify-center px-4">
        <AnimatePresence mode="wait">
          <motion.div
key={phraseIdx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <p className="text-sm font-semibold text-[#4E3B36] max-w-xs mx-auto leading-relaxed italic">
{isActive ? t(SOOTHING_PHRASES[phraseIdx]) : t("startHugMessage")}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
{/* Relaxing Sounds */}
<div className="w-full bg-[#F8F1EA] rounded-2xl p-4 border border-[#E5A88B]/20 mb-4">
  <p className="text-xs font-bold text-[#4E3B36] mb-3">
    🌿 {t("calmNow")}
  </p>

  <select
    value={selectedSound}
    onChange={(e) => setSelectedSound(e.target.value)}
    className="w-full rounded-xl border border-[#E5A88B]/30 px-3 py-2 text-sm bg-white"
  >
    <option value="rain">{t("soundRain")}</option>
    <option value="forest">{t("soundForest")}</option>
    <option value="ocean">{t("soundOcean")}</option>
    <option value="white-noise">{t("soundWhiteNoise")}</option>
  </select>
</div>

      {/* Abraço Premium — Rabisco */}
      <section className="w-full overflow-hidden rounded-[28px] border border-[#E5A88B]/20 bg-gradient-to-br from-[#FFF9F5] via-white to-[#FFFDFC]">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#E5A88B]/20 bg-white text-[#C97B5E] shadow-sm">
              <Smile
                size={18}
                strokeWidth={1.8}
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#C97B5E]">
                {t("hugDoodle.eyebrow")}
              </p>

              <h3 className="mt-1 text-base font-black tracking-tight text-[#4E3B36]">
                {t("hugDoodle.title")}
              </h3>

              <p className="mt-1.5 text-xs font-medium leading-relaxed text-slate-500">
                {t("hugDoodle.description")}
              </p>
            </div>
          </div>

          {!showDoodle ? (
            <button
              type="button"
              onClick={openDoodle}
              className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-[18px] border border-[#E5A88B]/25 bg-white px-4 py-3 text-xs font-black text-[#8B5E50] shadow-sm transition-transform active:scale-[0.99]"
            >
              <Sparkles
                size={15}
                strokeWidth={1.8}
              />

              {t("hugDoodle.open")}
            </button>
          ) : doodleFinished ? (
            <div className="mt-5 overflow-hidden rounded-[24px] border border-[#E5A88B]/20 bg-white">
              <div className="px-5 py-7 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF0E8] text-[#C97B5E]">
                  <Heart
                    size={20}
                    strokeWidth={1.7}
                  />
                </div>

                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.16em] text-[#C97B5E]">
                  {t("hugDoodle.ritualEyebrow")}
                </p>

                <h4 className="mx-auto mt-2 max-w-[250px] text-lg font-black leading-snug text-[#4E3B36]">
                  {t("hugDoodle.ritual")}
                </h4>

                <p className="mx-auto mt-2 max-w-[280px] text-xs font-medium leading-relaxed text-slate-500">
                  {t("hugDoodle.ritualDescription")}
                </p>
              </div>

              <div className="grid grid-cols-2 border-t border-[#E8DDD7]/70">
                <button
                  type="button"
                  onClick={closeDoodle}
                  className="min-h-12 border-r border-[#E8DDD7]/70 px-3 py-3 text-xs font-bold text-[#8B6B60] transition-colors active:bg-[#FAF5F0]"
                >
                  {t("hugDoodle.letGo")}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    resetDoodleExperience(true)
                  }
                  className="min-h-12 px-3 py-3 text-xs font-black text-[#C97B5E] transition-colors active:bg-[#FFF8F4]"
                >
                  {t("hugDoodle.another")}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-5">
              <div className="mb-3 rounded-[20px] border border-[#E5A88B]/20 bg-[#FFF8F4] px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#C97B5E]">
                      {t("hugDoodle.challenge")}
                    </p>

                    <p className="mt-1.5 text-sm font-black leading-relaxed text-[#4E3B36]">
                      {t(
                        DOODLE_PROMPT_KEYS[
                          doodlePromptIndex
                        ]
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      clearDoodle();
                      chooseNextDoodlePrompt();
                    }}
                    aria-label={
                      t("hugDoodle.newChallenge")
                    }
                    title={
                      t("hugDoodle.newChallenge")
                    }
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border border-[#E5A88B]/20 bg-white text-[#C97B5E] shadow-sm transition-transform active:scale-95"
                  >
                    <RotateCcw
                      size={14}
                      strokeWidth={1.8}
                    />
                  </button>
                </div>
              </div>

              <div className="mb-3 flex items-center justify-between gap-3 px-1">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#C97B5E]">
                    {t("hugDoodle.tools")}
                  </p>

                  <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                    {t("hugDoodle.toolsHint")}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={undoDoodle}
                  disabled={doodleStrokeCount === 0}
                  aria-label={t("hugDoodle.undo")}
                  title={t("hugDoodle.undo")}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-[#E8DDD7] bg-white text-[#8B6B60] shadow-sm transition-transform enabled:active:scale-[0.96] disabled:cursor-default disabled:opacity-30"
                >
                  <RotateCcw
                    size={16}
                    strokeWidth={1.8}
                  />
                </button>
              </div>

              <div className="mb-3 flex items-center justify-between gap-3 rounded-[20px] border border-[#E8DDD7]/70 bg-white/75 px-3 py-2.5">
                <div
                  className="flex items-center gap-2"
                  role="group"
                  aria-label={t("hugDoodle.color")}
                >
                  {[
                    "#C97B5E",
                    "#4E3B36",
                    "#D9A66F",
                    "#829A8A",
                  ].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() =>
                        setDoodleColor(color)
                      }
                      aria-label={t(
                        "hugDoodle.chooseColor"
                      )}
                      aria-pressed={
                        doodleColor === color
                      }
                      className={`flex h-8 w-8 items-center justify-center rounded-full transition-transform active:scale-90 ${
                        doodleColor === color
                          ? "ring-2 ring-[#C97B5E]/35 ring-offset-2"
                          : ""
                      }`}
                    >
                      <span
                        className="block h-6 w-6 rounded-full border border-black/5 shadow-sm"
                        style={{
                          backgroundColor: color,
                        }}
                      />
                    </button>
                  ))}
                </div>

                <div
                  className="flex items-center gap-1 rounded-[14px] bg-[#FAF5F0] p-1"
                  role="group"
                  aria-label={t("hugDoodle.thickness")}
                >
                  {[2, 3, 5].map(width => (
                    <button
                      key={width}
                      type="button"
                      onClick={() =>
                        setDoodleWidth(width)
                      }
                      aria-label={t(
                        "hugDoodle.chooseThickness"
                      )}
                      aria-pressed={
                        doodleWidth === width
                      }
                      className={`flex h-8 w-8 items-center justify-center rounded-[10px] transition-all active:scale-90 ${
                        doodleWidth === width
                          ? "bg-white shadow-sm"
                          : "bg-transparent"
                      }`}
                    >
                      <span
                        className="block rounded-full bg-[#6F5750]"
                        style={{
                          width:
                            width === 2
                              ? 4
                              : width === 3
                                ? 6
                                : 9,
                          height:
                            width === 2
                              ? 4
                              : width === 3
                                ? 6
                                : 9,
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-[#E8DDD7]/80 bg-[#FFFCF9] p-3 shadow-inner">
                <canvas
                  ref={doodleCanvasRef}
                  width={640}
                  height={440}
                  onPointerDown={
                    handleDoodlePointerDown
                  }
                  onPointerMove={
                    handleDoodlePointerMove
                  }
                  onPointerUp={
                    stopDoodleDrawing
                  }
                  onPointerCancel={
                    stopDoodleDrawing
                  }
                  onLostPointerCapture={() =>
                    stopDoodleDrawing()
                  }
                  aria-label={
                    t("hugDoodle.canvasLabel")
                  }
                  className="block aspect-[16/11] w-full cursor-crosshair touch-none rounded-[18px] border border-[#E8DDD7]/70 bg-white"
                />
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={clearDoodle}
                  disabled={doodleStrokeCount === 0}
                  className="min-h-11 flex-1 rounded-[16px] border border-[#E8DDD7] bg-white px-3 py-2.5 text-xs font-bold text-[#8B6B60] transition-transform enabled:active:scale-[0.98] disabled:cursor-default disabled:opacity-40"
                >
                  {t("hugDoodle.clear")}
                </button>

                <button
                  type="button"
                  onClick={finishDoodle}
                  disabled={doodleStrokeCount === 0}
                  className="min-h-11 flex-1 rounded-[16px] bg-[#C97B5E] px-3 py-2.5 text-xs font-black text-white shadow-[0_6px_16px_rgba(201,123,94,0.16)] transition-transform enabled:active:scale-[0.98] disabled:cursor-default disabled:opacity-40 disabled:shadow-none"
                >
                  {t("hugDoodle.close")}
                </button>
              </div>

              <p className="mt-3 text-center text-[10px] font-medium leading-relaxed text-slate-400">
                {t("hugDoodle.private")}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Control Buttons */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleReset}
          className="p-3 bg-white hover:bg-[#FAF5F0] text-slate-500 hover:text-[#4E3B36] rounded-2xl border border-[#E5A88B]/15 shadow-sm transition-all cursor-pointer"
         title={t("reset")}
        >
          <RotateCcw size={18} />
        </button>

        <button
          onClick={handleToggle}
          className={`px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider font-display shadow-lg transition-all flex items-center gap-2 cursor-pointer ${
            isActive
              ? 'bg-[#E5A88B] hover:bg-[#D59375] text-white shadow-[#E5A88B]/25'
              : 'bg-[#C97B5E] hover:bg-[#B56A4F] text-white shadow-[#C97B5E]/20'
          }`}
        >
          {isActive ? (
            <>
             <Pause size={14} fill="currentColor" /> {t("pauseHug")}
            </>
          ) : (
            <>
             <Play size={14} fill="currentColor" /> {t("startHug")}
            </>
          )}
        </button>
      </div>

      {/* Completion reward banner */}
      <AnimatePresence>
        {completed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#E5A88B]/10 border border-[#E5A88B]/25 p-5 rounded-[24px] text-center max-w-sm space-y-1.5"
          >
            <div className="flex items-center justify-center text-[#C97B5E] gap-1">
              <Sparkles size={16} className="animate-spin" />
             <span className="font-extrabold text-xs uppercase tracking-widest font-display">
  {t("sessionCompleted")}
</span>
            </div>
           <p className="text-xs text-[#4E3B36] leading-relaxed font-semibold">
  {t("sessionCompletedMessage")}{" "}
  <strong className="text-[#C97B5E]">+30 XP</strong>{" "}
  {t("sessionCompletedReward")}
</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
