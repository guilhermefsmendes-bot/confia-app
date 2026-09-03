from pathlib import Path
import shutil
import sys
import json

# ============================================================
# CONFIA — ABRAÇO PREMIUM A3
# RABISCO — DESAFIOS + RITUAL FINAL
#
# Adiciona:
# - 12 desafios
# - emocional + imaginativo + divertido
# - desafio estável durante o desenho
# - trocar desafio manualmente
# - ritual final após "Terminei"
# - "Deixar ir"
# - "Outro rabisco"
#
# Performance:
# - preserva motor vetorial A2
# - zero storage
# - zero base64
# - zero ImageData
# - zero novos timers
# - zero requestAnimationFrame
# - zero novas dependências
# - zero análise do desenho
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
    "/tmp/AbracoTimer.tsx.before_abraco_premium_a3"
)


def fail(message: str):
    print()
    print("=" * 78)
    print("ERRO — A3 NÃO APLICADA")
    print("=" * 78)
    print()
    print(message)
    print()
    print("Nenhum ficheiro foi alterado.")
    print("=" * 78)
    sys.exit(1)


# ============================================================
# 1. CARREGAR
# ============================================================

if not COMPONENT.exists():
    fail(f"Não encontrei:\n{COMPONENT}")

for language, path in LOCALES.items():
    if not path.exists():
        fail(
            f"Locale {language.upper()} não encontrado:\n"
            f"{path}"
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
            f"{language.upper()} inválido antes da A3:\n"
            f"{error}"
        )


# ============================================================
# 2. VALIDAR A2
# ============================================================

a2_markers = [
    "type DoodleStroke",
    "const [showDoodle, setShowDoodle] = useState(false);",
    "const [doodleColor, setDoodleColor]",
    "const [doodleWidth, setDoodleWidth]",
    "const [doodleStrokeCount, setDoodleStrokeCount]",
    "doodleStrokesRef",
    "doodleCurrentStrokeRef",
    "DOODLE_MAX_STROKES = 120",
    "DOODLE_MAX_POINTS_PER_STROKE = 900",
    "drawDoodleStroke",
    "redrawDoodle",
    "undoDoodle",
    't("hugDoodle.tools")',
    't("hugDoodle.undo")',
    "Abraço Premium — Rabisco",
]

for marker in a2_markers:
    if marker not in component_original:
        fail(
            "A A2 não parece estar instalada por completo.\n\n"
            f"Falta:\n{marker}\n\n"
            "A3 não será aplicada por cima de uma base diferente."
        )


# Não executar A3 duas vezes.
a3_markers = [
    "DOODLE_PROMPT_KEYS",
    "doodlePromptIndex",
    "doodleFinished",
    "chooseNextDoodlePrompt",
    "finishDoodle",
    "hugDoodle.ritual",
]

existing_a3 = [
    marker
    for marker in a3_markers
    if marker in component_original
]

if existing_a3:
    fail(
        "A A3 já parece estar total ou parcialmente aplicada:\n\n"
        + "\n".join(existing_a3)
    )


# ============================================================
# 3. VALIDAR HUGDOODLE DOS 4 IDIOMAS
# ============================================================

required_locale_keys = [
    "eyebrow",
    "title",
    "description",
    "open",
    "prompt",
    "canvasLabel",
    "clear",
    "close",
    "private",
    "tools",
    "toolsHint",
    "undo",
    "color",
    "chooseColor",
    "thickness",
    "chooseThickness",
]

for language, data in locale_data.items():
    hug_doodle = data.get("hugDoodle")

    if not isinstance(hug_doodle, dict):
        fail(
            f"{language.upper()}: hugDoodle não é "
            "um objeto válido."
        )

    missing = [
        key
        for key in required_locale_keys
        if key not in hug_doodle
    ]

    if missing:
        fail(
            f"{language.upper()}: faltam chaves da A1/A2:\n"
            + "\n".join(missing)
        )


# ============================================================
# 4. ADICIONAR LISTA DE DESAFIOS
# ============================================================

component_anchor = (
    "export const AbracoTimer: React.FC<AbracoTimerProps>"
)

component_position = component_original.find(
    component_anchor
)

if component_position == -1:
    fail(
        "Não encontrei a declaração AbracoTimer."
    )


prompt_constants = '''const DOODLE_PROMPT_KEYS = [
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

'''

component_updated = (
    component_original[:component_position]
    + prompt_constants
    + component_original[component_position:]
)


# ============================================================
# 5. ADICIONAR ESTADOS A3
# ============================================================

state_anchor = (
    'const [doodleStrokeCount, setDoodleStrokeCount] = useState(0);'
)

if component_updated.count(state_anchor) != 1:
    fail(
        "Não encontrei exatamente doodleStrokeCount."
    )

state_replacement = '''const [doodleStrokeCount, setDoodleStrokeCount] = useState(0);
const [doodlePromptIndex, setDoodlePromptIndex] = useState(
  () => Math.floor(Math.random() * DOODLE_PROMPT_KEYS.length)
);
const [doodleFinished, setDoodleFinished] = useState(false);'''

component_updated = component_updated.replace(
    state_anchor,
    state_replacement,
    1,
)


# ============================================================
# 6. ISOLAR FUNÇÕES CLEAR/CLOSE
# ============================================================

clear_start = component_updated.find(
    "const clearDoodle = () => {"
)

format_start = component_updated.find(
    "const formatTime",
    clear_start
)

if clear_start == -1 or format_start == -1:
    fail(
        "Não consegui localizar clearDoodle/closeDoodle."
    )

clear_close_region = component_updated[
    clear_start:format_start
]

for marker in [
    "const clearDoodle",
    "const closeDoodle",
    "setDoodleStrokeCount(0)",
    "setShowDoodle(false)",
]:
    if marker not in clear_close_region:
        fail(
            "Bloco final do motor A2 inesperado:\n"
            f"{marker}"
        )


# ============================================================
# 7. SUBSTITUIR CLEAR/CLOSE POR CICLO A3
# ============================================================

new_final_engine = r'''const clearDoodle = () => {
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

'''

component_updated = (
    component_updated[:clear_start]
    + new_final_engine
    + component_updated[format_start:]
)


# ============================================================
# 8. ISOLAR UI DO RABISCO
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
        "Não consegui isolar a UI do Rabisco."
    )

old_ui = component_updated[
    ui_start:ui_end
]

for marker in [
    "!showDoodle",
    "undoDoodle",
    "doodleColor",
    "doodleWidth",
    "<canvas",
    "clearDoodle",
    "closeDoodle",
]:
    if marker not in old_ui:
        fail(
            "A interface A2 não corresponde ao esperado:\n"
            f"{marker}"
        )


# ============================================================
# 9. NOVA UI A3
# ============================================================

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

'''

component_updated = (
    component_updated[:ui_start]
    + new_ui
    + component_updated[ui_end:]
)


# ============================================================
# 10. TRADUÇÕES A3
# ============================================================

translations = {
    "pt": {
        "challenge": "O teu desafio",
        "newChallenge": "Outro desafio",
        "ritualEyebrow": "Já chega por agora",
        "ritual": "Fica aqui. Não precisas de explicar.",
        "ritualDescription": (
            "Às vezes, tirar algo da cabeça e pô-lo "
            "no papel já é suficiente por agora."
        ),
        "letGo": "Deixar ir",
        "another": "Outro rabisco",
        "prompts": {
            "landscape": "Desenha o teu dia como uma paisagem.",
            "shape": "Se este momento tivesse uma forma, qual seria?",
            "place": "Desenha um lugar onde gostarias de estar agora.",
            "lines": "Transforma o que tens na cabeça em linhas.",
            "smile": "Desenha algo que te faria sorrir.",
            "weather": "Se o teu dia fosse tempo, como estaria o céu?",
            "safeCorner": "Inventa um pequeno lugar onde te sentirias bem.",
            "animal": "Desenha um animal com uma personalidade impossível.",
            "goat": "Desenha uma cabra no topo de uma montanha.",
            "badCat": "Desenha o pior gato que conseguires.",
            "cloudHouse": "Desenha uma casa construída em cima de uma nuvem.",
            "tinyWorld": "Inventa um mundo inteiro que caiba dentro de um círculo."
        }
    },

    "en": {
        "challenge": "Your challenge",
        "newChallenge": "Another challenge",
        "ritualEyebrow": "That's enough for now",
        "ritual": "Let it stay here. You don't need to explain it.",
        "ritualDescription": (
            "Sometimes getting something out of your head "
            "and onto the page is enough for now."
        ),
        "letGo": "Let it go",
        "another": "Another doodle",
        "prompts": {
            "landscape": "Draw your day as a landscape.",
            "shape": "If this moment had a shape, what would it be?",
            "place": "Draw a place where you would like to be right now.",
            "lines": "Turn what's in your head into lines.",
            "smile": "Draw something that would make you smile.",
            "weather": "If your day were weather, what would the sky look like?",
            "safeCorner": "Invent a small place where you would feel good.",
            "animal": "Draw an animal with an impossible personality.",
            "goat": "Draw a goat on top of a mountain.",
            "badCat": "Draw the worst cat you possibly can.",
            "cloudHouse": "Draw a house built on top of a cloud.",
            "tinyWorld": "Invent an entire world that fits inside a circle."
        }
    },

    "es": {
        "challenge": "Tu desafío",
        "newChallenge": "Otro desafío",
        "ritualEyebrow": "Por ahora es suficiente",
        "ritual": "Déjalo aquí. No necesitas explicarlo.",
        "ritualDescription": (
            "A veces, sacar algo de la cabeza y ponerlo "
            "sobre el papel ya es suficiente por ahora."
        ),
        "letGo": "Dejar ir",
        "another": "Otro dibujo",
        "prompts": {
            "landscape": "Dibuja tu día como un paisaje.",
            "shape": "Si este momento tuviera una forma, ¿cuál sería?",
            "place": "Dibuja un lugar donde te gustaría estar ahora.",
            "lines": "Transforma lo que tienes en la cabeza en líneas.",
            "smile": "Dibuja algo que te haría sonreír.",
            "weather": "Si tu día fuera el tiempo, ¿cómo estaría el cielo?",
            "safeCorner": "Inventa un pequeño lugar donde te sentirías bien.",
            "animal": "Dibuja un animal con una personalidad imposible.",
            "goat": "Dibuja una cabra en la cima de una montaña.",
            "badCat": "Dibuja el peor gato que puedas.",
            "cloudHouse": "Dibuja una casa construida encima de una nube.",
            "tinyWorld": "Inventa un mundo entero que quepa dentro de un círculo."
        }
    },

    "fr": {
        "challenge": "Ton défi",
        "newChallenge": "Un autre défi",
        "ritualEyebrow": "C'est suffisant pour maintenant",
        "ritual": "Laisse-le ici. Tu n'as pas besoin de l'expliquer.",
        "ritualDescription": (
            "Parfois, sortir quelque chose de sa tête et "
            "le poser sur le papier suffit pour le moment."
        ),
        "letGo": "Laisser partir",
        "another": "Un autre dessin",
        "prompts": {
            "landscape": "Dessine ta journée comme un paysage.",
            "shape": "Si ce moment avait une forme, laquelle serait-ce ?",
            "place": "Dessine un endroit où tu aimerais être maintenant.",
            "lines": "Transforme ce que tu as en tête en lignes.",
            "smile": "Dessine quelque chose qui te ferait sourire.",
            "weather": "Si ta journée était la météo, à quoi ressemblerait le ciel ?",
            "safeCorner": "Invente un petit endroit où tu te sentirais bien.",
            "animal": "Dessine un animal avec une personnalité impossible.",
            "goat": "Dessine une chèvre au sommet d'une montagne.",
            "badCat": "Dessine le pire chat que tu puisses faire.",
            "cloudHouse": "Dessine une maison construite sur un nuage.",
            "tinyWorld": "Invente un monde entier qui tient dans un cercle."
        }
    },
}


for language, additions in translations.items():
    hug_doodle = locale_data[language]["hugDoodle"]

    for key, value in additions.items():
        if key in hug_doodle:
            fail(
                f"{language.upper()}: "
                f"hugDoodle.{key} já existe."
            )

        hug_doodle[key] = value


# ============================================================
# 11. VALIDAR A3 EM MEMÓRIA
# ============================================================

required_a3 = [
    "DOODLE_PROMPT_KEYS",
    "doodlePromptIndex",
    "doodleFinished",
    "chooseNextDoodlePrompt",
    "resetDoodleExperience",
    "openDoodle",
    "finishDoodle",
    "closeDoodle",
    't("hugDoodle.challenge")',
    't("hugDoodle.ritual")',
    't("hugDoodle.letGo")',
    't("hugDoodle.another")',
]

for marker in required_a3:
    if marker not in component_updated:
        fail(
            "Validação A3 falhou:\n"
            f"{marker}"
        )


# ============================================================
# 12. GARANTIR QUE A2 CONTINUA INTACTA
# ============================================================

preserved_a2 = [
    "DOODLE_MAX_STROKES = 120",
    "DOODLE_MAX_POINTS_PER_STROKE = 900",
    "doodleStrokesRef",
    "doodleCurrentStrokeRef",
    "drawDoodleStroke",
    "redrawDoodle",
    "undoDoodle",
    "distanceSquared < 0.000004",
    "setDoodleStrokeCount(strokes.length)",
    "getDoodlePixelRatio",
]

for marker in preserved_a2:
    if marker not in component_updated:
        fail(
            "A A3 removeu uma proteção da A2:\n"
            f"{marker}"
        )


# ============================================================
# 13. AUDITORIA POINTERMOVE
# ============================================================

move_start = component_updated.find(
    "const handleDoodlePointerMove"
)

move_end = component_updated.find(
    "const stopDoodleDrawing",
    move_start
)

if move_start == -1 or move_end == -1:
    fail(
        "Não consegui isolar pointermove."
    )

move_block = component_updated[
    move_start:move_end
]

state_setters = [
    "setShowDoodle",
    "setDoodleColor",
    "setDoodleWidth",
    "setDoodleStrokeCount",
    "setDoodlePromptIndex",
    "setDoodleFinished",
    "setSecondsLeft",
    "setPhraseIdx",
    "setCompleted",
]

for setter in state_setters:
    if setter in move_block:
        fail(
            "React state encontrado em pointermove:\n"
            f"{setter}"
        )


# ============================================================
# 14. AUDITORIA DE PESO
# ============================================================

doodle_start = component_updated.find(
    "const DOODLE_MAX_STROKES"
)

doodle_end = component_updated.find(
    "const formatTime",
    doodle_start
)

if doodle_start == -1 or doodle_end == -1:
    fail(
        "Não consegui isolar lógica do Rabisco."
    )

doodle_logic = component_updated[
    doodle_start:doodle_end
]

for forbidden in [
    "localStorage",
    "sessionStorage",
    "getImageData",
    "putImageData",
    "toDataURL",
    "toBlob",
    "requestAnimationFrame",
    "setInterval(",
    "new Image(",
    "fetch(",
]:
    if forbidden in doodle_logic:
        fail(
            "Operação indesejada encontrada no Rabisco:\n"
            f"{forbidden}"
        )


# ============================================================
# 15. PRESERVAR ABRAÇO ORIGINAL
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
# 16. VALIDAR OS 12 PROMPTS
# ============================================================

prompt_keys = [
    "landscape",
    "shape",
    "place",
    "lines",
    "smile",
    "weather",
    "safeCorner",
    "animal",
    "goat",
    "badCat",
    "cloudHouse",
    "tinyWorld",
]

for language, data in locale_data.items():
    hug_doodle = data["hugDoodle"]

    prompts = hug_doodle.get("prompts")

    if not isinstance(prompts, dict):
        fail(
            f"{language.upper()}: prompts inválidos."
        )

    if set(prompts.keys()) != set(prompt_keys):
        fail(
            f"{language.upper()}: conjunto de prompts "
            "não corresponde aos 12 esperados."
        )

    for key in prompt_keys:
        value = prompts.get(key)

        if not isinstance(value, str) or not value.strip():
            fail(
                f"{language.upper()}: prompt vazio:\n"
                f"{key}"
            )


# ============================================================
# 17. PREPARAR JSONS
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

    for key in [
        "challenge",
        "newChallenge",
        "ritualEyebrow",
        "ritual",
        "ritualDescription",
        "letGo",
        "another",
        "prompts",
    ]:
        if key not in parsed["hugDoodle"]:
            fail(
                f"{language.upper()}: falta "
                f"hugDoodle.{key}"
            )

    locale_updated[language] = text


# ============================================================
# 18. BACKUPS
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
            "before_abraco_premium_a3"
        )
    )


# ============================================================
# 19. ESCREVER
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
# 20. VERIFICAÇÃO FINAL
# ============================================================

written = COMPONENT.read_text(
    encoding="utf-8"
)

post_checks = [
    "DOODLE_PROMPT_KEYS",
    "doodlePromptIndex",
    "doodleFinished",
    "openDoodle",
    "finishDoodle",
    "resetDoodleExperience",
    "chooseNextDoodlePrompt",
    "DOODLE_MAX_STROKES = 120",
    "DOODLE_MAX_POINTS_PER_STROKE = 900",
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

    prompts = parsed["hugDoodle"]["prompts"]

    if len(prompts) != 12:
        fail(
            f"{language.upper()}: esperava 12 prompts, "
            f"encontrei {len(prompts)}."
        )


# ============================================================
# 21. RESULTADO
# ============================================================

print()
print("=" * 78)
print("CONFIA — ABRAÇO PREMIUM A3")
print("=" * 78)
print()

print("✓ 12 desafios de desenho")
print("✓ Desafios emocionais")
print("✓ Desafios imaginativos")
print("✓ Desafios divertidos")
print("✓ Desafio estável durante cada rabisco")
print("✓ Trocar desafio manualmente")
print("✓ Novo desafio limpa o desenho anterior")
print("✓ Terminei exige pelo menos um traço")
print("✓ Ritual final premium")
print("✓ Deixar ir")
print("✓ Outro rabisco")
print("✓ Desenho eliminado ao fechar")
print("✓ Nenhum desenho guardado")
print("✓ Nenhuma análise do desenho")
print("✓ Nenhum XP adicional")
print("✓ Motor vetorial A2 preservado")
print("✓ 4 cores preservadas")
print("✓ 3 espessuras preservadas")
print("✓ Desfazer preservado")
print("✓ Máximo 120 traços preservado")
print("✓ Máximo 900 pontos por traço preservado")
print("✓ Sem setState durante pointermove")
print("✓ Sem ImageData")
print("✓ Sem base64")
print("✓ Sem localStorage")
print("✓ Sem novos timers")
print("✓ Sem requestAnimationFrame")
print("✓ Sem novas dependências")
print("✓ Canvas DPR máximo 2 preservado")
print("✓ Timer / respiração / sons preservados")
print("✓ +30 XP preservado")
print("✓ PT / EN / ES / FR")
print()

print("Backup:")
print(f"  {BACKUP_COMPONENT}")

for language in LOCALES:
    print(
        f"  /tmp/{language}.json."
        "before_abraco_premium_a3"
    )

print()
print("PRÓXIMO PASSO:")
print("  npm run build")
print("=" * 78)
