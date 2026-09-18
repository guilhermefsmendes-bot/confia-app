from pathlib import Path
import shutil
import sys
import json

# ============================================================
# CONFIA — ABRAÇO PREMIUM A2
# RABISCO — FERRAMENTAS PREMIUM LEVES
#
# Adiciona:
# - 4 cores
# - 3 espessuras
# - Desfazer
# - histórico vetorial temporário
#
# Performance:
# - zero setState durante pointermove
# - máximo 120 traços
# - máximo 900 pontos por traço
# - pontos normalizados 0..1
# - sem ImageData
# - sem base64
# - sem localStorage
# - sem novas bibliotecas
#
# ALTERA:
# - src/components/AbracoTimer.tsx
# - src/locales/pt.json
# - src/locales/en.json
# - src/locales/es.json
# - src/locales/fr.json
# ============================================================

ROOT = Path.cwd()

COMPONENT = ROOT / "src/components/AbracoTimer.tsx"

LOCALES = {
    "pt": ROOT / "src/locales/pt.json",
    "en": ROOT / "src/locales/en.json",
    "es": ROOT / "src/locales/es.json",
    "fr": ROOT / "src/locales/fr.json",
}

BACKUP_COMPONENT = Path(
    "/tmp/AbracoTimer.tsx.before_abraco_premium_a2"
)


def fail(message: str):
    print()
    print("=" * 76)
    print("ERRO — A2 NÃO APLICADA")
    print("=" * 76)
    print()
    print(message)
    print()
    print("Nenhum ficheiro foi alterado.")
    print("=" * 76)
    sys.exit(1)


# ============================================================
# 1. CARREGAR
# ============================================================

if not COMPONENT.exists():
    fail(f"Não encontrei:\n{COMPONENT}")

for language, path in LOCALES.items():
    if not path.exists():
        fail(
            f"Locale {language.upper()} não encontrado:\n{path}"
        )

component_original = COMPONENT.read_text(
    encoding="utf-8"
)

locale_originals = {
    language: path.read_text(encoding="utf-8")
    for language, path in LOCALES.items()
}

locale_data = {}

for language, text in locale_originals.items():
    try:
        locale_data[language] = json.loads(text)
    except json.JSONDecodeError as error:
        fail(
            f"{language.upper()} inválido antes da A2:\n"
            f"{error}"
        )


# ============================================================
# 2. VALIDAR A1
# ============================================================

a1_markers = [
    "const [showDoodle, setShowDoodle] = useState(false);",
    "const doodleCanvasRef = useRef<HTMLCanvasElement | null>(null);",
    "const doodleDrawingRef = useRef(false);",
    "const doodleLastPointRef = useRef<{ x: number; y: number } | null>(null);",
    "const getDoodlePoint = (",
    "const prepareDoodleCanvas = (",
    "const getDoodleContext = () => {",
    "const handleDoodlePointerDown = (",
    "const handleDoodlePointerMove = (",
    "const stopDoodleDrawing = (",
    "const clearDoodle = () => {",
    "const closeDoodle = () => {",
    "Abraço Premium — Rabisco",
    't("hugDoodle.clear")',
    't("hugDoodle.close")',
]

for marker in a1_markers:
    if marker not in component_original:
        fail(
            "A A1 não corresponde à estrutura esperada.\n\n"
            f"Falta:\n{marker}"
        )

if "doodleStrokesRef" in component_original:
    fail(
        "A A2 já parece estar aplicada."
    )

for language, data in locale_data.items():
    if "hugDoodle" not in data:
        fail(
            f"{language.upper()}: hugDoodle não existe."
        )


# ============================================================
# 3. ADICIONAR TIPOS
# ============================================================

interface_anchor = """interface AbracoTimerProps {
  onAddXp: (amount: number) => void;
  onRegisterStop?: (stopFunction: () => void) => void;
}"""

if component_original.count(interface_anchor) != 1:
    fail(
        "Não encontrei exatamente AbracoTimerProps."
    )

types_block = """interface AbracoTimerProps {
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
};"""

component_updated = component_original.replace(
    interface_anchor,
    types_block,
    1,
)


# ============================================================
# 4. ESTADOS E REFS
# ============================================================

show_state = (
    "const [showDoodle, setShowDoodle] = useState(false);"
)

if component_updated.count(show_state) != 1:
    fail("Estado showDoodle inesperado.")

component_updated = component_updated.replace(
    show_state,
    """const [showDoodle, setShowDoodle] = useState(false);
const [doodleColor, setDoodleColor] = useState("#C97B5E");
const [doodleWidth, setDoodleWidth] = useState(3);
const [doodleStrokeCount, setDoodleStrokeCount] = useState(0);""",
    1,
)

old_refs = """const doodleCanvasRef = useRef<HTMLCanvasElement | null>(null);
const doodleDrawingRef = useRef(false);
const doodleLastPointRef = useRef<{ x: number; y: number } | null>(null);"""

if component_updated.count(old_refs) != 1:
    fail("Refs A1 não encontrados exatamente.")

new_refs = """const doodleCanvasRef = useRef<HTMLCanvasElement | null>(null);
const doodleDrawingRef = useRef(false);
const doodleLastPointRef = useRef<{ x: number; y: number } | null>(null);
const doodleStrokesRef = useRef<DoodleStroke[]>([]);
const doodleCurrentStrokeRef = useRef<DoodleStroke | null>(null);"""

component_updated = component_updated.replace(
    old_refs,
    new_refs,
    1,
)


# ============================================================
# 5. SUBSTITUIR MOTOR A1 PELO MOTOR A2
# ============================================================

engine_start = component_updated.find(
    "const getDoodlePoint = ("
)

engine_end = component_updated.find(
    "const formatTime",
    engine_start
)

if engine_start == -1 or engine_end == -1:
    fail(
        "Não consegui isolar o motor A1."
    )

old_engine = component_updated[
    engine_start:engine_end
]

for marker in [
    "prepareDoodleCanvas",
    "handleDoodlePointerDown",
    "handleDoodlePointerMove",
    "stopDoodleDrawing",
    "clearDoodle",
    "closeDoodle",
]:
    if marker not in old_engine:
        fail(
            "Motor A1 incompleto:\n"
            f"{marker}"
        )


new_engine = r'''const DOODLE_MAX_STROKES = 120;
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

const closeDoodle = () => {
  doodleDrawingRef.current = false;
  doodleLastPointRef.current = null;
  doodleCurrentStrokeRef.current = null;
  doodleStrokesRef.current = [];
  doodleCanvasRef.current = null;

  setDoodleStrokeCount(0);
  setShowDoodle(false);
};

'''

component_updated = (
    component_updated[:engine_start]
    + new_engine
    + component_updated[engine_end:]
)


# ============================================================
# 6. SUBSTITUIR APENAS A UI INTERNA DO RABISCO
# ============================================================

ui_start_marker = (
    "      {/* Abraço Premium — Rabisco */}"
)

ui_end_marker = (
    "      {/* Control Buttons */}"
)

ui_start = component_updated.find(
    ui_start_marker
)

ui_end = component_updated.find(
    ui_end_marker,
    ui_start
)

if ui_start == -1 or ui_end == -1:
    fail(
        "Não consegui isolar a interface A1 do Rabisco."
    )

old_ui = component_updated[
    ui_start:ui_end
]

for marker in [
    "!showDoodle",
    "<canvas",
    "clearDoodle",
    "closeDoodle",
    "hugDoodle.private",
]:
    if marker not in old_ui:
        fail(
            "UI A1 inesperada:\n"
            f"{marker}"
        )


new_ui = '''      {/* Abraço Premium — Rabisco */}
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
              onClick={() => setShowDoodle(true)}
              className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-[18px] border border-[#E5A88B]/25 bg-white px-4 py-3 text-xs font-black text-[#8B5E50] shadow-sm transition-transform active:scale-[0.99]"
            >
              <Sparkles
                size={15}
                strokeWidth={1.8}
              />

              {t("hugDoodle.open")}
            </button>
          ) : (
            <div className="mt-5">
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
                <p className="mb-3 px-1 text-center text-xs font-bold leading-relaxed text-[#6F5750]">
                  {t("hugDoodle.prompt")}
                </p>

                <canvas
                  ref={prepareDoodleCanvas}
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
                  onClick={closeDoodle}
                  className="min-h-11 flex-1 rounded-[16px] bg-[#C97B5E] px-3 py-2.5 text-xs font-black text-white shadow-[0_6px_16px_rgba(201,123,94,0.16)] transition-transform active:scale-[0.98]"
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

'''

component_updated = (
    component_updated[:ui_start]
    + new_ui
    + component_updated[ui_end:]
)


# ============================================================
# 7. TRADUÇÕES A2
# ============================================================

translations = {
    "pt": {
        "tools": "O teu traço",
        "toolsHint": "Escolhe uma cor e deixa a mão seguir.",
        "undo": "Desfazer último traço",
        "color": "Cor do traço",
        "chooseColor": "Escolher esta cor",
        "thickness": "Espessura do traço",
        "chooseThickness": "Escolher esta espessura",
    },
    "en": {
        "tools": "Your stroke",
        "toolsHint": "Choose a colour and let your hand follow.",
        "undo": "Undo last stroke",
        "color": "Stroke colour",
        "chooseColor": "Choose this colour",
        "thickness": "Stroke thickness",
        "chooseThickness": "Choose this thickness",
    },
    "es": {
        "tools": "Tu trazo",
        "toolsHint": "Elige un color y deja que la mano siga.",
        "undo": "Deshacer el último trazo",
        "color": "Color del trazo",
        "chooseColor": "Elegir este color",
        "thickness": "Grosor del trazo",
        "chooseThickness": "Elegir este grosor",
    },
    "fr": {
        "tools": "Ton trait",
        "toolsHint": "Choisis une couleur et laisse ta main suivre.",
        "undo": "Annuler le dernier trait",
        "color": "Couleur du trait",
        "chooseColor": "Choisir cette couleur",
        "thickness": "Épaisseur du trait",
        "chooseThickness": "Choisir cette épaisseur",
    },
}

for language, additions in translations.items():
    hug_doodle = locale_data[language].get(
        "hugDoodle"
    )

    if not isinstance(hug_doodle, dict):
        fail(
            f"{language.upper()}: hugDoodle "
            "não é um objeto JSON."
        )

    for key in additions:
        if key in hug_doodle:
            fail(
                f"{language.upper()}: a chave "
                f"hugDoodle.{key} já existe."
            )

    hug_doodle.update(additions)


# ============================================================
# 8. AUDITORIA DE PERFORMANCE EM MEMÓRIA
# ============================================================

required_a2 = [
    "type DoodleStroke",
    "doodleColor",
    "doodleWidth",
    "doodleStrokeCount",
    "doodleStrokesRef",
    "doodleCurrentStrokeRef",
    "DOODLE_MAX_STROKES = 120",
    "DOODLE_MAX_POINTS_PER_STROKE = 900",
    "drawDoodleStroke",
    "redrawDoodle",
    "undoDoodle",
    't("hugDoodle.tools")',
    't("hugDoodle.undo")',
]

for marker in required_a2:
    if marker not in component_updated:
        fail(
            "Validação A2 falhou:\n"
            f"{marker}"
        )


move_start = component_updated.find(
    "const handleDoodlePointerMove"
)

move_end = component_updated.find(
    "const stopDoodleDrawing",
    move_start
)

if move_start == -1 or move_end == -1:
    fail(
        "Não consegui auditar pointermove."
    )

move_block = component_updated[
    move_start:move_end
]

for forbidden in [
    "setDoodleStrokeCount",
    "setDoodleColor",
    "setDoodleWidth",
    "setShowDoodle",
    "setSecondsLeft",
    "setPhraseIdx",
    "setCompleted",
]:
    if forbidden in move_block:
        fail(
            "React state encontrado durante pointermove:\n"
            f"{forbidden}"
        )


doodle_start = component_updated.find(
    "const DOODLE_MAX_STROKES"
)

doodle_end = component_updated.find(
    "const formatTime",
    doodle_start
)

doodle_logic = component_updated[
    doodle_start:doodle_end
]

for forbidden in [
    "localStorage",
    "sessionStorage",
    "toDataURL",
    "toBlob",
    "getImageData",
    "putImageData",
    "requestAnimationFrame",
    "setInterval(",
    "new Image(",
]:
    if forbidden in doodle_logic:
        fail(
            "Operação pesada/não desejada no Rabisco:\n"
            f"{forbidden}"
        )


# ============================================================
# 9. GARANTIR FUNCIONALIDADE ORIGINAL
# ============================================================

original_markers = [
    "onAddXp(30)",
    "SOOTHING_PHRASES.length",
    "setSecondsLeft(prev => prev - 1)",
    "setBreatheState(prev =>",
    "sound.loop = true",
    "App.addListener(",
    "visibilitychange",
    "sessionCompleted",
    "selectedSound",
]

for marker in original_markers:
    if marker not in component_updated:
        fail(
            "Funcionalidade original desapareceu:\n"
            f"{marker}"
        )


# ============================================================
# 10. VALIDAR JSONS EM MEMÓRIA
# ============================================================

locale_updated = {}

for language, data in locale_data.items():
    text = (
        json.dumps(
            data,
            ensure_ascii=False,
            indent=2
        )
        + "\n"
    )

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError as error:
        fail(
            f"{language.upper()}: JSON final inválido:\n"
            f"{error}"
        )

    hug_doodle = parsed.get("hugDoodle", {})

    for key in translations[language]:
        if key not in hug_doodle:
            fail(
                f"{language.upper()}: falta "
                f"hugDoodle.{key}"
            )

    locale_updated[language] = text


# ============================================================
# 11. BACKUPS
# ============================================================

shutil.copy2(
    COMPONENT,
    BACKUP_COMPONENT
)

for language, path in LOCALES.items():
    shutil.copy2(
        path,
        Path(
            f"/tmp/{language}.json."
            "before_abraco_premium_a2"
        )
    )


# ============================================================
# 12. ESCREVER
# ============================================================

COMPONENT.write_text(
    component_updated,
    encoding="utf-8"
)

for language, path in LOCALES.items():
    path.write_text(
        locale_updated[language],
        encoding="utf-8"
    )


# ============================================================
# 13. VERIFICAÇÃO PÓS-ESCRITA
# ============================================================

written = COMPONENT.read_text(
    encoding="utf-8"
)

post_checks = [
    "DOODLE_MAX_STROKES = 120",
    "DOODLE_MAX_POINTS_PER_STROKE = 900",
    "doodleStrokesRef",
    "undoDoodle",
    "redrawDoodle",
    "<canvas",
    "touch-none",
]

for marker in post_checks:
    if marker not in written:
        fail(
            "Verificação pós-escrita falhou:\n"
            f"{marker}"
        )

if written.count("<canvas") != 1:
    fail(
        "Esperava exatamente um canvas."
    )

for language, path in LOCALES.items():
    try:
        parsed = json.loads(
            path.read_text(encoding="utf-8")
        )
    except json.JSONDecodeError as error:
        fail(
            f"{language.upper()}: JSON escrito inválido:\n"
            f"{error}"
        )

    for key in translations[language]:
        if key not in parsed["hugDoodle"]:
            fail(
                f"{language.upper()}: chave ausente "
                f"depois da escrita: {key}"
            )


# ============================================================
# 14. RESULTADO
# ============================================================

print()
print("=" * 76)
print("CONFIA — ABRAÇO PREMIUM A2")
print("=" * 76)
print()

print("✓ 4 cores CONFIA")
print("✓ 3 espessuras")
print("✓ Desfazer último traço")
print("✓ Limpar preservado")
print("✓ Traços vetoriais temporários")
print("✓ Máximo 120 traços")
print("✓ Máximo 900 pontos por traço")
print("✓ Micro-movimentos filtrados")
print("✓ Coordenadas normalizadas")
print("✓ Sem setState durante pointermove")
print("✓ Estado React só atualizado ao terminar um traço")
print("✓ Sem ImageData")
print("✓ Sem screenshots do canvas")
print("✓ Sem base64")
print("✓ Sem localStorage")
print("✓ Sem novos timers")
print("✓ Sem requestAnimationFrame permanente")
print("✓ Sem novas dependências")
print("✓ Canvas DPR máximo 2")
print("✓ Timer / respiração / sons preservados")
print("✓ +30 XP preservado")
print("✓ PT / EN / ES / FR")
print()

print("Backup:")
print(f"  {BACKUP_COMPONENT}")

for language in LOCALES:
    print(
        f"  /tmp/{language}.json."
        "before_abraco_premium_a2"
    )

print()
print("PRÓXIMO PASSO:")
print("  npm run build")
print("=" * 76)
