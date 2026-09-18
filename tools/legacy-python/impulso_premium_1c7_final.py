from pathlib import Path
import re
import shutil
import sys


SOS = Path("src/components/ImpulsoSOS.tsx")
TYPES = Path("src/components/Impulso/types.ts")


def fail(message):
    print(f"ERRO: {message}")
    sys.exit(1)


if not SOS.exists():
    fail(f"não encontrado: {SOS}")

if not TYPES.exists():
    fail(f"não encontrado: {TYPES}")


sos = SOS.read_text(encoding="utf-8")
types = TYPES.read_text(encoding="utf-8")

original_sos = sos
original_types = types


# ============================================================
# 1. TYPES.TS — EMOÇÕES ESTÁVEIS SEM QUEBRAR LEGADO
# ============================================================

old_emotion_type = '''export type Emotion =
  | "fear"
  | "uncertainty"
  | "urgency"
  | "curiosity"
  | "guilt";'''

new_emotion_type = '''export type Emotion =
  | "fear"
  | "anxiety"
  | "sadness"
  | "frustration"
  | "confusion"

  /**
   * IDs mantidos para compatibilidade
   * com episódios/fluxos anteriores.
   */
  | "uncertainty"
  | "urgency"
  | "curiosity"
  | "guilt";'''

if old_emotion_type in types:
    types = types.replace(
        old_emotion_type,
        new_emotion_type,
        1,
    )
elif '"anxiety"' not in types:
    fail("bloco Emotion esperado não encontrado em types.ts")


# ============================================================
# 2. IMPORTAR TIPOS CENTRAIS NO IMPULSOSOS
# ============================================================

type_import = '''import type {
  Emotion,
  ImpulseNeed,
  Trigger,
} from "./Impulso/types";
'''

if 'from "./Impulso/types"' not in sos:
    anchor = 'import { saveEpisode } from "./Impulso";'

    if anchor not in sos:
        fail("import saveEpisode não encontrado.")

    sos = sos.replace(
        anchor,
        anchor + "\n" + type_import.rstrip(),
        1,
    )


# ============================================================
# 3. REMOVER TIPOS LOCAIS DUPLICADOS
# ============================================================

local_need = re.compile(
    r'\ntype ImpulseNeed\s*=\s*'
    r'\n\s*\|\s*"calm"'
    r'\n\s*\|\s*"mind"'
    r'\n\s*\|\s*"control"'
    r'\n\s*\|\s*"support";\s*\n'
)

sos, count_need = local_need.subn("\n", sos, count=1)

if count_need == 0 and 'type ImpulseNeed =' in sos:
    fail("não foi possível remover ImpulseNeed local.")


local_trigger = re.compile(
    r'\ntype Trigger\s*=\s*'
    r'.*?'
    r'\|\s*"❓ Não sei";\s*\n',
    re.DOTALL,
)

sos, count_trigger = local_trigger.subn("\n", sos, count=1)

if count_trigger == 0 and 'type Trigger =' in sos:
    fail("não foi possível remover Trigger local.")


local_emotion = re.compile(
    r'\ntype Emotion\s*=\s*'
    r'.*?'
    r'\|\s*"🤯 Confusão";\s*\n',
    re.DOTALL,
)

sos, count_emotion = local_emotion.subn("\n", sos, count=1)

if count_emotion == 0 and 'type Emotion =' in sos:
    fail("não foi possível remover Emotion local.")


# Thought continua string traduzida por compatibilidade.
old_thought_type = '''type Thought =
  | "Tenho uma doença grave."
  | "Preciso confirmar."
  | "Isto nunca me aconteceu."
  | "Vou perder o controlo."
  | "Não sei.";'''

if old_thought_type in sos:
    sos = sos.replace(
        old_thought_type,
        "type Thought = string;",
        1,
    )


# ============================================================
# 4. ARRAYS — ID INTERNO + LABEL TRADUZIDA
# ============================================================

arrays_pattern = re.compile(
    r'const triggers = \[.*?\];'
    r'\s*'
    r'const emotions = \[.*?\];'
    r'\s*'
    r'const thoughts = \[.*?\];',
    re.DOTALL,
)

new_arrays = '''const triggers: Array<{
  id: Trigger;
  label: string;
}> = [
  {
    id: "internet",
    label: t("triggerInternet"),
  },
  {
    id: "symptom",
    label: t("triggerSymptom"),
  },
  {
    id: "conversation",
    label: t("triggerDiseaseTalk"),
  },
  {
    id: "message",
    label: t("triggerMessage"),
  },
  {
    id: "other",
    label: t("triggerUnknown"),
  },
];

const emotions: Array<{
  id: Emotion;
  label: string;
}> = [
  {
    id: "fear",
    label: t("emotionFear"),
  },
  {
    id: "anxiety",
    label: t("emotionAnxiety"),
  },
  {
    id: "sadness",
    label: t("emotionSadness"),
  },
  {
    id: "frustration",
    label: t("emotionFrustration"),
  },
  {
    id: "confusion",
    label: t("emotionConfusion"),
  },
];

const thoughts: Thought[] = [
  t("thoughtSeriousDisease"),
  t("thoughtNeedConfirm"),
  t("thoughtNeverHappened"),
  t("thoughtLoseControl"),
  t("thoughtDontKnow"),
];'''

sos, arrays_count = arrays_pattern.subn(
    new_arrays,
    sos,
    count=1,
)

if arrays_count != 1:
    fail("arrays triggers/emotions/thoughts não encontrados.")


# ============================================================
# 5. HELPERS DE LABEL
# ============================================================

format_anchor = '''  // Formatar segundos em MM:SS
  const formatTime = (seconds: number) => {'''

if format_anchor not in sos:
    fail("formatTime não encontrado.")

helpers = '''  const getTriggerLabel = (
    value: Trigger | null
  ): string => {
    if (!value) {
      return t("unexpectedTrigger");
    }

    return (
      triggers.find((item) => item.id === value)?.label ??
      t("unexpectedTrigger")
    );
  };

  const getEmotionLabel = (
    value: Emotion | null
  ): string => {
    if (!value) {
      return t("apprehension");
    }

    return (
      emotions.find((item) => item.id === value)?.label ??
      t("apprehension")
    );
  };

'''

if "const getTriggerLabel" not in sos:
    sos = sos.replace(
        format_anchor,
        helpers + format_anchor,
        1,
    )


# ============================================================
# 6. JUSTIFICATION PHRASE — USAR LABELS, NÃO IDs
# ============================================================

justification_pattern = re.compile(
    r'const getJustificationPhrase = \(\) => \{.*?\n\};',
    re.DOTALL,
)

new_justification = '''const getJustificationPhrase = () => {
  const triggerLabel = getTriggerLabel(trigger);
  const emotionLabel = getEmotionLabel(emotion).toLowerCase();
  const thoughtLabel = thought
    ? thought.replace(/\\.$/, "")
    : t("needsConfirmation");

  return t("justificationPhrase", {
    trigger: triggerLabel,
    emotion: emotionLabel,
    thought: thoughtLabel,
  });
};'''

sos, justification_count = justification_pattern.subn(
    new_justification,
    sos,
    count=1,
)

if justification_count != 1:
    fail("getJustificationPhrase não encontrado.")


# ============================================================
# 7. PSICOEDUCAÇÃO — SWITCH POR ID ESTÁVEL
# ============================================================

psycho_pattern = re.compile(
    r'const getPsychoeducationMessage = \(\) => \{.*?\n\};',
    re.DOTALL,
)

new_psycho = '''const getPsychoeducationMessage = () => {
  switch (trigger) {
    case "internet":
      return t("psychoInternet");

    case "symptom":
      return t("psychoSymptom");

    case "conversation":
      return t("psychoDiseaseTalk");

    default:
      return t("psychoDefault");
  }
};'''

sos, psycho_count = psycho_pattern.subn(
    new_psycho,
    sos,
    count=1,
)

if psycho_count != 1:
    fail("getPsychoeducationMessage não encontrado.")


# ============================================================
# 8. GUARDAR TRIGGER / EMOTION / THOUGHT NO EPISÓDIO
# ============================================================

save_anchor = '''      need: impulseNeed ?? undefined,
      initialIntensity: intensity,
      finalIntensity,'''

save_replacement = '''      need: impulseNeed ?? undefined,
      initialIntensity: intensity,
      finalIntensity,
      trigger: trigger ?? undefined,
      emotion: emotion ?? undefined,
      thought: thought ?? undefined,'''

if "trigger: trigger ?? undefined" not in sos:
    if save_anchor not in sos:
        fail("bloco saveEpisode não encontrado.")

    sos = sos.replace(
        save_anchor,
        save_replacement,
        1,
    )


# ============================================================
# 9. TRIGGER UI — OBJETOS
# ============================================================

old_trigger_map = '''{triggers.map((item) => {
                const selected = trigger === item;'''

new_trigger_map = '''{triggers.map((item) => {
                const selected = trigger === item.id;'''

if old_trigger_map not in sos:
    fail("map de triggers não encontrado.")

sos = sos.replace(
    old_trigger_map,
    new_trigger_map,
    1,
)

sos = sos.replace(
    '''key={item}
                    onClick={() => setTrigger(item)}''',
    '''key={item.id}
                    onClick={() => setTrigger(item.id)}''',
    1,
)

trigger_display_pos = sos.find(
    "{triggers.map((item)"
)

if trigger_display_pos == -1:
    fail("posição trigger map não encontrada.")

next_emotion_pos = sos.find(
    "{emotions.map((item)",
    trigger_display_pos,
)

trigger_section = sos[
    trigger_display_pos:next_emotion_pos
]

if "{item}" not in trigger_section:
    fail("label antiga do trigger não encontrada.")

trigger_section = trigger_section.replace(
    "{item}",
    "{item.label}",
    1,
)

sos = (
    sos[:trigger_display_pos]
    + trigger_section
    + sos[next_emotion_pos:]
)


# ============================================================
# 10. EMOTION UI — OBJETOS
# ============================================================

old_emotion_map = '''{emotions.map((item) => {
                const selected = emotion === item;'''

new_emotion_map = '''{emotions.map((item) => {
                const selected = emotion === item.id;'''

if old_emotion_map not in sos:
    fail("map de emotions não encontrado.")

sos = sos.replace(
    old_emotion_map,
    new_emotion_map,
    1,
)

sos = sos.replace(
    '''key={item}
                    onClick={() => setEmotion(item)}''',
    '''key={item.id}
                    onClick={() => setEmotion(item.id)}''',
    1,
)

emotion_display_pos = sos.find(
    "{emotions.map((item)"
)

if emotion_display_pos == -1:
    fail("posição emotion map não encontrada.")

thought_map_pos = sos.find(
    "{thoughts.map((item)",
    emotion_display_pos,
)

emotion_section = sos[
    emotion_display_pos:thought_map_pos
]

if "{item}" not in emotion_section:
    fail("label antiga da emotion não encontrada.")

emotion_section = emotion_section.replace(
    "{item}",
    "{item.label}",
    1,
)

sos = (
    sos[:emotion_display_pos]
    + emotion_section
    + sos[thought_map_pos:]
)


# ============================================================
# 11. THOUGHT — NÃO AUTO-AVANÇAR
# ============================================================

thought_click_pattern = re.compile(
    r'''onClick=\{\(\) => \{
\s*setThought\(item\);
\s*
\s*const routeIndex =
\s*activeRoute\.indexOf\(4\);
\s*
\s*if \(
\s*routeIndex >= 0 &&
\s*routeIndex < activeRoute\.length - 1
\s*\) \{
\s*setStep\(
\s*activeRoute\[routeIndex \+ 1\]
\s*\);
\s*\}
\s*\}\}''',
    re.MULTILINE,
)

sos, thought_click_count = thought_click_pattern.subn(
    'onClick={() => setThought(item)}',
    sos,
    count=1,
)

if thought_click_count != 1:
    fail("auto-avanço do pensamento não encontrado.")


# ============================================================
# 12. PASSO 5 — MOSTRAR LABELS TRADUZIDAS
# ============================================================

# Só dentro da secção step 5.
step5_start = sos.find("{step === 5")
step6_start = sos.find("{step === 6", step5_start)

if step5_start == -1 or step6_start == -1:
    fail("steps 5/6 não encontrados.")

step5 = sos[step5_start:step6_start]

# Apenas as ocorrências de output.
step5 = step5.replace(
    "{trigger}",
    "{getTriggerLabel(trigger)}",
    1,
)

step5 = step5.replace(
    "{emotion}",
    "{getEmotionLabel(emotion)}",
    1,
)

sos = (
    sos[:step5_start]
    + step5
    + sos[step6_start:]
)


# ============================================================
# 13. ESTADO DE VALIDAÇÃO DO PASSO
# ============================================================

validation_anchor = '''  const prevStep = () => {
    const routeIndex = activeRoute.indexOf(step);'''

validation_block = '''  const canContinueCurrentStep =
    step === 2
      ? Boolean(trigger)
      : step === 3
      ? Boolean(emotion)
      : step === 4
      ? Boolean(thought)
      : true;

'''

if "const canContinueCurrentStep" not in sos:
    if validation_anchor not in sos:
        fail("prevStep não encontrado.")

    sos = sos.replace(
        validation_anchor,
        validation_block + validation_anchor,
        1,
    )


# ============================================================
# 14. nextStep DEFENSIVO
# ============================================================

nextstep_anchor = '''  const nextStep = () => {
    const routeIndex = activeRoute.indexOf(step);'''

nextstep_replacement = '''  const nextStep = () => {
    if (!canContinueCurrentStep) {
      return;
    }

    const routeIndex = activeRoute.indexOf(step);'''

if nextstep_anchor not in sos:
    fail("nextStep não encontrado.")

sos = sos.replace(
    nextstep_anchor,
    nextstep_replacement,
    1,
)


# ============================================================
# 15. BOTÃO SEGUINTE — DISABLED REAL
# ============================================================

nav_button_anchor = '''        <button
          type="button"
          onClick={nextStep}
          className="flex h-12 flex-1 items-center justify-between rounded-[18px] bg-[#C97B5E] px-4 text-white shadow-[0_8px_20px_rgba(201,123,94,0.18)] transition-transform active:scale-[0.99]"
        >'''

nav_button_replacement = '''        <button
          type="button"
          onClick={nextStep}
          disabled={!canContinueCurrentStep}
          className={`flex h-12 flex-1 items-center justify-between rounded-[18px] px-4 transition-all ${
            canContinueCurrentStep
              ? "bg-[#C97B5E] text-white shadow-[0_8px_20px_rgba(201,123,94,0.18)] active:scale-[0.99]"
              : "cursor-not-allowed bg-[#EEE7E2] text-[#B7AAA4]"
          }`}
        >'''

if nav_button_anchor not in sos:
    fail("botão de navegação principal não encontrado.")

sos = sos.replace(
    nav_button_anchor,
    nav_button_replacement,
    1,
)


# ============================================================
# 16. LIMPEZA SIMPLES
# ============================================================

# ProgressBar não está a ser usado no componente.
if sos.count("ProgressBar") == 1:
    sos = sos.replace(
        'import ProgressBar from "./ProgressBar";\n',
        "",
        1,
    )

# Pequena correção visual de indentação.
sos = sos.replace(
    'const [impulseNeed, setImpulseNeed] = useState<ImpulseNeed | null>(null);',
    '  const [impulseNeed, setImpulseNeed] = useState<ImpulseNeed | null>(null);',
)


# ============================================================
# 17. VERIFICAÇÕES DE SEGURANÇA
# ============================================================

required_sos = [
    'from "./Impulso/types"',
    'id: "internet"',
    'id: "symptom"',
    'id: "conversation"',
    'id: "message"',
    'id: "other"',
    'id: "fear"',
    'id: "anxiety"',
    'id: "sadness"',
    'id: "frustration"',
    'id: "confusion"',
    "const getTriggerLabel",
    "const getEmotionLabel",
    'case "internet":',
    'case "symptom":',
    'case "conversation":',
    "trigger: trigger ?? undefined",
    "emotion: emotion ?? undefined",
    "thought: thought ?? undefined",
    "const canContinueCurrentStep",
    "if (!canContinueCurrentStep)",
    "disabled={!canContinueCurrentStep}",
    "collectReactiveRecentMemory",
    "recentEffectiveImpulse",
    "need: impulseNeed ?? undefined",
    "analyzeReactiveState",
    "recordReactiveResponse",
    "onAddXp(30)",
]

for fragment in required_sos:
    if fragment not in sos:
        fail(f"verificação SOS falhou: {fragment}")


for forbidden in [
    '"🌐 Vi algo na Internet"',
    '"🧠 Senti um sintoma"',
    '"💬 Alguém falou de doenças"',
    '"📱 Recebi uma mensagem"',
    '"😨 Medo"',
    '"😟 Ansiedade"',
    '"😔 Tristeza"',
    '"😣 Frustração"',
    '"🤯 Confusão"',
]:
    if forbidden in sos:
        fail(
            "ainda existe valor interno traduzido no ImpulsoSOS: "
            + forbidden
        )


required_types = [
    'export type Trigger =',
    '"internet"',
    '"symptom"',
    '"conversation"',
    '"message"',
    '"other"',
    'export type Emotion =',
    '"fear"',
    '"anxiety"',
    '"sadness"',
    '"frustration"',
    '"confusion"',
    '"uncertainty"',
    '"urgency"',
    '"curiosity"',
    '"guilt"',
    'export type ImpulseNeed =',
]

for fragment in required_types:
    if fragment not in types:
        fail(f"verificação types.ts falhou: {fragment}")


# Não alterar quantidade de acessos diretos a storage.
if sos.count("localStorage.getItem(") != original_sos.count(
    "localStorage.getItem("
):
    fail("alteração inesperada em localStorage.getItem.")

if sos.count("localStorage.setItem(") != original_sos.count(
    "localStorage.setItem("
):
    fail("alteração inesperada em localStorage.setItem.")


# Só uma conclusão / recompensa.
if sos.count("onAddXp(30)") != original_sos.count("onAddXp(30)"):
    fail("alteração inesperada no XP.")

if sos.count("saveEpisode({") != original_sos.count("saveEpisode({"):
    fail("alteração inesperada em saveEpisode.")


# ============================================================
# 18. BACKUPS EM /tmp
# ============================================================

shutil.copy2(
    SOS,
    "/tmp/ImpulsoSOS.tsx.before_1c7_final"
)

shutil.copy2(
    TYPES,
    "/tmp/Impulso_types.ts.before_1c7_final"
)


# ============================================================
# 19. ESCREVER
# ============================================================

SOS.write_text(
    sos,
    encoding="utf-8",
)

TYPES.write_text(
    types,
    encoding="utf-8",
)


print("=" * 74)
print("CONFIA — IMPULSO PREMIUM — 1C.7 FINAL")
print("=" * 74)
print("✓ ImpulseNeed usa o tipo central")
print("✓ Trigger usa IDs internos estáveis")
print("✓ Emotion usa IDs internos estáveis")
print("✓ IDs antigos de Emotion preservados para compatibilidade")
print("✓ Textos continuam traduzidos através do i18n")
print("✓ Psychoeducation deixou de depender de português")
print("✓ Resumo apresenta labels traduzidas")
print("✓ Trigger passa a ser guardado no episódio")
print("✓ Emotion passa a ser guardada no episódio")
print("✓ Thought passa a ser guardado no episódio")
print("✓ Thought deixou de avançar automaticamente")
print("✓ Trigger exige escolha antes de avançar")
print("✓ Emotion exige escolha antes de avançar")
print("✓ Thought exige escolha antes de avançar")
print("✓ Botão Seguinte tem estado disabled coerente")
print("✓ Rotas adaptativas preservadas")
print("✓ Memória 1C.5 preservada")
print("✓ Reactive Engine preservado")
print("✓ Histórico reativo preservado")
print("✓ Timer preservado")
print("✓ +30 XP preservado")
print("✓ Nenhum storage novo")
print("✓ Nenhuma dependência nova")
print("✓ Nenhum texto novo — PT/EN/ES/FR mantidos")
print()
print("OK — 1C.7 final aplicada.")
