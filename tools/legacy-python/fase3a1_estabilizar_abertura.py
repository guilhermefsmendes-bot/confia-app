from pathlib import Path
import shutil
import sys

# ============================================================
# CONFIA — FASE 3A.1
# ESTABILIZAR O ESTADO DA ABERTURA DIÁRIA
#
# Problema:
#
# A 3A atual calcula:
#
# - appOpenDate
# - previousAppOpenDate
# - isFirstAppOpenToday
# - daysSincePreviousAppOpen
#
# diretamente no corpo do componente.
#
# Como a mesma 3A grava hoje no localStorage, um render
# posterior pode recalcular isFirstAppOpenToday como false
# ainda durante a mesma sessão.
#
# Solução:
#
# 1. Capturar um snapshot UMA VEZ por montagem através
#    de useState lazy.
#
# 2. Gravar a nova data depois do commit através de useEffect.
#
# Resultado:
#
# - primeira abertura permanece primeira abertura durante
#   toda a sessão;
# - rerenders não alteram o estado diário;
# - StrictMode não duplica a escrita;
# - sem novos timers/listeners/dependências;
# - nenhum texto/UI;
# - 3B e 3C continuam a consumir as mesmas variáveis.
#
# ALTERA APENAS:
# src/App.tsx
#
# Backup:
# /tmp/App.tsx.before_fase3a1_estabilizar_abertura
# ============================================================

ROOT = Path.cwd()

APP = ROOT / "src/App.tsx"

BACKUP = Path(
    "/tmp/App.tsx.before_fase3a1_estabilizar_abertura"
)


def fail(message: str):
    print()
    print("=" * 78)
    print("ERRO — FASE 3A.1 NÃO APLICADA")
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
# 2. VALIDAR ARQUITETURA EXISTENTE
# ============================================================

required = [
    "CONFIA 3A — ESTADO DIÁRIO",
    "CONFIA 3A — FIM DO ESTADO DIÁRIO",
    "LAST_APP_OPEN_DATE:",
    "confia_last_app_open_date_v1",
    "const appOpenDate",
    "const previousAppOpenDate",
    "const isFirstAppOpenToday",
    "const daysSincePreviousAppOpen",
    "CONFIA 3B — CONTEXTO DIÁRIO",
    "const dailyContext =",
    "CONFIA 3C.1 — MOMENTO DE HOJE",
]

missing = [
    marker
    for marker in required
    if marker not in original
]

if missing:
    fail(
        "A arquitetura atual não corresponde "
        "à versão esperada.\n\nFalta:\n"
        + "\n".join(missing)
    )


# ============================================================
# 3. IMPEDIR DUPLICAÇÃO
# ============================================================

if (
    "CONFIA 3A.1 — SNAPSHOT ESTÁVEL"
    in original
):
    fail(
        "A Fase 3A.1 já parece estar aplicada."
    )


# ============================================================
# 4. LOCALIZAR BLOCO 3A ATUAL
# ============================================================

start_marker = (
    "/**\n"
    " * ==========================================================\n"
    " * CONFIA 3A — ESTADO DIÁRIO"
)

end_marker = (
    "/* CONFIA 3A — FIM DO ESTADO DIÁRIO */"
)

start = original.find(
    start_marker
)

end = original.find(
    end_marker,
    start
)

if start == -1 or end == -1:
    fail(
        "Não consegui localizar exatamente "
        "o bloco da Fase 3A."
    )

end += len(
    end_marker
)

old_block = original[
    start:end
]


# ============================================================
# 5. VALIDAR O PROBLEMA QUE VAMOS CORRIGIR
# ============================================================

if (
    "localStorage.getItem("
    "STORAGE_KEYS.LAST_APP_OPEN_DATE"
    not in old_block.replace("\n", "").replace(" ", "")
):
    # Não usamos esta condição como única validação,
    # porque o formato pode estar quebrado em várias linhas.
    pass

required_old = [
    "const appOpenDate",
    "const previousAppOpenDate",
    "const isFirstAppOpenToday",
    "const daysSincePreviousAppOpen",
    "localStorage.getItem",
    "localStorage.setItem",
]

for marker in required_old:
    if marker not in old_block:
        fail(
            "O bloco 3A atual não tem a estrutura "
            "esperada:\n"
            f"{marker}"
        )


# ============================================================
# 6. CONTAGENS ANTES
# ============================================================

counts_before = {
    "useState":
        original.count("useState("),

    "useEffect":
        original.count("useEffect("),

    "getItem":
        original.count("localStorage.getItem"),

    "setItem":
        original.count("localStorage.setItem"),

    "setTimeout":
        original.count("setTimeout("),

    "setInterval":
        original.count("setInterval("),

    "requestAnimationFrame":
        original.count("requestAnimationFrame"),

    "addEventListener":
        original.count("addEventListener("),
}


# ============================================================
# 7. NOVO BLOCO
# ============================================================

new_block = r'''/**
 * ==========================================================
 * CONFIA 3A — ESTADO DIÁRIO
 * CONFIA 3A.1 — SNAPSHOT ESTÁVEL
 * ==========================================================
 *
 * O estado da abertura é capturado uma única vez por
 * montagem da app.
 *
 * Isto é importante porque a data atual é escrita no
 * localStorage depois da primeira renderização.
 *
 * Sem este snapshot, um rerender poderia transformar
 * "primeira abertura de hoje" em "já abriu hoje" durante
 * a própria sessão.
 */

const getLocalCalendarDate = () => {
  const now = new Date();

  const year =
    now.getFullYear();

  const month =
    String(now.getMonth() + 1).padStart(2, "0");

  const day =
    String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getCalendarDaysDifference = (
  previousDate: string | null,
  currentDate: string
) => {
  if (!previousDate) {
    return undefined;
  }

  const previousParts =
    previousDate.split("-").map(Number);

  const currentParts =
    currentDate.split("-").map(Number);

  if (
    previousParts.length !== 3 ||
    currentParts.length !== 3 ||
    previousParts.some(Number.isNaN) ||
    currentParts.some(Number.isNaN)
  ) {
    return undefined;
  }

  const previousUtc = Date.UTC(
    previousParts[0],
    previousParts[1] - 1,
    previousParts[2]
  );

  const currentUtc = Date.UTC(
    currentParts[0],
    currentParts[1] - 1,
    currentParts[2]
  );

  const dayMs =
    24 * 60 * 60 * 1000;

  return Math.max(
    0,
    Math.round(
      (currentUtc - previousUtc) / dayMs
    )
  );
};

const [dailyOpenState] = useState(() => {
  const appOpenDate =
    getLocalCalendarDate();

  const previousAppOpenDate =
    localStorage.getItem(
      STORAGE_KEYS.LAST_APP_OPEN_DATE
    );

  const isFirstAppOpenToday =
    previousAppOpenDate !== appOpenDate;

  const daysSincePreviousAppOpen =
    getCalendarDaysDifference(
      previousAppOpenDate,
      appOpenDate
    );

  return {
    appOpenDate,
    previousAppOpenDate,
    isFirstAppOpenToday,
    daysSincePreviousAppOpen,
  };
});

const {
  appOpenDate,
  previousAppOpenDate,
  isFirstAppOpenToday,
  daysSincePreviousAppOpen,
} = dailyOpenState;

/**
 * A escrita acontece depois do commit.
 *
 * O segundo getItem funciona como proteção adicional para:
 * - StrictMode;
 * - efeitos repetidos;
 * - escrita já efetuada por esta própria montagem.
 */
useEffect(() => {
  if (!isFirstAppOpenToday) {
    return;
  }

  const storedDate =
    localStorage.getItem(
      STORAGE_KEYS.LAST_APP_OPEN_DATE
    );

  if (storedDate === appOpenDate) {
    return;
  }

  localStorage.setItem(
    STORAGE_KEYS.LAST_APP_OPEN_DATE,
    appOpenDate
  );
}, [
  appOpenDate,
  isFirstAppOpenToday,
]);

/* CONFIA 3A — FIM DO ESTADO DIÁRIO */'''


# ============================================================
# 8. PREPARAR SUBSTITUIÇÃO
# ============================================================

updated = (
    original[:start]
    + new_block
    + original[end:]
)


# ============================================================
# 9. VALIDAR NOVO BLOCO
# ============================================================

required_new = [
    "CONFIA 3A.1 — SNAPSHOT ESTÁVEL",
    "const [dailyOpenState] = useState(() => {",
    "const appOpenDate =",
    "const previousAppOpenDate =",
    "const isFirstAppOpenToday =",
    "const daysSincePreviousAppOpen =",
    "} = dailyOpenState;",
    "useEffect(() => {",
    "storedDate === appOpenDate",
    "STORAGE_KEYS.LAST_APP_OPEN_DATE",
]

for marker in required_new:
    if marker not in new_block:
        fail(
            "Novo bloco incompleto:\n"
            f"{marker}"
        )


# ============================================================
# 10. GARANTIR AUSÊNCIA DE ESCRITA NO RENDER
#
# No novo bloco, setItem só pode existir depois
# do início do useEffect.
# ============================================================

effect_position = new_block.find(
    "useEffect(() => {"
)

set_position = new_block.find(
    "localStorage.setItem("
)

if (
    effect_position == -1
    or set_position == -1
    or set_position < effect_position
):
    fail(
        "A escrita de LAST_APP_OPEN_DATE "
        "continua a acontecer antes do efeito."
    )


# ============================================================
# 11. DELTAS ESPERADOS
#
# +1 useState
# +1 useEffect
#
# A leitura cresce em +1:
# - snapshot: 1 leitura
# - effect guard: 1 leitura
#
# A implementação anterior já tinha 1 leitura.
#
# Portanto delta getItem = +1.
#
# setItem mantém-se igual.
# ============================================================

counts_after = {
    "useState":
        updated.count("useState("),

    "useEffect":
        updated.count("useEffect("),

    "getItem":
        updated.count("localStorage.getItem"),

    "setItem":
        updated.count("localStorage.setItem"),

    "setTimeout":
        updated.count("setTimeout("),

    "setInterval":
        updated.count("setInterval("),

    "requestAnimationFrame":
        updated.count("requestAnimationFrame"),

    "addEventListener":
        updated.count("addEventListener("),
}

expected_deltas = {
    "useState": 1,
    "useEffect": 1,
    "getItem": 1,
    "setItem": 0,
    "setTimeout": 0,
    "setInterval": 0,
    "requestAnimationFrame": 0,
    "addEventListener": 0,
}

for key, expected_delta in expected_deltas.items():
    actual_delta = (
        counts_after[key]
        - counts_before[key]
    )

    if actual_delta != expected_delta:
        fail(
            f"Delta inesperado em {key}.\n\n"
            f"Esperado: {expected_delta:+d}\n"
            f"Obtido: {actual_delta:+d}"
        )


# ============================================================
# 12. PRESERVAR 3B E 3C
# ============================================================

preserved = [
    "CONFIA 3B — CONTEXTO DIÁRIO",
    "const dailyContext =",
    "dailyContext.state",
    "CONFIA 3C.1 — MOMENTO DE HOJE",
    "dailyMoment.",
    "homeNowMemory",
    "homeNowAction",
    "homeNowContext",
]

for marker in preserved:
    if marker not in updated:
        fail(
            "Estrutura existente desapareceu:\n"
            f"{marker}"
        )


# ============================================================
# 13. GARANTIR SEM NOVOS RECURSOS
# ============================================================

for forbidden in [
    "setInterval(",
    "requestAnimationFrame",
    "ResizeObserver",
    "MutationObserver",
    "fetch(",
]:
    if forbidden in new_block:
        fail(
            "A 3A.1 introduziu operação proibida:\n"
            f"{forbidden}"
        )


# ============================================================
# 14. IMPORTS INTACTOS
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
        "A 3A.1 não deveria alterar imports."
    )


# ============================================================
# 15. BACKUP
# ============================================================

shutil.copy2(
    APP,
    BACKUP
)


# ============================================================
# 16. ESCREVER
# ============================================================

APP.write_text(
    updated,
    encoding="utf-8"
)


# ============================================================
# 17. VERIFICAÇÃO PÓS-ESCRITA
# ============================================================

written = APP.read_text(
    encoding="utf-8"
)

post_required = [
    "CONFIA 3A.1 — SNAPSHOT ESTÁVEL",
    "const [dailyOpenState] = useState(() => {",
    "} = dailyOpenState;",
    "storedDate === appOpenDate",
    "CONFIA 3B — CONTEXTO DIÁRIO",
    "CONFIA 3C.1 — MOMENTO DE HOJE",
]

missing_post = [
    marker
    for marker in post_required
    if marker not in written
]

if missing_post:
    shutil.copy2(
        BACKUP,
        APP
    )

    print()
    print("=" * 78)
    print("ERRO PÓS-ESCRITA — ROLLBACK EXECUTADO")
    print("=" * 78)
    print()

    for marker in missing_post:
        print(f"✗ {marker}")

    print()
    print("App.tsx restaurado automaticamente.")
    print("=" * 78)

    sys.exit(1)


# ============================================================
# 18. RESULTADO
# ============================================================

print()
print("=" * 78)
print("CONFIA — FASE 3A.1 / SNAPSHOT DIÁRIO ESTÁVEL")
print("=" * 78)
print()

print("✓ Estado diário capturado uma vez por montagem")
print("✓ Primeira abertura permanece estável na sessão")
print("✓ Rerenders deixam de alterar o estado diário")
print("✓ Escrita removida do render")
print("✓ Escrita passa a ocorrer depois do commit")
print("✓ Proteção contra escrita duplicada")
print("✓ StrictMode protegido")
print("✓ Datas continuam baseadas no calendário local")
print("✓ daysSincePreviousAppOpen preservado")
print("✓ Mesmos nomes públicos usados pela 3B")
print("✓ Fase 3B preservada")
print("✓ Fase 3C.1 preservada")
print("✓ +1 useState apenas")
print("✓ +1 useEffect apenas")
print("✓ Nenhum timer")
print("✓ Nenhum listener")
print("✓ Nenhum requestAnimationFrame")
print("✓ Nenhuma dependência")
print("✓ Nenhum texto novo")
print("✓ Nenhuma alteração visual")
print()
print("Backup:")
print(f"  {BACKUP}")
print()
print("PRÓXIMO PASSO:")
print("  npm run build")
print("=" * 78)
