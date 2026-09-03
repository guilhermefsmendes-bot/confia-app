from pathlib import Path
import shutil
import sys
import json

# ============================================================
# CONFIA — ABRAÇO PREMIUM A1 V2
# RABISCO — FUNDAÇÃO LEVE
#
# Canvas nativo + Pointer Events.
#
# Princípios:
# - zero bibliotecas novas
# - zero localStorage
# - zero imagens/base64
# - zero setState durante pointermove
# - canvas montado apenas quando utilizado
# - devicePixelRatio máximo 2
#
# ALTERA:
# - src/components/AbracoTimer.tsx
# - src/locales/pt.json
# - src/locales/en.json
# - src/locales/es.json
# - src/locales/fr.json
#
# PRESERVA:
# - timer
# - respiração
# - sons
# - XP
# - conclusão do Abraço
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
    "/tmp/AbracoTimer.tsx.before_abraco_premium_a1_v2"
)


def fail(message: str):
    print()
    print("=" * 74)
    print("ERRO — A1 V2 NÃO APLICADA")
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
    fail(
        f"Ficheiro não encontrado:\n{COMPONENT}"
    )

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


# ============================================================
# 2. VALIDAR JSON ORIGINAL
# ============================================================

locale_data = {}

for language, text in locale_originals.items():
    try:
        locale_data[language] = json.loads(text)
    except json.JSONDecodeError as error:
        fail(
            f"{language.upper()} já está inválido antes "
            f"da alteração:\n{error}"
        )


# ============================================================
# 3. VALIDAR ABRAÇO ATUAL
# ============================================================

required_markers = [
    "export const AbracoTimer",
    "const [completed, setCompleted] = useState(false);",
    'const [selectedSound, setSelectedSound] = useState("rain");',
    "const audioRef = useRef<HTMLAudioElement | null>(null);",
    "const handleReset = () => {",
    "SOOTHING_PHRASES",
    "onAddXp(30)",
    "soundRain",
    "soundForest",
    "soundOcean",
    "soundWhiteNoise",
    "Control Buttons",
    "Completion reward banner",
]

for marker in required_markers:
    if marker not in component_original:
        fail(
            "A estrutura atual do Abraço não corresponde "
            "à estrutura auditada.\n\n"
            f"Falta:\n{marker}"
        )


# ============================================================
# 4. GARANTIR QUE A1 NÃO FOI PARCIALMENTE APLICADA
# ============================================================

a1_markers = [
    "showDoodle",
    "doodleCanvasRef",
    "handleDoodlePointerDown",
    "hugDoodle.title",
]

existing_a1 = [
    marker
    for marker in a1_markers
    if marker in component_original
]

if existing_a1:
    fail(
        "Foram encontrados elementos do Rabisco no componente:\n\n"
        + "\n".join(existing_a1)
        + "\n\nNão vou aplicar a A1 por cima de uma "
          "alteração parcial."
    )


for language, data in locale_data.items():
    if "hugDoodle" in data:
        fail(
            f"{language.upper()}: a chave hugDoodle "
            "já existe."
        )


# ============================================================
# 5. ADICIONAR ESTADO + REFS
# ============================================================

state_line = (
    'const [selectedSound, setSelectedSound] = useState("rain");'
)

audio_line = (
    "const audioRef = useRef<HTMLAudioElement | null>(null);"
)

if component_original.count(state_line) != 1:
    fail(
        "Esperava exatamente uma linha selectedSound."
    )

if component_original.count(audio_line) != 1:
    fail(
        "Esperava exatamente uma linha audioRef."
    )


component_updated = component_original.replace(
    state_line,
    state_line
    + '\nconst [showDoodle, setShowDoodle] = useState(false);',
    1,
)


component_updated = component_updated.replace(
    audio_line,
    '''const audioRef = useRef<HTMLAudioElement | null>(null);
const doodleCanvasRef = useRef<HTMLCanvasElement | null>(null);
const doodleDrawingRef = useRef(false);
const doodleLastPointRef = useRef<{ x: number; y: number } | null>(null);''',
    1,
)


# ============================================================
# 6. LOCALIZAR O FIM DO HANDLERESET
# ============================================================

reset_start = component_updated.find(
    "const handleReset = () => {"
)

if reset_start == -1:
    fail(
        "Não encontrei handleReset."
    )


format_time_start = component_updated.find(
    "const formatTime",
    reset_start
)

if format_time_start == -1:
    fail(
        "Não encontrei formatTime depois de handleReset."
    )


reset_region = component_updated[
    reset_start:format_time_start
]

required_reset_markers = [
    "stopAudio();",
    "setIsActive(false);",
    "setSecondsLeft(TOTAL_SECONDS);",
    "setPhraseIdx(0);",
    "setCompleted(false);",
    "setBreatheState('Inalar');",
]

for marker in required_reset_markers:
    if marker not in reset_region:
        fail(
            "handleReset não contém a estrutura esperada:\n"
            f"{marker}"
        )


# ============================================================
# 7. MOTOR LEVE DO CANVAS
# ============================================================

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
    doodleCanvasRef.current = null;
    return;
  }

  doodleCanvasRef.current = canvas;

  const rect = canvas.getBoundingClientRect();

  if (rect.width <= 0 || rect.height <= 0) {
    return;
  }

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
  context.fillStyle = "#C97B5E";
  context.lineWidth = Math.max(
    4,
    3 * pixelRatio
  );
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

  const pixelRatio = Math.min(
    window.devicePixelRatio || 1,
    2
  );

  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = "#C97B5E";
  context.fillStyle = "#C97B5E";
  context.lineWidth = Math.max(
    4,
    3 * pixelRatio
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

  if (
    typeof canvas.setPointerCapture === "function"
  ) {
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      // O desenho continua mesmo sem pointer capture.
    }
  }

  const context = getDoodleContext();

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
  context.fill();
};

const handleDoodlePointerMove = (
  event: React.PointerEvent<HTMLCanvasElement>
) => {
  if (!doodleDrawingRef.current) {
    return;
  }

  const previousPoint =
    doodleLastPointRef.current;

  const nextPoint =
    getDoodlePoint(event);

  const context =
    getDoodleContext();

  if (
    !previousPoint ||
    !nextPoint ||
    !context
  ) {
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

  doodleLastPointRef.current =
    nextPoint;
};

const stopDoodleDrawing = (
  event?: React.PointerEvent<HTMLCanvasElement>
) => {
  const canvas =
    doodleCanvasRef.current;

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

  doodleDrawingRef.current = false;
  doodleLastPointRef.current = null;
};

const clearDoodle = () => {
  const canvas =
    doodleCanvasRef.current;

  if (!canvas) {
    return;
  }

  const context =
    canvas.getContext("2d");

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
  setShowDoodle(false);
};

'''


component_updated = (
    component_updated[:format_time_start]
    + doodle_engine
    + component_updated[format_time_start:]
)


# ============================================================
# 8. LOCALIZAR CONTROL BUTTONS SEM DEPENDER DE INDENTAÇÃO
# ============================================================

lines = component_updated.splitlines(
    keepends=True
)

control_indexes = [
    index
    for index, line in enumerate(lines)
    if "Control Buttons" in line
]

if len(control_indexes) != 1:
    fail(
        "Esperava encontrar exatamente um comentário "
        "'Control Buttons'.\n\n"
        f"Encontrados: {len(control_indexes)}"
    )


control_index = control_indexes[0]


# Confirmar que estamos realmente depois dos sons.
before_controls = "".join(
    lines[
        max(0, control_index - 35):
        control_index
    ]
)

if "selectedSound" not in before_controls:
    fail(
        "O comentário Control Buttons encontrado "
        "não parece estar depois do seletor de sons."
    )


# ============================================================
# 9. UI DO RABISCO
# ============================================================

doodle_ui = '''      {/* Abraço Premium — Rabisco */}
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


lines.insert(
    control_index,
    doodle_ui
)

component_updated = "".join(lines)


# ============================================================
# 10. TRADUÇÕES
# ============================================================

translations = {
    "pt": {
        "eyebrow": "Um momento para as mãos",
        "title": "Rabisco",
        "description": (
            "Uma pequena pausa para desenhares "
            "sem pensar demasiado."
        ),
        "open": "Quero rabiscar",
        "prompt": (
            "Desenha um lugar onde gostarias "
            "de estar agora."
        ),
        "canvasLabel": (
            "Área para desenhar com o dedo"
        ),
        "clear": "Limpar",
        "close": "Terminei",
        "private": (
            "Este rabisco fica apenas neste momento."
        ),
    },

    "en": {
        "eyebrow": "A moment for your hands",
        "title": "Doodle",
        "description": (
            "A small pause to draw without "
            "thinking too much."
        ),
        "open": "I want to doodle",
        "prompt": (
            "Draw a place where you would "
            "like to be right now."
        ),
        "canvasLabel": (
            "Area for drawing with your finger"
        ),
        "clear": "Clear",
        "close": "I'm done",
        "private": (
            "This doodle stays only in this moment."
        ),
    },

    "es": {
        "eyebrow": "Un momento para tus manos",
        "title": "Garabato",
        "description": (
            "Una pequeña pausa para dibujar "
            "sin pensar demasiado."
        ),
        "open": "Quiero dibujar",
        "prompt": (
            "Dibuja un lugar donde te gustaría "
            "estar ahora."
        ),
        "canvasLabel": (
            "Zona para dibujar con el dedo"
        ),
        "clear": "Limpiar",
        "close": "He terminado",
        "private": (
            "Este dibujo se queda solo "
            "en este momento."
        ),
    },

    "fr": {
        "eyebrow": "Un moment pour tes mains",
        "title": "Gribouillage",
        "description": (
            "Une petite pause pour dessiner "
            "sans trop réfléchir."
        ),
        "open": "Je veux dessiner",
        "prompt": (
            "Dessine un endroit où tu aimerais "
            "être maintenant."
        ),
        "canvasLabel": (
            "Zone pour dessiner avec le doigt"
        ),
        "clear": "Effacer",
        "close": "J'ai terminé",
        "private": (
            "Ce dessin reste seulement "
            "dans cet instant."
        ),
    },
}


for language, values in translations.items():
    locale_data[language]["hugDoodle"] = values


# ============================================================
# 11. VALIDAR COMPONENTE EM MEMÓRIA
# ============================================================

component_checks = [
    "const [showDoodle, setShowDoodle] = useState(false);",
    "doodleCanvasRef",
    "doodleDrawingRef",
    "doodleLastPointRef",
    "getDoodlePoint",
    "prepareDoodleCanvas",
    "handleDoodlePointerDown",
    "handleDoodlePointerMove",
    "stopDoodleDrawing",
    "clearDoodle",
    "closeDoodle",
    "<canvas",
    "touch-none",
    't("hugDoodle.title")',
    't("hugDoodle.prompt")',
]

for marker in component_checks:
    if marker not in component_updated:
        fail(
            "Validação do componente falhou:\n"
            f"{marker}"
        )


if component_updated.count("<canvas") != 1:
    fail(
        "Esperava exatamente um canvas."
    )


# ============================================================
# 12. GARANTIR ZERO REACT STATE NO POINTERMOVE
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
        "Não consegui isolar handleDoodlePointerMove."
    )


move_block = component_updated[
    move_start:move_end
]


for forbidden in [
    "setShowDoodle",
    "setSecondsLeft",
    "setPhraseIdx",
    "setBreatheState",
    "setCompleted",
    "setSelectedSound",
]:
    if forbidden in move_block:
        fail(
            "Foi encontrado React state durante "
            "pointermove:\n"
            f"{forbidden}"
        )


# ============================================================
# 13. GARANTIR QUE NÃO INTRODUZIMOS STORAGE/TIMERS
# ============================================================

doodle_start = component_updated.find(
    "const getDoodlePoint"
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
    "setInterval(",
    "requestAnimationFrame(",
    "new Image(",
    "toDataURL(",
    "toBlob(",
]:
    if forbidden in doodle_logic:
        fail(
            "Foi encontrada uma operação não desejada "
            "no motor do Rabisco:\n"
            f"{forbidden}"
        )


# ============================================================
# 14. GARANTIR QUE O ABRAÇO ORIGINAL CONTINUA PRESENTE
# ============================================================

preserved_markers = [
    "onAddXp(30)",
    "setInterval(() => {",
    "SOOTHING_PHRASES.length",
    "setSecondsLeft(prev => prev - 1)",
    "setBreatheState(prev =>",
    "sound.loop = true",
    "App.addListener(",
    "visibilitychange",
    "sessionCompleted",
]

for marker in preserved_markers:
    if marker not in component_updated:
        fail(
            "Uma parte do Abraço original desapareceu:\n"
            f"{marker}"
        )


# ============================================================
# 15. PREPARAR LOCALES EM MEMÓRIA
# ============================================================

locale_updated = {}

for language, data in locale_data.items():
    text = (
        json.dumps(
            data,
            ensure_ascii=False,
            indent=2,
        )
        + "\n"
    )

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError as error:
        fail(
            f"{language.upper()}: JSON inválido "
            f"após preparação:\n{error}"
        )

    if "hugDoodle" not in parsed:
        fail(
            f"{language.upper()}: hugDoodle ausente."
        )

    locale_updated[language] = text


# ============================================================
# 16. BACKUPS
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
            "before_abraco_premium_a1_v2"
        ),
    )


# ============================================================
# 17. ESCREVER
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
# 18. VERIFICAÇÃO FINAL
# ============================================================

written_component = COMPONENT.read_text(
    encoding="utf-8"
)


final_checks = [
    "showDoodle",
    "prepareDoodleCanvas",
    "handleDoodlePointerDown",
    "handleDoodlePointerMove",
    "clearDoodle",
    "<canvas",
    "touch-none",
]

for marker in final_checks:
    if marker not in written_component:
        fail(
            "Validação pós-escrita falhou:\n"
            f"{marker}"
        )


for language, path in LOCALES.items():
    try:
        final_locale = json.loads(
            path.read_text(
                encoding="utf-8"
            )
        )
    except json.JSONDecodeError as error:
        fail(
            f"{language.upper()}: JSON final inválido:\n"
            f"{error}"
        )

    if "hugDoodle" not in final_locale:
        fail(
            f"{language.upper()}: hugDoodle "
            "não existe no ficheiro final."
        )


# ============================================================
# 19. RESULTADO
# ============================================================

print()
print("=" * 74)
print("CONFIA — ABRAÇO PREMIUM A1 V2")
print("=" * 74)
print()

print("✓ Rabisco opcional adicionado")
print("✓ Canvas API nativa")
print("✓ Pointer Events nativos")
print("✓ Desenho por dedo/rato")
print("✓ Sem React state durante pointermove")
print("✓ Device pixel ratio limitado a 2")
print("✓ Canvas montado apenas quando aberto")
print("✓ Limpar desenho")
print("✓ Terminar desmonta o canvas")
print("✓ Sem localStorage")
print("✓ Sem base64")
print("✓ Sem novos timers")
print("✓ Sem requestAnimationFrame permanente")
print("✓ Sem novas dependências")
print("✓ Timer original preservado")
print("✓ Respiração preservada")
print("✓ Sons preservados")
print("✓ +30 XP preservado")
print("✓ PT / EN / ES / FR")
print()

print("Backup:")
print(f"  {BACKUP_COMPONENT}")

for language in LOCALES:
    print(
        f"  /tmp/{language}.json."
        "before_abraco_premium_a1_v2"
    )

print()
print("PRÓXIMO PASSO:")
print("  npm run build")
print("=" * 74)
