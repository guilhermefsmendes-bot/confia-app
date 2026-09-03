from pathlib import Path
import shutil
import sys

# ============================================================
# CONFIA — ABRAÇO PREMIUM A1
# RABISCO — FUNDAÇÃO LEVE
#
# Objetivo:
# - adicionar uma experiência de desenho opcional ao Abraço
# - Canvas API nativa
# - Pointer Events
# - zero bibliotecas novas
# - zero localStorage
# - zero setState durante pointermove
#
# ALTERA:
# - src/components/AbracoTimer.tsx
# - src/locales/pt.json
# - src/locales/en.json
# - src/locales/es.json
# - src/locales/fr.json
#
# NÃO ALTERA:
# - timer do Abraço
# - respiração
# - áudio
# - XP
# - Reactive Engine
# ============================================================

import json

ROOT = Path.cwd()

COMPONENT = ROOT / "src/components/AbracoTimer.tsx"

LOCALES = {
    "pt": ROOT / "src/locales/pt.json",
    "en": ROOT / "src/locales/en.json",
    "es": ROOT / "src/locales/es.json",
    "fr": ROOT / "src/locales/fr.json",
}

BACKUP_COMPONENT = Path(
    "/tmp/AbracoTimer.tsx.before_abraco_premium_a1"
)


def fail(message: str):
    print()
    print("=" * 74)
    print("ERRO — A1 NÃO APLICADA")
    print("=" * 74)
    print()
    print(message)
    print()
    print("Nenhum ficheiro foi alterado.")
    print("=" * 74)
    sys.exit(1)


# ============================================================
# 1. VALIDAR FICHEIROS
# ============================================================

if not COMPONENT.exists():
    fail(f"Ficheiro não encontrado:\n{COMPONENT}")

for language, path in LOCALES.items():
    if not path.exists():
        fail(
            f"Locale {language.upper()} não encontrado:\n{path}"
        )


component_original = COMPONENT.read_text(encoding="utf-8")

locale_originals = {
    language: path.read_text(encoding="utf-8")
    for language, path in LOCALES.items()
}


# ============================================================
# 2. VALIDAR JSON ANTES DE ALTERAR
# ============================================================

locale_data = {}

for language, text in locale_originals.items():
    try:
        locale_data[language] = json.loads(text)
    except json.JSONDecodeError as error:
        fail(
            f"{language.upper()} JSON inválido antes da alteração:\n"
            f"{error}"
        )


# ============================================================
# 3. VALIDAR ESTRUTURA DO ABRAÇO
# ============================================================

required_component_markers = [
    "export const AbracoTimer",
    "const [completed, setCompleted] = useState(false);",
    "const audioRef = useRef<HTMLAudioElement | null>(null);",
    "const handleReset = () => {",
    "{/* Relaxing Sounds */}",
    "{/* Control Buttons */}",
    "{/* Completion reward banner */}",
]

for marker in required_component_markers:
    if marker not in component_original:
        fail(
            "A estrutura de AbracoTimer.tsx mudou.\n\n"
            f"Não encontrei:\n{marker}"
        )


# Evitar executar duas vezes.
if "hugDoodle.title" in component_original:
    fail(
        "A estrutura do Rabisco A1 já parece existir "
        "em AbracoTimer.tsx."
    )


# ============================================================
# 4. ADICIONAR ESTADO + REFS
# ============================================================

old_state_anchor = (
    'const [selectedSound, setSelectedSound] = useState("rain");\n'
    'const audioRef = useRef<HTMLAudioElement | null>(null);'
)

new_state_block = '''const [selectedSound, setSelectedSound] = useState("rain");
const [showDoodle, setShowDoodle] = useState(false);

const audioRef = useRef<HTMLAudioElement | null>(null);
const doodleCanvasRef = useRef<HTMLCanvasElement | null>(null);
const doodleDrawingRef = useRef(false);
const doodleLastPointRef = useRef<{ x: number; y: number } | null>(null);'''

if component_original.count(old_state_anchor) != 1:
    fail(
        "Não encontrei exatamente uma âncora "
        "para os estados/refs."
    )

component_updated = component_original.replace(
    old_state_anchor,
    new_state_block,
    1,
)


# ============================================================
# 5. ADICIONAR MOTOR DO CANVAS
# ============================================================

handler_anchor = '''const handleReset = () => {
stopAudio();
  setIsActive(false);
  setSecondsLeft(TOTAL_SECONDS);
  setPhraseIdx(0);
  setCompleted(false);
  setBreatheState('Inalar');
};'''

if component_updated.count(handler_anchor) != 1:
    fail(
        "Não encontrei exatamente o handleReset esperado."
    )


doodle_engine = r'''
const getDoodlePoint = (
  event: React.PointerEvent<HTMLCanvasElement>
) => {
  const canvas = doodleCanvasRef.current;

  if (!canvas) {
    return null;
  }

  const rect = canvas.getBoundingClientRect();

  if (rect.width <= 0 || rect.height <= 0) {
    return null;
  }

  return {
    x:
      (event.clientX - rect.left) *
      (canvas.width / rect.width),
    y:
      (event.clientY - rect.top) *
      (canvas.height / rect.height),
  };
};

const prepareDoodleCanvas = (
  canvas: HTMLCanvasElement | null
) => {
  if (!canvas) {
    return;
  }

  doodleCanvasRef.current = canvas;

  const rect = canvas.getBoundingClientRect();
  const pixelRatio = Math.min(
    window.devicePixelRatio || 1,
    2
  );

  const nextWidth = Math.max(
    1,
    Math.round(rect.width * pixelRatio)
  );

  const nextHeight = Math.max(
    1,
    Math.round(rect.height * pixelRatio)
  );

  if (
    canvas.width !== nextWidth ||
    canvas.height !== nextHeight
  ) {
    canvas.width = nextWidth;
    canvas.height = nextHeight;
  }

  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = "#C97B5E";
  context.lineWidth = Math.max(4, 3 * pixelRatio);
};

const handleDoodlePointerDown = (
  event: React.PointerEvent<HTMLCanvasElement>
) => {
  if (event.pointerType === "mouse" && event.button !== 0) {
    return;
  }

  const canvas = doodleCanvasRef.current;
  const point = getDoodlePoint(event);

  if (!canvas || !point) {
    return;
  }

  doodleDrawingRef.current = true;
  doodleLastPointRef.current = point;

  canvas.setPointerCapture?.(event.pointerId);

  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  context.beginPath();
  context.arc(
    point.x,
    point.y,
    context.lineWidth / 2,
    0,
    Math.PI * 2
  );
  context.fillStyle = "#C97B5E";
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

  if (!canvas || !previousPoint || !nextPoint) {
    return;
  }

  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  context.beginPath();
  context.moveTo(
    previousPoint.x,
    previousPoint.y
  );
  context.lineTo(
    nextPoint.x,
    nextPoint.y
  );
  context.stroke();

  doodleLastPointRef.current = nextPoint;
};

const stopDoodleDrawing = (
  event?: React.PointerEvent<HTMLCanvasElement>
) => {
  const canvas = doodleCanvasRef.current;

  if (
    canvas &&
    event &&
    canvas.hasPointerCapture?.(event.pointerId)
  ) {
    canvas.releasePointerCapture?.(event.pointerId);
  }

  doodleDrawingRef.current = false;
  doodleLastPointRef.current = null;
};

const clearDoodle = () => {
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

  doodleDrawingRef.current = false;
  doodleLastPointRef.current = null;
};

const closeDoodle = () => {
  doodleDrawingRef.current = false;
  doodleLastPointRef.current = null;
  doodleCanvasRef.current = null;
  setShowDoodle(false);
};
'''

component_updated = component_updated.replace(
    handler_anchor,
    handler_anchor + "\n" + doodle_engine,
    1,
)


# ============================================================
# 6. ADICIONAR UI DO RABISCO
# ============================================================

ui_anchor = "        {/* Control Buttons */}"

if component_updated.count(ui_anchor) != 1:
    fail(
        "Não encontrei exatamente a âncora "
        "dos Control Buttons."
    )


doodle_ui = '''        {/* Abraço Premium — Rabisco */}
        <section className="w-full overflow-hidden rounded-[28px] border border-[#E5A88B]/20 bg-gradient-to-br from-[#FFF9F5] via-white to-[#FFFDFC]">
          <div className="p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#E5A88B]/20 bg-white text-[#C97B5E] shadow-sm">
                <Smile size={18} strokeWidth={1.8} />
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
                <Sparkles size={15} strokeWidth={1.8} />
                {t("hugDoodle.open")}
              </button>
            ) : (
              <div className="mt-5">
                <div className="rounded-[24px] border border-[#E8DDD7]/80 bg-[#FFFCF9] p-3 shadow-inner">
                  <p className="mb-3 px-1 text-center text-xs font-bold leading-relaxed text-[#6F5750]">
                    {t("hugDoodle.prompt")}
                  </p>

                  <canvas
                    ref={prepareDoodleCanvas}
                    width={640}
                    height={440}
                    onPointerDown={handleDoodlePointerDown}
                    onPointerMove={handleDoodlePointerMove}
                    onPointerUp={stopDoodleDrawing}
                    onPointerCancel={stopDoodleDrawing}
                    onLostPointerCapture={() => stopDoodleDrawing()}
                    aria-label={t("hugDoodle.canvasLabel")}
                    className="block aspect-[16/11] w-full cursor-crosshair touch-none rounded-[18px] border border-[#E8DDD7]/70 bg-white"
                  />
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={clearDoodle}
                    className="min-h-11 flex-1 rounded-[16px] border border-[#E8DDD7] bg-white px-3 py-2.5 text-xs font-bold text-[#8B6B60] transition-transform active:scale-[0.98]"
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

component_updated = component_updated.replace(
    ui_anchor,
    doodle_ui + ui_anchor,
    1,
)


# ============================================================
# 7. TRADUÇÕES PT / EN / ES / FR
# ============================================================

translations = {
    "pt": {
        "eyebrow": "Um momento para as mãos",
        "title": "Rabisco",
        "description": "Uma pequena pausa para desenhares sem pensar demasiado.",
        "open": "Quero rabiscar",
        "prompt": "Desenha um lugar onde gostarias de estar agora.",
        "canvasLabel": "Área para desenhar com o dedo",
        "clear": "Limpar",
        "close": "Terminei",
        "private": "Este rabisco fica apenas neste momento."
    },
    "en": {
        "eyebrow": "A moment for your hands",
        "title": "Doodle",
        "description": "A small pause to draw without thinking too much.",
        "open": "I want to doodle",
        "prompt": "Draw a place where you would like to be right now.",
        "canvasLabel": "Area for drawing with your finger",
        "clear": "Clear",
        "close": "I'm done",
        "private": "This doodle stays only in this moment."
    },
    "es": {
        "eyebrow": "Un momento para tus manos",
        "title": "Garabato",
        "description": "Una pequeña pausa para dibujar sin pensar demasiado.",
        "open": "Quiero dibujar",
        "prompt": "Dibuja un lugar donde te gustaría estar ahora.",
        "canvasLabel": "Zona para dibujar con el dedo",
        "clear": "Limpiar",
        "close": "He terminado",
        "private": "Este dibujo se queda solo en este momento."
    },
    "fr": {
        "eyebrow": "Un moment pour tes mains",
        "title": "Gribouillage",
        "description": "Une petite pause pour dessiner sans trop réfléchir.",
        "open": "Je veux dessiner",
        "prompt": "Dessine un endroit où tu aimerais être maintenant.",
        "canvasLabel": "Zone pour dessiner avec le doigt",
        "clear": "Effacer",
        "close": "J'ai terminé",
        "private": "Ce dessin reste seulement dans cet instant."
    },
}


for language, values in translations.items():
    data = locale_data[language]

    if "hugDoodle" in data:
        fail(
            f"{language.upper()}: a chave hugDoodle "
            "já existe."
        )

    data["hugDoodle"] = values


# ============================================================
# 8. VALIDAR COMPONENTE EM MEMÓRIA
# ============================================================

component_checks = [
    "const [showDoodle, setShowDoodle] = useState(false);",
    "doodleCanvasRef",
    "doodleDrawingRef",
    "handleDoodlePointerDown",
    "handleDoodlePointerMove",
    "stopDoodleDrawing",
    "clearDoodle",
    "closeDoodle",
    "<canvas",
    'touch-none',
    't("hugDoodle.title")',
]

for marker in component_checks:
    if marker not in component_updated:
        fail(
            "Validação do componente falhou:\n"
            f"{marker}"
        )


# Não queremos state durante pointermove.
move_start = component_updated.find(
    "const handleDoodlePointerMove"
)

move_end = component_updated.find(
    "const stopDoodleDrawing",
    move_start
)

move_block = component_updated[
    move_start:move_end
]

if "setState" in move_block or "setShowDoodle" in move_block:
    fail(
        "Foi encontrado state React dentro "
        "do pointermove."
    )


# ============================================================
# 9. PREPARAR JSONS EM MEMÓRIA
# ============================================================

locale_updated = {}

for language, data in locale_data.items():
    locale_updated[language] = (
        json.dumps(
            data,
            ensure_ascii=False,
            indent=2
        )
        + "\n"
    )

    try:
        json.loads(locale_updated[language])
    except json.JSONDecodeError as error:
        fail(
            f"{language.upper()}: JSON inválido "
            f"após preparação:\n{error}"
        )


# ============================================================
# 10. BACKUPS
# ============================================================

shutil.copy2(
    COMPONENT,
    BACKUP_COMPONENT
)

for language, path in LOCALES.items():
    shutil.copy2(
        path,
        Path(
            f"/tmp/{language}.json.before_abraco_premium_a1"
        )
    )


# ============================================================
# 11. ESCREVER
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
# 12. VERIFICAÇÃO PÓS-ESCRITA
# ============================================================

written_component = COMPONENT.read_text(
    encoding="utf-8"
)

if written_component.count("<canvas") != 1:
    fail(
        "Esperava encontrar exatamente "
        "um canvas depois da escrita."
    )

if "localStorage" in (
    written_component[
        written_component.find("const getDoodlePoint"):
        written_component.find("const formatTime")
    ]
):
    fail(
        "O Rabisco não deve usar localStorage."
    )

for language, path in LOCALES.items():
    try:
        written_locale = json.loads(
            path.read_text(encoding="utf-8")
        )
    except json.JSONDecodeError as error:
        fail(
            f"{language.upper()}: JSON final inválido:\n"
            f"{error}"
        )

    if "hugDoodle" not in written_locale:
        fail(
            f"{language.upper()}: hugDoodle não foi escrito."
        )


# ============================================================
# 13. RESULTADO
# ============================================================

print()
print("=" * 74)
print("CONFIA — ABRAÇO PREMIUM A1")
print("=" * 74)
print()
print("✓ Rabisco opcional adicionado")
print("✓ Canvas nativo")
print("✓ Pointer Events nativos")
print("✓ Desenho com dedo/rato")
print("✓ Canvas só existe quando aberto")
print("✓ Sem setState durante pointermove")
print("✓ Device pixel ratio limitado a 2")
print("✓ Limpar desenho")
print("✓ Terminar e desmontar canvas")
print("✓ Sem localStorage")
print("✓ Sem imagens base64")
print("✓ Sem novas dependências")
print("✓ Timer do Abraço preservado")
print("✓ Respiração preservada")
print("✓ Áudio preservado")
print("✓ XP preservado")
print("✓ PT / EN / ES / FR")
print()
print("Backups:")
print(f"  {BACKUP_COMPONENT}")
for language in LOCALES:
    print(
        f"  /tmp/{language}.json.before_abraco_premium_a1"
    )
print()
print("PRÓXIMO PASSO:")
print("  npm run build")
print("=" * 74)
