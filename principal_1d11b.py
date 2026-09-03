from pathlib import Path
import json
import shutil
import sys


APP_FILE = Path("src/App.tsx")

LOCALE_FILES = {
    "pt": Path("src/locales/pt.json"),
    "en": Path("src/locales/en.json"),
    "es": Path("src/locales/es.json"),
    "fr": Path("src/locales/fr.json"),
}

APP_BACKUP = Path("/tmp/App.tsx.before_1d11b")

LOCALE_BACKUPS = {
    lang: Path(f"/tmp/{lang}.json.before_1d11b")
    for lang in LOCALE_FILES
}


def fail(message):
    print(f"ERRO: {message}")
    sys.exit(1)


def replace_once(text, old, new, label):
    count = text.count(old)

    if count != 1:
        fail(
            f"{label}: esperava 1 ocorrência, "
            f"encontrei {count}."
        )

    return text.replace(old, new, 1)


print("=" * 72)
print("CONFIA — PRINCIPAL VIVO — 1D.11B")
print("PRIMEIROS SINAIS — APRENDIZAGEM INICIAL")
print("=" * 72)


# ============================================================
# 1. VALIDAR FICHEIROS
# ============================================================

if not APP_FILE.exists():
    fail("src/App.tsx não encontrado.")

for lang, path in LOCALE_FILES.items():
    if not path.exists():
        fail(f"Locale não encontrado: {path}")


# ============================================================
# 2. CARREGAR TUDO — SEM ESCREVER
# ============================================================

app_original = APP_FILE.read_text(encoding="utf-8")
app = app_original

locale_original_text = {}
locale_data = {}

for lang, path in LOCALE_FILES.items():
    text = path.read_text(encoding="utf-8")
    locale_original_text[lang] = text

    try:
        locale_data[lang] = json.loads(text)
    except json.JSONDecodeError as exc:
        fail(
            f"{path} contém JSON inválido antes da alteração: "
            f"{exc}"
        )


# ============================================================
# 3. VALIDAR QUE 1D.11A EXISTE
# ============================================================

required_markers = [
    "const isFirstContact =",
    "ratings.length === 0;",
    "{isFirstContact && (",
    't("firstContactInsight.eyebrow")',
    't("firstContactInsight.title")',
    't("firstContactInsight.text")',
    "{reactiveMessageKey && (",
    't("reactiveInsightTitle")',
    "<HomeWorld",
    "<HomeProgressSummary",
    "const homeNowMemory = (() => {",
    "const homeNowAction = (() => {",
]

for marker in required_markers:
    if marker not in app_original:
        fail(
            f"Marcador obrigatório não encontrado: {marker}"
        )


if "const isEarlyLearning =" in app_original:
    fail(
        "A 1D.11B parece já estar aplicada."
    )


for lang, data in locale_data.items():
    if "earlyLearningInsight" in data:
        fail(
            f"{lang}.json já contém earlyLearningInsight."
        )


# ============================================================
# 4. ESTADO DERIVADO — PRIMEIROS SINAIS
#
# Não criamos storage.
# Não criamos useState.
#
# 1 ou 2 ratings:
# existe informação real, mas ainda é cedo para comunicar
# padrões ou uma relação histórica consolidada.
# ============================================================

old_state = '''const isFirstContact =
  currentTab === 0 &&
  homeScreen === "home" &&
  ratings.length === 0;

const homeNowMemory = (() => {'''

new_state = '''const isFirstContact =
  currentTab === 0 &&
  homeScreen === "home" &&
  ratings.length === 0;

/**
 * 1D.11B — PRIMEIROS SINAIS
 *
 * Com um ou dois registos já existe informação real,
 * mas ainda não existe histórico suficiente para comunicar
 * a experiência como se a CONFIA já conhecesse padrões
 * consolidados do utilizador.
 *
 * Esta camada é apenas de apresentação.
 * O Reactive Engine continua a decidir a resposta.
 */
const isEarlyLearning =
  currentTab === 0 &&
  homeScreen === "home" &&
  ratings.length >= 1 &&
  ratings.length <= 2;

const homeNowMemory = (() => {'''

app = replace_once(
    app,
    old_state,
    new_state,
    "estado derivado dos primeiros sinais",
)


# ============================================================
# 5. EYEBROW DO INSIGHT
#
# Mantemos a resposta do Reactive Engine.
# Apenas mudamos o enquadramento durante 1–2 registos.
# ============================================================

old_eyebrow = '''{t("reactiveInsightTitle")}'''

new_eyebrow = '''{isEarlyLearning
            ? t("earlyLearningInsight.eyebrow")
            : t("reactiveInsightTitle")}'''

app = replace_once(
    app,
    old_eyebrow,
    new_eyebrow,
    "eyebrow do insight reativo",
)


# ============================================================
# 6. TEXTO DE CONTEXTO INICIAL
#
# Surge antes da resposta reativa real.
#
# Não substitui nem modifica a mensagem escolhida pelo motor.
# ============================================================

old_message = '''<p className="mt-1.5 text-sm font-semibold leading-relaxed text-[#4E3B36]">
          {t(reactiveMessageKey)}
        </p>'''

new_message = '''{isEarlyLearning && (
          <p className="mt-1.5 text-[11px] font-semibold leading-relaxed text-[#8A6A5D]">
            {t("earlyLearningInsight.text")}
          </p>
        )}

        <p
          className={`font-semibold leading-relaxed text-[#4E3B36] ${
            isEarlyLearning
              ? "mt-2 text-sm"
              : "mt-1.5 text-sm"
          }`}
        >
          {t(reactiveMessageKey)}
        </p>'''

app = replace_once(
    app,
    old_message,
    new_message,
    "contexto dos primeiros sinais",
)


# ============================================================
# 7. TRADUÇÕES
#
# Linguagem deliberadamente prudente:
# - existem sinais reais;
# - ainda estamos a reunir contexto;
# - não falamos em padrões.
# ============================================================

translations = {
    "pt": {
        "eyebrow": "A CONFIA está a aprender",
        "text": (
            "Já comecei a receber alguns sinais teus. "
            "Ainda estou a reunir contexto para compreender "
            "melhor o que se repete e o que muda."
        ),
    },

    "en": {
        "eyebrow": "CONFIA is learning",
        "text": (
            "I'm starting to receive some signals from you. "
            "I'm still building context to better understand "
            "what repeats and what changes."
        ),
    },

    "es": {
        "eyebrow": "CONFIA está aprendiendo",
        "text": (
            "Ya estoy empezando a recibir algunas señales tuyas. "
            "Todavía estoy reuniendo contexto para comprender "
            "mejor qué se repite y qué cambia."
        ),
    },

    "fr": {
        "eyebrow": "CONFIA apprend à te connaître",
        "text": (
            "Je commence déjà à recevoir quelques signaux de ta part. "
            "Je rassemble encore du contexte pour mieux comprendre "
            "ce qui se répète et ce qui change."
        ),
    },
}


for lang, values in translations.items():
    locale_data[lang]["earlyLearningInsight"] = values


# ============================================================
# 8. VALIDAR TRADUÇÕES
# ============================================================

for lang, data in locale_data.items():
    block = data.get("earlyLearningInsight")

    if not isinstance(block, dict):
        fail(
            f"earlyLearningInsight inválido em {lang}."
        )

    expected_keys = {
        "eyebrow",
        "text",
    }

    if set(block.keys()) != expected_keys:
        fail(
            f"Estrutura inesperada em "
            f"{lang}.earlyLearningInsight."
        )

    for key in expected_keys:
        value = block.get(key)

        if not isinstance(value, str) or not value.strip():
            fail(
                f"Tradução inválida: "
                f"{lang}.earlyLearningInsight.{key}"
            )


# ============================================================
# 9. GUARDRAILS — REACTIVE ENGINE
#
# Nada na decisão pode mudar.
# ============================================================

engine_markers = [
    "analyzeReactiveState",
    "recordReactiveResponse",
    "collectReactiveRecentMemory",
    "setReactiveMessageKey",
    "const homeNowMemory = (() => {",
    "const homeNowAction = (() => {",
    "const homeNowContext = (() => {",
    "const handleHomeNowAction = () => {",
    'source: "general"',
    'source: "mood"',
]

for marker in engine_markers:
    before = app_original.count(marker)
    after = app.count(marker)

    if before != after:
        fail(
            f"Motor reativo alterado: {marker} "
            f"({before} → {after})"
        )


# ============================================================
# 10. GUARDRAIL — reactiveMessageKey
#
# A mensagem real continua exatamente a mesma:
# {t(reactiveMessageKey)}
# ============================================================

before_key = app_original.count(
    "reactiveMessageKey"
)

after_key = app.count(
    "reactiveMessageKey"
)

if before_key != after_key:
    fail(
        "Número de referências a reactiveMessageKey mudou: "
        f"{before_key} → {after_key}"
    )


if app.count("{t(reactiveMessageKey)}") != 1:
    fail(
        "A resposta reativa visível deixou de existir "
        "exatamente uma vez."
    )


# ============================================================
# 11. GUARDRAILS — 1D.11A
# ============================================================

first_contact_markers = [
    "const isFirstContact =",
    "ratings.length === 0;",
    "{isFirstContact && (",
    't("firstContactInsight.eyebrow")',
    't("firstContactInsight.title")',
    't("firstContactInsight.text")',
]

for marker in first_contact_markers:
    before = app_original.count(marker)
    after = app.count(marker)

    if before != after:
        fail(
            f"1D.11A alterada: {marker} "
            f"({before} → {after})"
        )


# ============================================================
# 12. GUARDRAILS — RATINGS
#
# Apenas adicionamos leituras:
# ratings.length >= 1
# ratings.length <= 2
#
# Nunca alteramos setters, save ou storage.
# ============================================================

rating_logic_markers = [
    "setRatings",
    "STORAGE_KEYS.RATINGS",
    "handleSaveRatings",
    "setMorningRating",
    "setAfternoonRating",
    "todayLogged",
]

for marker in rating_logic_markers:
    before = app_original.count(marker)
    after = app.count(marker)

    if before != after:
        fail(
            f"Lógica de ratings alterada: {marker} "
            f"({before} → {after})"
        )


# ============================================================
# 13. GUARDRAILS — PRINCIPAL PREMIUM
# ============================================================

principal_markers = [
    "<HomeWorld",
    "<HomeProgressSummary",
    'id="home-daily-record"',
    "O teu espaço — navegação secundária premium",
    'setHomeScreen("companion")',
    'setHomeScreen("patterns")',
    'setHomeScreen("inventory")',
    'setHomeScreen("shop")',
    'setHomeScreen("settings")',
]

for marker in principal_markers:
    before = app_original.count(marker)
    after = app.count(marker)

    if before != after:
        fail(
            f"Área já concluída alterada: {marker} "
            f"({before} → {after})"
        )


# ============================================================
# 14. SEM STORAGE / LISTENERS NOVOS
# ============================================================

side_effect_markers = [
    "localStorage.setItem(",
    "localStorage.removeItem(",
    "addEventListener(",
    "onSnapshot(",
]

for marker in side_effect_markers:
    before = app_original.count(marker)
    after = app.count(marker)

    if before != after:
        fail(
            f"Efeito inesperado: {marker} "
            f"({before} → {after})"
        )


# ============================================================
# 15. VALIDAR CONTRATO 1D.11B
# ============================================================

contract_markers = [
    "const isEarlyLearning =",
    "ratings.length >= 1 &&",
    "ratings.length <= 2;",
    't("earlyLearningInsight.eyebrow")',
    't("earlyLearningInsight.text")',
    "{isEarlyLearning && (",
    "{t(reactiveMessageKey)}",
]

for marker in contract_markers:
    if marker not in app:
        fail(
            f"Contrato 1D.11B incompleto: {marker}"
        )


if app.count("const isEarlyLearning =") != 1:
    fail(
        "isEarlyLearning deveria existir exatamente uma vez."
    )


if app.count(
    't("earlyLearningInsight.eyebrow")'
) != 1:
    fail(
        "earlyLearningInsight.eyebrow deveria "
        "aparecer exatamente uma vez."
    )


if app.count(
    't("earlyLearningInsight.text")'
) != 1:
    fail(
        "earlyLearningInsight.text deveria "
        "aparecer exatamente uma vez."
    )


# ============================================================
# 16. GARANTIR QUE A 1D.11B NÃO CRIOU NOVO useState
# ============================================================

use_state_before = app_original.count(
    "useState("
)

use_state_after = app.count(
    "useState("
)

if use_state_before != use_state_after:
    fail(
        "Foi criado/removido useState inesperadamente: "
        f"{use_state_before} → {use_state_after}"
    )


# ============================================================
# 17. GARANTIR ALTERAÇÕES REAIS
# ============================================================

if app == app_original:
    fail(
        "App.tsx não sofreu alterações."
    )


# ============================================================
# 18. VALIDAR QUE LOCALES SÓ GANHAM A NOVA CHAVE
# ============================================================

for lang in LOCALE_FILES:
    original_data = json.loads(
        locale_original_text[lang]
    )

    new_data = locale_data[lang]

    test_new = dict(new_data)

    added = test_new.pop(
        "earlyLearningInsight",
        None,
    )

    if added != translations[lang]:
        fail(
            f"Conteúdo inesperado em "
            f"{lang}.earlyLearningInsight."
        )

    if test_new != original_data:
        fail(
            f"{lang}.json teve alterações para além "
            "de earlyLearningInsight."
        )


# ============================================================
# 19. SERIALIZAR LOCALES EM MEMÓRIA
# ============================================================

locale_new_text = {}

for lang, data in locale_data.items():
    locale_new_text[lang] = (
        json.dumps(
            data,
            ensure_ascii=False,
            indent=2,
        )
        + "\n"
    )

    try:
        parsed = json.loads(
            locale_new_text[lang]
        )
    except json.JSONDecodeError as exc:
        fail(
            f"JSON final inválido em {lang}: {exc}"
        )

    if (
        parsed.get("earlyLearningInsight")
        != translations[lang]
    ):
        fail(
            f"Tradução final inválida em {lang}."
        )


# ============================================================
# 20. BACKUPS
#
# Só escrevemos depois de todas as validações.
# ============================================================

shutil.copy2(
    APP_FILE,
    APP_BACKUP,
)

for lang, path in LOCALE_FILES.items():
    shutil.copy2(
        path,
        LOCALE_BACKUPS[lang],
    )


# ============================================================
# 21. WRITE
# ============================================================

APP_FILE.write_text(
    app,
    encoding="utf-8",
)

for lang, path in LOCALE_FILES.items():
    path.write_text(
        locale_new_text[lang],
        encoding="utf-8",
    )


# ============================================================
# 22. VALIDAÇÃO PÓS-WRITE
# ============================================================

written_app = APP_FILE.read_text(
    encoding="utf-8"
)

if written_app != app:
    fail(
        "Validação pós-write do App.tsx falhou."
    )


for lang, path in LOCALE_FILES.items():
    try:
        written_locale = json.loads(
            path.read_text(encoding="utf-8")
        )
    except json.JSONDecodeError as exc:
        fail(
            f"JSON inválido após write em "
            f"{lang}: {exc}"
        )

    if (
        written_locale.get("earlyLearningInsight")
        != translations[lang]
    ):
        fail(
            f"Tradução pós-write incorreta: {lang}"
        )


# ============================================================
# 23. RESULTADO
# ============================================================

print("✓ 0 registos continuam reservados ao primeiro contacto")
print("✓ 1–2 registos ativam aprendizagem inicial")
print("✓ 3+ registos regressam à linguagem reativa normal")
print("✓ Resposta real do Reactive Engine preservada")
print("✓ Nenhum padrão artificial é comunicado")
print("✓ Nenhuma memória artificial")
print("✓ Nenhum estado React novo")
print("✓ Nenhum storage novo")
print("✓ Nenhuma decisão do motor alterada")
print("✓ homeNowAction preservado")
print("✓ homeNowMemory preservado")
print("✓ homeNowContext preservado")
print("✓ HomeWorld preservado")
print("✓ Hoje/Registar preservado")
print("✓ O teu espaço preservado")
print("✓ PT atualizado")
print("✓ EN atualizado")
print("✓ ES atualizado")
print("✓ FR atualizado")
print("✓ JSON dos 4 idiomas validado")
print("✓ Nenhuma dependência nova")
print()
print("Progressão inicial:")
print("  0 registos")
print("      ↓")
print("  A CONFIA COMEÇA AQUI")
print()
print("  1–2 registos")
print("      ↓")
print("  A CONFIA ESTÁ A APRENDER")
print("      +")
print("  resposta real do motor")
print()
print("  3+ registos")
print("      ↓")
print("  A CONFIA PERCEBEU")
print("      +")
print("  memória/continuidade quando existe")
print()
print(f"✓ Backup App: {APP_BACKUP}")

for lang in LOCALE_FILES:
    print(
        f"✓ Backup {lang.upper()}: "
        f"{LOCALE_BACKUPS[lang]}"
    )

print("=" * 72)
print("OK — 1D.11B APLICADA")
print("=" * 72)
