from pathlib import Path
import shutil
import sys

# ============================================================
# CONFIA — FASE 3
# 3A — ESTADO DIÁRIO / PRIMEIRA ABERTURA DO DIA
#
# Objetivo:
#
# Criar a infraestrutura mínima que permite à CONFIA saber:
#
# - qual é a data local de hoje;
# - quando a app foi aberta anteriormente;
# - se esta é a primeira abertura de hoje;
# - quantos dias passaram desde a última abertura conhecida.
#
# IMPORTANTE:
#
# - uma única chave nova de localStorage;
# - uma única escrita por arranque da app;
# - sem useEffect adicional;
# - sem timers;
# - sem listeners;
# - sem dependências;
# - sem alterações visuais;
# - sem traduções;
# - sem tocar no Reactive Engine;
# - sem alterar ratings/check-ins/Impulso/Objetivos.
#
# ALTERA APENAS:
# src/App.tsx
#
# Backup:
# /tmp/App.tsx.before_fase3a_estado_diario
# ============================================================

ROOT = Path.cwd()

APP = ROOT / "src/App.tsx"

BACKUP = Path(
    "/tmp/App.tsx.before_fase3a_estado_diario"
)


def fail(message: str):
    print()
    print("=" * 78)
    print("ERRO — FASE 3A NÃO APLICADA")
    print("=" * 78)
    print()
    print(message)
    print()
    print("Nenhum ficheiro foi alterado.")
    print("=" * 78)
    sys.exit(1)


# ============================================================
# 1. VALIDAR APP
# ============================================================

if not APP.exists():
    fail(
        f"Não encontrei:\n{APP}"
    )

original = APP.read_text(
    encoding="utf-8"
)


# ============================================================
# 2. IMPEDIR DUPLICAÇÃO
# ============================================================

markers_3a = [
    "LAST_APP_OPEN_DATE",
    "confia_last_app_open_date_v1",
    "isFirstAppOpenToday",
    "previousAppOpenDate",
    "daysSincePreviousAppOpen",
    "CONFIA 3A — ESTADO DIÁRIO",
]

already_present = [
    marker
    for marker in markers_3a
    if marker in original
]

if already_present:
    fail(
        "A Fase 3A já parece estar total ou "
        "parcialmente aplicada:\n\n"
        + "\n".join(already_present)
    )


# ============================================================
# 3. VALIDAR STORAGE_KEYS
# ============================================================

storage_start = original.find(
    "const STORAGE_KEYS = {"
)

storage_end = original.find(
    "};",
    storage_start
)

if storage_start == -1 or storage_end == -1:
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
            "STORAGE_KEYS não corresponde à estrutura "
            "auditada.\n\n"
            f"Falta:\n{marker}"
        )


# ============================================================
# 4. ADICIONAR UMA ÚNICA CHAVE
# ============================================================

impulse_count_line = (
    "IMPULSE_COUNT: 'confia_impulse_count_v1',"
)

if original.count(impulse_count_line) != 1:
    fail(
        "Esperava encontrar exatamente uma vez:\n\n"
        f"{impulse_count_line}\n\n"
        f"Encontrados: "
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
# 5. LOCALIZAR INÍCIO DO APP
# ============================================================

app_anchor = (
    "export default function App() {\n"
    "const { t, i18n } = useTranslation();"
)

if updated.count(app_anchor) != 1:
    fail(
        "Não encontrei exatamente a âncora esperada "
        "no início de App()."
    )


# ============================================================
# 6. ESTADO DIÁRIO
#
# Usamos data LOCAL e não toISOString().
#
# Isto é importante:
# toISOString() usa UTC e poderia mudar de dia antes/depois
# da meia-noite local dependendo do fuso horário.
#
# A função cria YYYY-MM-DD com a data local do dispositivo.
# ============================================================

daily_state = r'''

/**
 * ==========================================================
 * CONFIA 3A — ESTADO DIÁRIO
 * ==========================================================
 *
 * Esta camada não tenta interpretar emoções nem escolher
 * respostas.
 *
 * Apenas responde a uma questão factual:
 *
 * "Esta é a primeira abertura da CONFIA neste dia local?"
 *
 * O Reactive Engine continua responsável pela interpretação
 * emocional.
 *
 * Existe apenas uma persistência nova:
 * LAST_APP_OPEN_DATE.
 *
 * A data anterior é mantida em memória durante esta sessão,
 * permitindo que as próximas fases distingam:
 *
 * - primeira abertura;
 * - nova abertura no mesmo dia;
 * - regresso após vários dias.
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

const daysSincePreviousAppOpen = (() => {
  if (!previousAppOpenDate) {
    return null;
  }

  const previousParts =
    previousAppOpenDate
      .split("-")
      .map(Number);

  if (
    previousParts.length !== 3 ||
    previousParts.some(
      (part) => !Number.isFinite(part)
    )
  ) {
    return null;
  }

  const [
    previousYear,
    previousMonth,
    previousDay,
  ] = previousParts;

  const previousUtc = Date.UTC(
    previousYear,
    previousMonth - 1,
    previousDay
  );

  const currentUtc = Date.UTC(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate()
  );

  const difference = Math.floor(
    (currentUtc - previousUtc) /
      86_400_000
  );

  return Math.max(0, difference);
})();

/*
 * Persistimos imediatamente a data desta abertura.
 *
 * Não é necessário um useEffect:
 * é uma única escrita síncrona e idempotente por arranque.
 */
if (isFirstAppOpenToday) {
  localStorage.setItem(
    STORAGE_KEYS.LAST_APP_OPEN_DATE,
    appOpenDate
  );
}

'''

updated = updated.replace(
    app_anchor,
    app_anchor + daily_state,
    1,
)


# ============================================================
# 7. AUDITAR BLOCO INSERIDO
# ============================================================

daily_start = updated.find(
    "CONFIA 3A — ESTADO DIÁRIO"
)

change_language_start = updated.find(
    "const changeAppLanguage",
    daily_start
)

if (
    daily_start == -1
    or change_language_start == -1
):
    fail(
        "Não consegui isolar a camada 3A "
        "depois da preparação."
    )

daily_block = updated[
    daily_start:change_language_start
]


required_daily = [
    "getLocalCalendarDate",
    "appOpenDate",
    "previousAppOpenDate",
    "isFirstAppOpenToday",
    "daysSincePreviousAppOpen",
    "STORAGE_KEYS.LAST_APP_OPEN_DATE",
    "localStorage.getItem",
    "localStorage.setItem",
    "Date.UTC",
]

for marker in required_daily:
    if marker not in daily_block:
        fail(
            "Falta elemento obrigatório da 3A:\n\n"
            f"{marker}"
        )


# ============================================================
# 8. GARANTIR QUE NÃO ADICIONÁMOS TRABALHO CONTÍNUO
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
            "Operação não permitida na camada diária:\n\n"
            f"{forbidden}"
        )


# ============================================================
# 9. GARANTIR UMA ÚNICA LEITURA E UMA ÚNICA ESCRITA
# ============================================================

if daily_block.count(
    "localStorage.getItem"
) != 1:
    fail(
        "A 3A deveria ter exatamente uma leitura "
        "de localStorage."
    )

if daily_block.count(
    "localStorage.setItem"
) != 1:
    fail(
        "A 3A deveria ter exatamente uma escrita "
        "de localStorage."
    )


# ============================================================
# 10. GARANTIR QUE NÃO FOI CRIADO NOVO REACT STATE/EFFECT
# ============================================================

if "useState(" in daily_block:
    fail(
        "A 3A não deve criar novo React state."
    )

if "useEffect(" in daily_block:
    fail(
        "A 3A não deve criar novo useEffect."
    )


# ============================================================
# 11. GARANTIR DATA LOCAL
# ============================================================

if "toISOString" in daily_block:
    fail(
        "A camada diária não deve usar toISOString(), "
        "porque precisamos do dia local do dispositivo."
    )

local_date_checks = [
    ".getFullYear()",
    ".getMonth()",
    ".getDate()",
    ".padStart(2, \"0\")",
]

for marker in local_date_checks:
    if marker not in daily_block:
        fail(
            "Construção da data local incompleta:\n"
            f"{marker}"
        )


# ============================================================
# 12. GARANTIR QUE NÃO TOCÁMOS NO REACTIVE ENGINE
# ============================================================

if (
    updated.count("analyzeReactiveState")
    != original.count("analyzeReactiveState")
):
    fail(
        "A quantidade de chamadas ao Reactive Engine mudou."
    )

if (
    updated.count("recordReactiveResponse")
    != original.count("recordReactiveResponse")
):
    fail(
        "A quantidade de registos reativos mudou."
    )


# ============================================================
# 13. GARANTIR QUE NÃO TOCÁMOS NAS FUNCIONALIDADES CENTRAIS
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
# 14. GARANTIR QUE IMPORTS NÃO MUDARAM
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
# 15. GARANTIR APENAS UMA NOVA STORAGE KEY
# ============================================================

if updated.count(
    "confia_last_app_open_date_v1"
) != 1:
    fail(
        "A nova chave deveria existir exatamente "
        "uma vez no código."
    )


# ============================================================
# 16. VERIFICAR DELTA DE STORAGE
# ============================================================

old_gets = original.count(
    "localStorage.getItem"
)

new_gets = updated.count(
    "localStorage.getItem"
)

old_sets = original.count(
    "localStorage.setItem"
)

new_sets = updated.count(
    "localStorage.setItem"
)

if new_gets != old_gets + 1:
    fail(
        "Esperava exatamente +1 leitura "
        "de localStorage."
    )

if new_sets != old_sets + 1:
    fail(
        "Esperava exatamente +1 escrita "
        "de localStorage."
    )


# ============================================================
# 17. BACKUP
# ============================================================

shutil.copy2(
    APP,
    BACKUP
)


# ============================================================
# 18. ESCREVER
# ============================================================

APP.write_text(
    updated,
    encoding="utf-8"
)


# ============================================================
# 19. VERIFICAÇÃO PÓS-ESCRITA
# ============================================================

written = APP.read_text(
    encoding="utf-8"
)

post_checks = [
    "LAST_APP_OPEN_DATE:",
    "'confia_last_app_open_date_v1'",
    "CONFIA 3A — ESTADO DIÁRIO",
    "const getLocalCalendarDate",
    "const appOpenDate",
    "const previousAppOpenDate",
    "const isFirstAppOpenToday",
    "const daysSincePreviousAppOpen",
    "STORAGE_KEYS.LAST_APP_OPEN_DATE",
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
            "Backup disponível em:\n"
            f"{BACKUP}"
        )
        print("=" * 78)
        sys.exit(1)


# ============================================================
# 20. RESULTADO
# ============================================================

print()
print("=" * 78)
print("CONFIA — FASE 3A / ESTADO DIÁRIO")
print("=" * 78)
print()

print("✓ Data diária baseada no horário local do dispositivo")
print("✓ Primeira abertura do dia detetável")
print("✓ Aberturas seguintes no mesmo dia detetáveis")
print("✓ Data da abertura anterior disponível na sessão")
print("✓ Dias desde a abertura anterior calculáveis")
print("✓ Apenas 1 nova chave de localStorage")
print("✓ Apenas 1 leitura adicional no arranque")
print("✓ No máximo 1 escrita adicional por dia")
print("✓ Sem novo React state")
print("✓ Sem novo useEffect")
print("✓ Sem timers")
print("✓ Sem listeners")
print("✓ Sem requestAnimationFrame")
print("✓ Sem novas dependências")
print("✓ Sem alterações visuais")
print("✓ Sem novos textos")
print("✓ Sem alterações de traduções")
print("✓ Reactive Engine preservado")
print("✓ Memória recente preservada")
print("✓ Para ti agora preservado")
print("✓ Primeiro contacto preservado")
print("✓ Aprendizagem inicial preservada")
print("✓ Objetivos preservados")
print("✓ Impulso preservado")
print()
print("Backup:")
print(f"  {BACKUP}")
print()
print("PRÓXIMO PASSO:")
print("  npm run build")
print("=" * 78)
