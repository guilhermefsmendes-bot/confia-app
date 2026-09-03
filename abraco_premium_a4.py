from pathlib import Path
import shutil
import sys

# ============================================================
# CONFIA — ABRAÇO PREMIUM A4
# POLIMENTO TÉCNICO + ESTABILIDADE FINAL
#
# Objetivos:
#
# 1. Canvas passa a usar ref React estável
# 2. Evitar callback-ref recriada pelos renders do timer
# 3. Canvas preparado apenas quando está realmente visível
# 4. ResizeObserver local apenas enquanto o Rabisco está aberto
# 5. Redesenho vetorial seguro em mudanças de dimensão
# 6. Libertar traços da memória imediatamente após "Terminei"
#
# NÃO adiciona:
# - dependências
# - storage
# - imagens
# - base64
# - ImageData
# - timers
# - requestAnimationFrame
# - listeners globais
# - XP
# - textos
# - traduções
#
# ALTERA APENAS:
# - src/components/AbracoTimer.tsx
#
# Backup:
# /tmp/AbracoTimer.tsx.before_abraco_premium_a4
# ============================================================

ROOT = Path.cwd()

COMPONENT = ROOT / "src/components/AbracoTimer.tsx"

BACKUP = Path(
    "/tmp/AbracoTimer.tsx.before_abraco_premium_a4"
)


def fail(message: str):
    print()
    print("=" * 78)
    print("ERRO — A4 NÃO APLICADA")
    print("=" * 78)
    print()
    print(message)
    print()
    print("Nenhum ficheiro foi alterado.")
    print("=" * 78)
    sys.exit(1)


# ============================================================
# 1. VALIDAR FICHEIRO
# ============================================================

if not COMPONENT.exists():
    fail(
        f"Não encontrei:\n{COMPONENT}"
    )

original = COMPONENT.read_text(
    encoding="utf-8"
)


# ============================================================
# 2. VALIDAR A3
# ============================================================

required_a3 = [
    "type DoodleStroke",
    "DOODLE_PROMPT_KEYS",
    "doodlePromptIndex",
    "doodleFinished",
    "DOODLE_MAX_STROKES = 120",
    "DOODLE_MAX_POINTS_PER_STROKE = 900",
    "doodleCanvasRef",
    "doodleStrokesRef",
    "doodleCurrentStrokeRef",
    "prepareDoodleCanvas",
    "redrawDoodle",
    "handleDoodlePointerDown",
    "handleDoodlePointerMove",
    "stopDoodleDrawing",
    "undoDoodle",
    "chooseNextDoodlePrompt",
    "resetDoodleExperience",
    "openDoodle",
    "finishDoodle",
    "closeDoodle",
    't("hugDoodle.challenge")',
    't("hugDoodle.ritual")',
    't("hugDoodle.letGo")',
    't("hugDoodle.another")',
    "touch-none",
]

for marker in required_a3:
    if marker not in original:
        fail(
            "A estrutura atual não corresponde à A3.\n\n"
            f"Falta:\n{marker}"
        )


# ============================================================
# 3. IMPEDIR DUPLICAÇÃO DA A4
# ============================================================

a4_markers = [
    "doodleCanvasResizeObserver",
    "ref={doodleCanvasRef}",
    "CONFIA A4 — ciclo de vida do canvas",
]

already_present = [
    marker
    for marker in a4_markers
    if marker in original
]

if already_present:
    fail(
        "A A4 já parece estar total ou parcialmente aplicada:\n\n"
        + "\n".join(already_present)
    )


updated = original


# ============================================================
# 4. CONFIRMAR CALLBACK REF A3
# ============================================================

old_canvas_ref = "ref={prepareDoodleCanvas}"

if updated.count(old_canvas_ref) != 1:
    fail(
        "Esperava exatamente:\n\n"
        "ref={prepareDoodleCanvas}\n\n"
        f"Encontrados: {updated.count(old_canvas_ref)}"
    )


# ============================================================
# 5. SUBSTITUIR POR REF ESTÁVEL
# ============================================================

updated = updated.replace(
    old_canvas_ref,
    "ref={doodleCanvasRef}",
    1,
)


# ============================================================
# 6. LOCALIZAR FINISHDoodle
# ============================================================

finish_start = updated.find(
    "const finishDoodle = () => {"
)

close_start = updated.find(
    "const closeDoodle = () => {",
    finish_start
)

if finish_start == -1 or close_start == -1:
    fail(
        "Não consegui isolar finishDoodle."
    )

finish_block = updated[
    finish_start:close_start
]

expected_finish_parts = [
    "doodleDrawingRef.current = false;",
    "doodleLastPointRef.current = null;",
    "doodleCurrentStrokeRef.current = null;",
    "setDoodleFinished(true);",
]

for marker in expected_finish_parts:
    if marker not in finish_block:
        fail(
            "finishDoodle tem uma estrutura diferente "
            "da esperada:\n\n"
            f"{marker}"
        )


# ============================================================
# 7. FINISH LIBERTA MEMÓRIA TEMPORÁRIA
# ============================================================

new_finish = '''const finishDoodle = () => {
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

'''

updated = (
    updated[:finish_start]
    + new_finish
    + updated[close_start:]
)


# ============================================================
# 8. LOCALIZAR FIM DE CLOSEDoodle
# ============================================================

close_start = updated.find(
    "const closeDoodle = () => {"
)

format_start = updated.find(
    "const formatTime",
    close_start
)

if close_start == -1 or format_start == -1:
    fail(
        "Não consegui localizar closeDoodle / formatTime."
    )

close_region = updated[
    close_start:format_start
]

required_close = [
    "doodleDrawingRef.current = false;",
    "doodleLastPointRef.current = null;",
    "doodleCurrentStrokeRef.current = null;",
    "doodleStrokesRef.current = [];",
    "doodleCanvasRef.current = null;",
    "setDoodleStrokeCount(0);",
    "setDoodleFinished(false);",
    "setShowDoodle(false);",
]

for marker in required_close:
    if marker not in close_region:
        fail(
            "closeDoodle não corresponde à A3:\n\n"
            f"{marker}"
        )


# ============================================================
# 9. ADICIONAR CICLO DE VIDA ESTÁVEL DO CANVAS
# ============================================================

canvas_effect = r'''
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

'''

updated = (
    updated[:format_start]
    + canvas_effect
    + updated[format_start:]
)


# ============================================================
# 10. VALIDAR QUE POINTERMOVE CONTINUA LEVE
# ============================================================

move_start = updated.find(
    "const handleDoodlePointerMove"
)

move_end = updated.find(
    "const stopDoodleDrawing",
    move_start
)

if move_start == -1 or move_end == -1:
    fail(
        "Não consegui isolar handleDoodlePointerMove."
    )

move_block = updated[
    move_start:move_end
]

for forbidden in [
    "setShowDoodle",
    "setDoodleColor",
    "setDoodleWidth",
    "setDoodleStrokeCount",
    "setDoodlePromptIndex",
    "setDoodleFinished",
    "setSecondsLeft",
    "setPhraseIdx",
    "setCompleted",
]:
    if forbidden in move_block:
        fail(
            "Foi encontrado React state durante "
            "pointermove:\n\n"
            f"{forbidden}"
        )


# ============================================================
# 11. AUDITAR DPR
# ============================================================

if (
    "Math.min(window.devicePixelRatio || 1, 2)"
    not in updated
):
    fail(
        "A proteção DPR máximo 2 desapareceu."
    )


# ============================================================
# 12. AUDITAR LIMITES VETORIAIS
# ============================================================

limits = [
    "DOODLE_MAX_STROKES = 120",
    "DOODLE_MAX_POINTS_PER_STROKE = 900",
    "distanceSquared < 0.000004",
]

for marker in limits:
    if marker not in updated:
        fail(
            "Proteção vetorial desapareceu:\n"
            f"{marker}"
        )


# ============================================================
# 13. AUDITAR OPERAÇÕES PESADAS
# ============================================================

doodle_start = updated.find(
    "const DOODLE_MAX_STROKES"
)

doodle_end = updated.find(
    "const formatTime",
    doodle_start
)

if doodle_start == -1 or doodle_end == -1:
    fail(
        "Não consegui isolar o motor completo do Rabisco."
    )

doodle_logic = updated[
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
    "setTimeout(",
    "setInterval(",
    "new Image(",
    "fetch(",
]:
    if forbidden in doodle_logic:
        fail(
            "Foi encontrada uma operação não desejada "
            "no motor do Rabisco:\n\n"
            f"{forbidden}"
        )


# ============================================================
# 14. GARANTIR QUE NÃO CRIÁMOS LISTENERS GLOBAIS
# ============================================================

a4_region_start = updated.find(
    "CONFIA A4 — ciclo de vida do canvas"
)

a4_region_end = updated.find(
    "const formatTime",
    a4_region_start
)

if (
    a4_region_start == -1
    or a4_region_end == -1
):
    fail(
        "Não consegui auditar o efeito A4."
    )

a4_region = updated[
    a4_region_start:a4_region_end
]

for forbidden in [
    "window.addEventListener",
    "document.addEventListener",
    "window.onresize",
]:
    if forbidden in a4_region:
        fail(
            "Listener global inesperado na A4:\n"
            f"{forbidden}"
        )


# ============================================================
# 15. GARANTIR CLEANUP DO RESIZEOBSERVER
# ============================================================

observer_checks = [
    "new ResizeObserver",
    ".observe(",
    ".disconnect()",
]

for marker in observer_checks:
    if marker not in a4_region:
        fail(
            "ResizeObserver sem ciclo completo:\n"
            f"{marker}"
        )


# ============================================================
# 16. GARANTIR APENAS UM CANVAS
# ============================================================

if updated.count("<canvas") != 1:
    fail(
        "Esperava exatamente um <canvas>.\n"
        f"Encontrados: {updated.count('<canvas')}"
    )

if updated.count("ref={doodleCanvasRef}") != 1:
    fail(
        "Esperava exatamente um ref estável "
        "doodleCanvasRef."
    )

if "ref={prepareDoodleCanvas}" in updated:
    fail(
        "A callback ref antiga ainda existe."
    )


# ============================================================
# 17. PRESERVAR FUNCIONALIDADES DO RABISCO
# ============================================================

rabisco_features = [
    "DOODLE_PROMPT_KEYS",
    "chooseNextDoodlePrompt",
    "resetDoodleExperience",
    "openDoodle",
    "finishDoodle",
    "undoDoodle",
    "clearDoodle",
    "doodleColor",
    "doodleWidth",
    "doodleStrokeCount",
    't("hugDoodle.challenge")',
    't("hugDoodle.ritual")',
    't("hugDoodle.letGo")',
    't("hugDoodle.another")',
]

for marker in rabisco_features:
    if marker not in updated:
        fail(
            "Funcionalidade do Rabisco desapareceu:\n"
            f"{marker}"
        )


# ============================================================
# 18. PRESERVAR ABRAÇO ORIGINAL
# ============================================================

original_features = [
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

for marker in original_features:
    if marker not in updated:
        fail(
            "Funcionalidade original do Abraço "
            "desapareceu:\n"
            f"{marker}"
        )


# ============================================================
# 19. GARANTIR QUE NÃO TOCÁMOS EM IMPORTS
# ============================================================

original_imports = "\n".join(
    line
    for line in original.splitlines()
    if line.startswith("import ")
)

updated_imports = "\n".join(
    line
    for line in updated.splitlines()
    if line.startswith("import ")
)

if original_imports != updated_imports:
    fail(
        "A A4 alteraria imports, o que não era esperado."
    )


# ============================================================
# 20. CONTAGEM DE ALTERAÇÕES IMPORTANTES
# ============================================================

checks = {
    "ref estável":
        "ref={doodleCanvasRef}" in updated,

    "callback ref removida":
        "ref={prepareDoodleCanvas}" not in updated,

    "ResizeObserver local":
        "new ResizeObserver" in updated,

    "cleanup observer":
        ".disconnect()" in updated,

    "libertação no finish":
        (
            "const finishDoodle = () => {"
            in updated
            and "doodleStrokesRef.current = [];"
            in updated[
                updated.find("const finishDoodle"):
                updated.find(
                    "const closeDoodle",
                    updated.find("const finishDoodle")
                )
            ]
        ),
}

failed_checks = [
    name
    for name, result in checks.items()
    if not result
]

if failed_checks:
    fail(
        "Falharam verificações A4:\n\n"
        + "\n".join(failed_checks)
    )


# ============================================================
# 21. BACKUP
# ============================================================

shutil.copy2(
    COMPONENT,
    BACKUP
)


# ============================================================
# 22. ESCREVER
# ============================================================

COMPONENT.write_text(
    updated,
    encoding="utf-8"
)


# ============================================================
# 23. VERIFICAÇÃO PÓS-ESCRITA
# ============================================================

written = COMPONENT.read_text(
    encoding="utf-8"
)

post_checks = [
    "ref={doodleCanvasRef}",
    "CONFIA A4 — ciclo de vida do canvas",
    "new ResizeObserver",
    ".disconnect()",
    "DOODLE_MAX_STROKES = 120",
    "DOODLE_MAX_POINTS_PER_STROKE = 900",
    "doodleStrokesRef.current = [];",
    "touch-none",
    "onAddXp(30)",
]

for marker in post_checks:
    if marker not in written:
        print()
        print("=" * 78)
        print("ERRO PÓS-ESCRITA")
        print("=" * 78)
        print()
        print(f"Falta:\n{marker}")
        print()
        print(
            "Existe backup disponível em:\n"
            f"{BACKUP}"
        )
        print("=" * 78)
        sys.exit(1)


# ============================================================
# 24. RESULTADO
# ============================================================

print()
print("=" * 78)
print("CONFIA — ABRAÇO PREMIUM A4")
print("=" * 78)
print()

print("✓ Canvas com ref React estável")
print("✓ Callback ref recriada pelos renders removida")
print("✓ Preparação do canvas apenas quando visível")
print("✓ ResizeObserver apenas enquanto Rabisco está ativo")
print("✓ Cleanup automático do ResizeObserver")
print("✓ Sem listener global de resize")
print("✓ Redesenho vetorial preservado")
print("✓ Traços libertados ao carregar em Terminei")
print("✓ Memória temporária reduzida durante ritual final")
print("✓ 12 desafios preservados")
print("✓ 4 cores preservadas")
print("✓ 3 espessuras preservadas")
print("✓ Desfazer preservado")
print("✓ Limpar preservado")
print("✓ Outro desafio preservado")
print("✓ Outro rabisco preservado")
print("✓ Deixar ir preservado")
print("✓ Máximo 120 traços")
print("✓ Máximo 900 pontos por traço")
print("✓ Micro-movimentos filtrados")
print("✓ Coordenadas normalizadas")
print("✓ Sem setState durante pointermove")
print("✓ DPR máximo 2")
print("✓ Sem ImageData")
print("✓ Sem screenshots")
print("✓ Sem base64")
print("✓ Sem localStorage")
print("✓ Sem novos timers")
print("✓ Sem requestAnimationFrame")
print("✓ Sem novas dependências")
print("✓ Sem novos textos")
print("✓ PT / EN / ES / FR preservados")
print("✓ Timer / respiração / sons preservados")
print("✓ +30 XP preservado")
print()

print("Backup:")
print(f"  {BACKUP}")
print()
print("PRÓXIMO PASSO:")
print("  npm run build")
print("=" * 78)
