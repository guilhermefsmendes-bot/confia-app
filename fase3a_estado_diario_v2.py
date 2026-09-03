from pathlib import Path
import shutil
import sys

# ============================================================
# CONFIA — FASE 3
# 3A V2 — ESTADO DIÁRIO / PRIMEIRA ABERTURA DO DIA
#
# CORREÇÃO V2:
# A primeira versão fazia uma auditoria demasiado ampla e
# podia apanhar useEffects já existentes no App.tsx.
#
# Esta versão:
# - valida o delta global de useState/useEffect;
# - isola corretamente apenas o bloco novo;
# - só escreve depois de TODAS as validações passarem.
#
# Objetivo:
#
# - saber a data local de hoje;
# - saber a data da abertura anterior;
# - distinguir primeira abertura do dia;
# - distinguir nova abertura no mesmo dia;
# - calcular dias desde a abertura anterior.
#
# Apenas 1 nova chave de localStorage.
#
# NÃO adiciona:
# - React state
# - useEffect
# - timers
# - listeners
# - dependências
# - textos
# - traduções
# - UI
#
# ALTERA APENAS:
# src/App.tsx
#
# Backup:
# /tmp/App.tsx.before_fase3a_estado_diario_v2
# ============================================================

ROOT = Path.cwd()

APP = ROOT / "src/App.tsx"

BACKUP = Path(
    "/tmp/App.tsx.before_fase3a_estado_diario_v2"
)


def fail(message: str):
    print()
    print("=" * 78)
    print("ERRO — FASE 3A V2 NÃO APLICADA")
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

if not APP.exists():
    fail(
        f"Não encontrei:\n{APP}"
    )

original = APP.read_text(
    encoding="utf-8"
)


# ============================================================
# 2. GARANTIR QUE A V1 NÃO ALTEROU NADA
# ============================================================

existing_3a_markers = [
    "LAST_APP_OPEN_DATE:",
    "confia_last_app_open_date_v1",
    "const getLocalCalendarDate",
    "const appOpenDate",
    "const previousAppOpenDate",
    "const isFirstAppOpenToday",
    "const daysSincePreviousAppOpen",
    "CONFIA 3A — ESTADO DIÁRIO",
]

present = [
    marker
    for marker in existing_3a_markers
    if marker in original
]

if present:
    fail(
        "A Fase 3A já parece estar total ou "
        "parcialmente presente:\n\n"
        + "\n".join(present)
        + "\n\n"
        "Não vou duplicar a implementação."
    )


# ============================================================
# 3. GUARDAR CONTAGENS ORIGINAIS
# ============================================================

original_use_state_count = (
    original.count("useState(")
)

original_use_effect_count = (
    original.count("useEffect(")
)

original_get_count = (
    original.count("localStorage.getItem")
)

original_set_count = (
    original.count("localStorage.setItem")
)

original_reactive_analysis_count = (
    original.count("analyzeReactiveState")
)

original_reactive_record_count = (
    original.count("recordReactiveResponse")
)


# ============================================================
# 4. VALIDAR STORAGE_KEYS
# ============================================================

storage_start = original.find(
    "const STORAGE_KEYS = {"
)

storage_end = original.find(
    "};",
    storage_start
)

if (
    storage_start == -1
    or storage_end == -1
):
    fail(
        "Não consegui localizar STORAGE_KEYS."
    )

storage_block = original[
    storage_start:storage_end + 2
]

required_storage_markers = [
    "AVATAR:",
    "OBJECTIVES:",
    "OBJECTIVES_HISTORY:",
    "RATINGS:",
    "PET_COUNT:",
    "POSTS:",
    "LAST_PET_DATE:",
    "LAST_IMPULSE_USE:",
    "IMPULSE_COUNT:",
]

for marker in required_storage_markers:
    if marker not in storage_block:
        fail(
            "STORAGE_KEYS não corresponde à "
            "estrutura auditada.\n\n"
            f"Falta:\n{marker}"
        )


# ============================================================
# 5. PREPARAR NOVA STORAGE KEY
# ============================================================

impulse_count_line = (
    "IMPULSE_COUNT: 'confia_impulse_count_v1',"
)

if original.count(impulse_count_line) != 1:
    fail(
        "Esperava exatamente uma ocorrência de:\n\n"
        f"{impulse_count_line}\n\n"
        f"Encontradas: "
        f"{original.count(impulse_count_line)}"
    )

updated = original.replace(
    impulse_count_line,
    (
        "IMPULSE_COUNT: 'confia_impulse_count_v1',\n"
        "LAST_APP_OPEN_DATE: "
        "'confia_last_app_open_date_v1',"
    ),
    1,
)


# ============================================================
# 6. LOCALIZAR APP
# ============================================================

app_anchor = (
    "export default function App() {\n"
    "const { t, i18n } = useTranslation();"
)

if updated.count(app_anchor) != 1:
    fail(
        "Não encontrei exatamente a âncora "
        "esperada no início de App()."
    )


# ============================================================
# 7. BLOCO 3A
#
# Usa calendário LOCAL do dispositivo.
#
# Não usamos toISOString porque representa UTC.
# ============================================================

daily_state = r'''

/**
 * ==========================================================
 * CONFIA 3A — ESTADO DIÁRIO
 * ==========================================================
 *
 * Camada factual e extremamente leve.
 *
 * Não interpreta emoções.
 * Não escolhe respostas.
 * Não substitui o Reactive Engine.
 *
 * Apenas permite saber:
 *
 * - qual é o dia local atual;
 * - qual foi o último dia em que a app abriu;
 * - se esta é a primeira abertura de hoje;
 * - quantos dias passaram desde a abertura anterior.
 */

const getLocalCalendarDate = (
  date: Date = new Date()
): string => {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const appOpenDate =
  getLocalCalendarDate();

const previousAppOpenDate =
  localStorage.getItem(
    STORAGE_KEYS.LAST_APP_OPEN_DATE
  );

const isFirstAppOpenToday =
  previousAppOpenDate !== appOpenDate;

/**
 * Diferença entre dias de calendário.
 *
 * Date.UTC é usado apenas para a diferença matemática,
 * depois de termos obtido ano/mês/dia LOCAL.
 *
 * Isto evita problemas de horário de verão em diferenças
 * calculadas diretamente com timestamps locais.
 */
const daysSincePreviousAppOpen = (() => {
  if (!previousAppOpenDate) {
    return null;
  }

  const parts =
    previousAppOpenDate
      .split("-")
      .map(Number);

  if (
    parts.length !== 3 ||
    parts.some(
      (part) => !Number.isFinite(part)
    )
  ) {
    return null;
  }

  const [
    previousYear,
    previousMonth,
    previousDay,
  ] = parts;

  const currentDate = new Date();

  const previousUtc = Date.UTC(
    previousYear,
    previousMonth - 1,
    previousDay
  );

  const currentUtc = Date.UTC(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate()
  );

  const millisecondsPerDay =
    24 * 60 * 60 * 1000;

  const difference = Math.floor(
    (currentUtc - previousUtc) /
      millisecondsPerDay
  );

  return Math.max(
    0,
    difference
  );
})();

/**
 * Uma única escrita por novo dia.
 *
 * Se o utilizador abrir novamente a CONFIA hoje,
 * não escrevemos novamente.
 */
if (isFirstAppOpenToday) {
  localStorage.setItem(
    STORAGE_KEYS.LAST_APP_OPEN_DATE,
    appOpenDate
  );
}

/* CONFIA 3A — FIM DO ESTADO DIÁRIO */

'''

updated = updated.replace(
    app_anchor,
    app_anchor + daily_state,
    1,
)


# ============================================================
# 8. ISOLAR EXATAMENTE O BLOCO NOVO
# ============================================================

block_start_marker = (
    "CONFIA 3A — ESTADO DIÁRIO"
)

block_end_marker = (
    "CONFIA 3A — FIM DO ESTADO DIÁRIO"
)

block_start = updated.find(
    block_start_marker
)

block_end = updated.find(
    block_end_marker,
    block_start
)

if (
    block_start == -1
    or block_end == -1
):
    fail(
        "Não consegui isolar exatamente "
        "o bloco 3A."
    )

block_end += len(
    block_end_marker
)

daily_block = updated[
    block_start:block_end
]


# ============================================================
# 9. VALIDAR CONTEÚDO DA 3A
# ============================================================

required_daily_markers = [
    "getLocalCalendarDate",
    "appOpenDate",
    "previousAppOpenDate",
    "isFirstAppOpenToday",
    "daysSincePreviousAppOpen",
    "STORAGE_KEYS.LAST_APP_OPEN_DATE",
    "localStorage.getItem",
    "localStorage.setItem",
    "Date.UTC",
    ".getFullYear()",
    ".getMonth()",
    ".getDate()",
    '.padStart(2, "0")',
]

for marker in required_daily_markers:
    if marker not in daily_block:
        fail(
            "Falta elemento obrigatório da 3A:\n\n"
            f"{marker}"
        )


# ============================================================
# 10. NÃO PERMITIR REACT STATE/EFFECT NO BLOCO NOVO
# ============================================================

for forbidden in [
    "useState(",
    "useEffect(",
]:
    if forbidden in daily_block:
        fail(
            "A camada 3A contém algo que "
            "não deveria conter:\n\n"
            f"{forbidden}"
        )


# ============================================================
# 11. NÃO PERMITIR TRABALHO CONTÍNUO
# ============================================================

for forbidden in [
    "setInterval(",
    "setTimeout(",
    "requestAnimationFrame",
    "addEventListener",
    "ResizeObserver",
    "MutationObserver",
    "fetch(",
]:
    if forbidden in daily_block:
        fail(
            "Operação não permitida na 3A:\n\n"
            f"{forbidden}"
        )


# ============================================================
# 12. UMA LEITURA + UMA ESCRITA NO BLOCO
# ============================================================

if (
    daily_block.count(
        "localStorage.getItem"
    ) != 1
):
    fail(
        "Esperava exatamente uma leitura "
        "de localStorage dentro da 3A."
    )

if (
    daily_block.count(
        "localStorage.setItem"
    ) != 1
):
    fail(
        "Esperava exatamente uma escrita "
        "de localStorage dentro da 3A."
    )


# ============================================================
# 13. GARANTIR QUE USAMOS DIA LOCAL
# ============================================================

if "toISOString" in daily_block:
    fail(
        "Foi encontrado toISOString na 3A.\n"
        "Queremos calendário local."
    )


# ============================================================
# 14. DELTAS GLOBAIS
#
# Esta é a correção principal da V2:
# verificamos que o ficheiro inteiro continua com exatamente
# a mesma quantidade de useState/useEffect.
# ============================================================

if (
    updated.count("useState(")
    != original_use_state_count
):
    fail(
        "A quantidade global de useState mudou."
    )

if (
    updated.count("useEffect(")
    != original_use_effect_count
):
    fail(
        "A quantidade global de useEffect mudou."
    )


# ============================================================
# 15. DELTA DE STORAGE
# ============================================================

if (
    updated.count("localStorage.getItem")
    != original_get_count + 1
):
    fail(
        "Esperava exatamente +1 "
        "localStorage.getItem."
    )

if (
    updated.count("localStorage.setItem")
    != original_set_count + 1
):
    fail(
        "Esperava exatamente +1 "
        "localStorage.setItem."
    )


# ============================================================
# 16. REACTIVE ENGINE NÃO PODE MUDAR
# ============================================================

if (
    updated.count("analyzeReactiveState")
    != original_reactive_analysis_count
):
    fail(
        "A quantidade de chamadas "
        "analyzeReactiveState mudou."
    )

if (
    updated.count("recordReactiveResponse")
    != original_reactive_record_count
):
    fail(
        "A quantidade de chamadas "
        "recordReactiveResponse mudou."
    )


# ============================================================
# 17. PRESERVAR ESTRUTURA EXISTENTE
# ============================================================

preserved_markers = [
    "const isFirstContact =",
    "const isEarlyLearning =",
    "const homeNowMemory =",
    "const handleHomeNowAction =",
    "const [reactiveMessageKey, setReactiveMessageKey]",
    "const [showDailyCheckIn, setShowDailyCheckIn]",
    "const [objectives, setObjectives]",
    "const [objectivesHistory, setObjectivesHistory]",
    "const [weeklyGoal, setWeeklyGoal]",
]

for marker in preserved_markers:
    if marker not in updated:
        fail(
            "Estrutura existente desapareceu:\n\n"
            f"{marker}"
        )


# ============================================================
# 18. IMPORTS DEVEM SER IDÊNTICOS
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
        "A Fase 3A não deveria alterar imports."
    )


# ============================================================
# 19. UMA ÚNICA NOVA STORAGE KEY
# ============================================================

if (
    updated.count(
        "confia_last_app_open_date_v1"
    ) != 1
):
    fail(
        "A nova chave deveria existir "
        "exatamente uma vez."
    )


# ============================================================
# 20. GARANTIR QUE O BLOCO FOI INSERIDO UMA VEZ
# ============================================================

if (
    updated.count(
        "CONFIA 3A — ESTADO DIÁRIO"
    ) != 1
):
    fail(
        "Marcador inicial da 3A duplicado."
    )

if (
    updated.count(
        "CONFIA 3A — FIM DO ESTADO DIÁRIO"
    ) != 1
):
    fail(
        "Marcador final da 3A duplicado."
    )


# ============================================================
# 21. SÓ AGORA FAZER BACKUP
# ============================================================

shutil.copy2(
    APP,
    BACKUP
)


# ============================================================
# 22. ESCREVER
# ============================================================

APP.write_text(
    updated,
    encoding="utf-8"
)


# ============================================================
# 23. VERIFICAÇÃO PÓS-ESCRITA
# ============================================================

written = APP.read_text(
    encoding="utf-8"
)

post_checks = [
    "LAST_APP_OPEN_DATE:",
    "'confia_last_app_open_date_v1'",
    "CONFIA 3A — ESTADO DIÁRIO",
    "CONFIA 3A — FIM DO ESTADO DIÁRIO",
    "const getLocalCalendarDate",
    "const appOpenDate",
    "const previousAppOpenDate",
    "const isFirstAppOpenToday",
    "const daysSincePreviousAppOpen",
    "STORAGE_KEYS.LAST_APP_OPEN_DATE",
]

missing_after_write = [
    marker
    for marker in post_checks
    if marker not in written
]

if missing_after_write:
    shutil.copy2(
        BACKUP,
        APP
    )

    print()
    print("=" * 78)
    print("ERRO PÓS-ESCRITA — ROLLBACK EXECUTADO")
    print("=" * 78)
    print()
    print(
        "Falharam verificações após escrita:"
    )

    for marker in missing_after_write:
        print(f"  ✗ {marker}")

    print()
    print(
        "App.tsx foi restaurado automaticamente "
        "a partir do backup."
    )
    print("=" * 78)
    sys.exit(1)


# ============================================================
# 24. RESULTADO
# ============================================================

print()
print("=" * 78)
print("CONFIA — FASE 3A V2 / ESTADO DIÁRIO")
print("=" * 78)
print()

print("✓ Data baseada no calendário local do dispositivo")
print("✓ Primeira abertura do dia detetável")
print("✓ Segunda abertura no mesmo dia detetável")
print("✓ Data da abertura anterior disponível nesta sessão")
print("✓ Dias desde a abertura anterior calculáveis")
print("✓ Apenas 1 nova chave de localStorage")
print("✓ Apenas +1 leitura de localStorage no arranque")
print("✓ No máximo 1 escrita adicional por novo dia")
print("✓ Nenhum novo useState")
print("✓ Nenhum novo useEffect")
print("✓ Nenhum timer")
print("✓ Nenhum listener")
print("✓ Nenhum requestAnimationFrame")
print("✓ Nenhuma dependência")
print("✓ Nenhuma alteração visual")
print("✓ Nenhum texto novo")
print("✓ Traduções intactas")
print("✓ Reactive Engine intacto")
print("✓ Memória recente intacta")
print("✓ Para ti agora intacto")
print("✓ Primeiro contacto intacto")
print("✓ Aprendizagem inicial intacta")
print("✓ Objetivos intactos")
print("✓ Impulso intacto")
print()
print("Backup:")
print(f"  {BACKUP}")
print()
print("PRÓXIMO PASSO:")
print("  npm run build")
print("=" * 78)
