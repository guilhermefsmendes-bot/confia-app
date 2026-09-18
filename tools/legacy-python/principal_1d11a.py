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

APP_BACKUP = Path("/tmp/App.tsx.before_1d11a")

LOCALE_BACKUPS = {
    lang: Path(f"/tmp/{lang}.json.before_1d11a")
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
print("CONFIA — PRINCIPAL VIVO — 1D.11A")
print("PRIMEIRO CONTACTO INTELIGENTE")
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
            f"{path} contém JSON inválido antes "
            f"da alteração: {exc}"
        )


# ============================================================
# 3. VALIDAR ESTADO ORIGINAL
# ============================================================

required_markers = [
    "const [ratings, setRatings]",
    "const homeNowMemory = (() => {",
    "const homeNowAction = (() => {",
    "const [reactiveMessageKey, setReactiveMessageKey]",
    "if (ratings.length === 0)",
    "{reactiveMessageKey && (",
    '{homeScreen === "home" && homeNowAction && (',
    "<HomeWorld",
    "<HomeProgressSummary",
]

for marker in required_markers:
    if marker not in app_original:
        fail(
            f"Marcador obrigatório não encontrado: {marker}"
        )


# Impedir dupla aplicação.
if "const isFirstContact =" in app_original:
    fail(
        "A 1D.11A parece já estar aplicada no App.tsx."
    )

for lang, data in locale_data.items():
    if "firstContactInsight" in data:
        fail(
            f"{lang}.json já contém firstContactInsight."
        )


# ============================================================
# 4. ESTADO DERIVADO DE PRIMEIRO CONTACTO
#
# Sem estado React novo.
# Sem storage novo.
#
# ratings.length === 0 já representa verdadeiramente
# ausência de histórico emocional registado.
# ============================================================

anchor = '''const homeNowMemory = (() => {'''

replacement = '''/**
 * 1D.11A — PRIMEIRO CONTACTO INTELIGENTE
 *
 * A ausência de ratings significa que a CONFIA ainda está
 * no início da relação com o utilizador.
 *
 * Não fingimos memória, padrões ou conhecimento que ainda
 * não existem. Este valor é totalmente derivado do histórico
 * real já existente e não cria storage adicional.
 */
const isFirstContact =
  currentTab === 0 &&
  homeScreen === "home" &&
  ratings.length === 0;

const homeNowMemory = (() => {'''

app = replace_once(
    app,
    anchor,
    replacement,
    "estado de primeiro contacto",
)


# ============================================================
# 5. PRIMEIRO CONTACTO VISÍVEL
#
# Surge no lugar conceptual de "A CONFIA percebeu".
#
# Assim que existir pelo menos um rating:
# - isFirstContact passa a false;
# - este cartão desaparece;
# - o sistema reativo existente assume o controlo.
# ============================================================

reactive_anchor = '''{reactiveMessageKey && (
  <div
    className={`mt-4 rounded-[28px] border border-[#E5A88B]/25 bg-gradient-to-br from-[#FFF9F5] to-white p-5 shadow-sm ${
      homeNowAction ? "rounded-b-[22px]" : ""
    }`}
  >'''

first_contact_block = '''{isFirstContact && (
  <section
    className={`relative mt-4 overflow-hidden rounded-[28px] border border-[#E5A88B]/25 bg-gradient-to-br from-[#FFF9F5] via-white to-[#FFFDFC] p-5 shadow-[0_10px_28px_rgba(92,64,52,0.05)] ${
      homeNowAction ? "rounded-b-[22px]" : ""
    }`}
    aria-label={t("firstContactInsight.eyebrow")}
  >
    <div
      aria-hidden="true"
      className="absolute left-0 top-6 h-12 w-[3px] rounded-r-full bg-[#E5A88B]/55"
    />

    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#E5A88B]/15 bg-white shadow-sm">
        <Sparkles
          size={18}
          strokeWidth={1.8}
          className="text-[#C97B5E]"
        />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-wider text-[#C97B5E] font-display">
          {t("firstContactInsight.eyebrow")}
        </p>

        <h3 className="mt-1.5 text-sm font-black leading-snug text-[#4E3B36]">
          {t("firstContactInsight.title")}
        </h3>

        <p className="mt-1.5 text-[11px] font-semibold leading-relaxed text-slate-500">
          {t("firstContactInsight.text")}
        </p>
      </div>
    </div>
  </section>
)}

{reactiveMessageKey && (
  <div
    className={`mt-4 rounded-[28px] border border-[#E5A88B]/25 bg-gradient-to-br from-[#FFF9F5] to-white p-5 shadow-sm ${
      homeNowAction ? "rounded-b-[22px]" : ""
    }`}
  >'''

app = replace_once(
    app,
    reactive_anchor,
    first_contact_block,
    "bloco visual de primeiro contacto",
)


# ============================================================
# 6. RELAÇÃO VISUAL
# PRIMEIRO CONTACTO → PARA TI AGORA
#
# Reutiliza exatamente a linguagem visual criada na 1D.10B.
# ============================================================

app = replace_once(
    app,
    '''<div className={reactiveMessageKey ? "-mt-2 pt-2" : ""}>
    {reactiveMessageKey && (
      <div
        aria-hidden="true"
        className="mx-auto h-5 w-px bg-gradient-to-b from-[#E5A88B]/45 to-[#E5A88B]/10"
      />
    )}''',
    '''<div className={reactiveMessageKey || isFirstContact ? "-mt-2 pt-2" : ""}>
    {(reactiveMessageKey || isFirstContact) && (
      <div
        aria-hidden="true"
        className="mx-auto h-5 w-px bg-gradient-to-b from-[#E5A88B]/45 to-[#E5A88B]/10"
      />
    )}''',
    "ligação insight → ação",
)


app = replace_once(
    app,
    '''reactiveMessageKey ? "relative overflow-hidden" : ""''',
    '''reactiveMessageKey || isFirstContact ? "relative overflow-hidden" : ""''',
    "superfície ligada da ação",
)


app = replace_once(
    app,
    '''{reactiveMessageKey && (
        <div
          aria-hidden="true"
          className="absolute left-0 top-6 h-12 w-[3px] rounded-r-full bg-[#E5A88B]/55"
        />
      )}''',
    '''{(reactiveMessageKey || isFirstContact) && (
        <div
          aria-hidden="true"
          className="absolute left-0 top-6 h-12 w-[3px] rounded-r-full bg-[#E5A88B]/55"
        />
      )}''',
    "acento visual da ação",
)


# ============================================================
# 7. TRADUÇÕES
#
# Princípio:
# a CONFIA diz que está a começar a conhecer,
# não que já conhece.
# ============================================================

translations = {
    "pt": {
        "eyebrow": "A CONFIA começa aqui",
        "title": "Vamos começar por te conhecer",
        "text": (
            "Cada registo ajuda a CONFIA a perceber melhor "
            "como tens estado. Com o tempo, aquilo que vês "
            "aqui torna-se mais pessoal."
        ),
    },

    "en": {
        "eyebrow": "CONFIA starts here",
        "title": "Let's start by getting to know you",
        "text": (
            "Each check-in helps CONFIA understand how you've "
            "been feeling. Over time, what you see here becomes "
            "more personal."
        ),
    },

    "es": {
        "eyebrow": "CONFIA empieza aquí",
        "title": "Empecemos por conocerte",
        "text": (
            "Cada registro ayuda a CONFIA a entender mejor "
            "cómo te has sentido. Con el tiempo, lo que ves "
            "aquí se vuelve más personal."
        ),
    },

    "fr": {
        "eyebrow": "CONFIA commence ici",
        "title": "Commençons par mieux te connaître",
        "text": (
            "Chaque enregistrement aide CONFIA à mieux comprendre "
            "comment tu te sens. Avec le temps, ce que tu vois ici "
            "devient plus personnel."
        ),
    },
}


for lang, values in translations.items():
    locale_data[lang]["firstContactInsight"] = values


# ============================================================
# 8. VALIDAR TRADUÇÕES EM MEMÓRIA
# ============================================================

for lang, data in locale_data.items():
    block = data.get("firstContactInsight")

    if not isinstance(block, dict):
        fail(
            f"firstContactInsight inválido em {lang}."
        )

    expected_keys = {
        "eyebrow",
        "title",
        "text",
    }

    if set(block.keys()) != expected_keys:
        fail(
            f"Estrutura inesperada em "
            f"{lang}.firstContactInsight."
        )

    for key in expected_keys:
        value = block.get(key)

        if not isinstance(value, str):
            fail(
                f"Tradução inválida: "
                f"{lang}.firstContactInsight.{key}"
            )

        if not value.strip():
            fail(
                f"Tradução vazia: "
                f"{lang}.firstContactInsight.{key}"
            )


# ============================================================
# 9. GUARDRAILS — RATINGS
#
# A única utilização nova de ratings é a leitura
# ratings.length === 0.
#
# Nenhum setter / storage / lógica de gravação muda.
# ============================================================

ratings_exact_markers = [
    "setRatings",
    "STORAGE_KEYS.RATINGS",
    "handleSaveRatings",
    "setMorningRating",
    "setAfternoonRating",
    "todayLogged",
]

for marker in ratings_exact_markers:
    before = app_original.count(marker)
    after = app.count(marker)

    if before != after:
        fail(
            f"Lógica de ratings alterada: {marker} "
            f"({before} → {after})"
        )


# A referência literal a ratings cresce apenas devido
# ao novo estado derivado. Não usamos um count genérico,
# porque isso seria demasiado frágil.
if "ratings.length === 0;" not in app:
    fail(
        "O primeiro contacto deixou de depender "
        "de ratings.length === 0."
    )


# ============================================================
# 10. GUARDRAILS — MOTOR REATIVO
#
# homeNowAction ganha exatamente UMA referência visual:
# o cartão inicial usa-a para saber se deve arredondar
# visualmente a parte inferior.
#
# Isso NÃO altera decisão, intenção ou navegação.
# ============================================================

reactive_exact_markers = [
    "analyzeReactiveState",
    "recordReactiveResponse",
    "collectReactiveRecentMemory",
    "setReactiveMessageKey",
    "homeNowMemory",
    "homeNowContext",
    "handleHomeNowAction",
]

for marker in reactive_exact_markers:
    before = app_original.count(marker)
    after = app.count(marker)

    if before != after:
        fail(
            f"Motor/contexto reativo alterado: {marker} "
            f"({before} → {after})"
        )


# ============================================================
# 11. GUARDRAIL ESPECÍFICO — homeNowAction
#
# Esperamos exatamente +1 referência:
#
# homeNowAction ? "rounded-b-[22px]" : ""
#
# dentro do novo cartão firstContactInsight.
# ============================================================

home_action_before = app_original.count("homeNowAction")
home_action_after = app.count("homeNowAction")

if home_action_after != home_action_before + 1:
    fail(
        "homeNowAction teve alteração inesperada: "
        f"{home_action_before} → {home_action_after}. "
        "Era esperado exatamente +1 referência visual."
    )


# ============================================================
# 12. GUARDRAIL ESPECÍFICO — reactiveMessageKey
#
# As três substituições visuais continuam a reutilizar
# referências já existentes.
#
# O número literal não deve mudar.
# ============================================================

reactive_key_before = app_original.count(
    "reactiveMessageKey"
)

reactive_key_after = app.count(
    "reactiveMessageKey"
)

if reactive_key_after != reactive_key_before:
    fail(
        "Número de referências a reactiveMessageKey mudou: "
        f"{reactive_key_before} → {reactive_key_after}"
    )


# ============================================================
# 13. GARANTIR QUE A DECISÃO DE homeNowAction NÃO MUDOU
# ============================================================

decision_markers = [
    'const result = analyzeReactiveState({',
    'source: "general"',
    'const intent = result?.intent;',
    'case "calm":',
    'case "reinforce_impulse":',
    'case "connect_pattern":',
    'case "celebrate_objective":',
    'case "reinforce_progress":',
    'case "welcome":',
    'case "encourage_return":',
]

for marker in decision_markers:
    before = app_original.count(marker)
    after = app.count(marker)

    if before != after:
        fail(
            f"Decisão de homeNowAction alterada: "
            f"{marker} ({before} → {after})"
        )


# ============================================================
# 14. GARANTIR QUE O USEEFFECT REATIVO NÃO MUDOU
# ============================================================

reactive_effect_markers = [
    "if (ratings.length === 0) {",
    "setReactiveMessageKey(null);",
    'source: "mood"',
    "reactiveResult?.response?.translationKey",
]

for marker in reactive_effect_markers:
    before = app_original.count(marker)
    after = app.count(marker)

    if before != after:
        fail(
            f"useEffect reativo alterado: {marker} "
            f"({before} → {after})"
        )


# ============================================================
# 15. GUARDRAILS — ÁREAS JÁ CONCLUÍDAS
# ============================================================

external_markers = [
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

for marker in external_markers:
    before = app_original.count(marker)
    after = app.count(marker)

    if before != after:
        fail(
            f"Área já concluída alterada: {marker} "
            f"({before} → {after})"
        )


# ============================================================
# 16. SEM STORAGE / LISTENERS NOVOS
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
# 17. CONTRATO DA 1D.11A
# ============================================================

contract_markers = [
    "const isFirstContact =",
    'currentTab === 0 &&',
    'homeScreen === "home" &&',
    "ratings.length === 0;",
    "{isFirstContact && (",
    'aria-label={t("firstContactInsight.eyebrow")}',
    't("firstContactInsight.eyebrow")',
    't("firstContactInsight.title")',
    't("firstContactInsight.text")',
    "reactiveMessageKey || isFirstContact",
]

for marker in contract_markers:
    if marker not in app:
        fail(
            f"Contrato 1D.11A incompleto: {marker}"
        )


# ============================================================
# 18. VALIDAR QUE O CARTÃO INICIAL É ÚNICO
# ============================================================

if app.count("{isFirstContact && (") != 1:
    fail(
        "Esperava exatamente um bloco visual "
        "de primeiro contacto."
    )

if app.count(
    't("firstContactInsight.title")'
) != 1:
    fail(
        "O título do primeiro contacto deveria "
        "aparecer exatamente uma vez."
    )

if app.count(
    't("firstContactInsight.text")'
) != 1:
    fail(
        "O texto do primeiro contacto deveria "
        "aparecer exatamente uma vez."
    )


# ============================================================
# 19. GARANTIR ALTERAÇÕES REAIS
# ============================================================

if app == app_original:
    fail(
        "App.tsx não sofreu alterações."
    )

for lang in LOCALE_FILES:
    original_parsed = json.loads(
        locale_original_text[lang]
    )

    if locale_data[lang] == original_parsed:
        fail(
            f"{lang}.json não sofreu alterações."
        )


# ============================================================
# 20. SERIALIZAR LOCALES EM MEMÓRIA
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
        parsed_again = json.loads(
            locale_new_text[lang]
        )
    except json.JSONDecodeError as exc:
        fail(
            f"JSON final inválido em {lang}: {exc}"
        )

    if (
        parsed_again.get("firstContactInsight")
        != translations[lang]
    ):
        fail(
            f"Validação final da tradução "
            f"{lang} falhou."
        )


# ============================================================
# 21. GARANTIR QUE SÓ ESTAMOS A CRIAR AS NOVAS CHAVES
#     NOS LOCALES
# ============================================================

for lang in LOCALE_FILES:
    original_data = json.loads(
        locale_original_text[lang]
    )

    new_data = locale_data[lang]

    original_without_new = dict(original_data)
    new_without_first_contact = dict(new_data)

    new_without_first_contact.pop(
        "firstContactInsight",
        None,
    )

    if (
        original_without_new
        != new_without_first_contact
    ):
        fail(
            f"{lang}.json teve alterações para além "
            "de firstContactInsight."
        )


# ============================================================
# 22. BACKUPS
#
# Só depois de TODAS as validações.
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
# 23. WRITE
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
# 24. VALIDAÇÃO PÓS-WRITE
# ============================================================

written_app = APP_FILE.read_text(
    encoding="utf-8"
)

if written_app != app:
    fail(
        "A validação pós-write do App.tsx falhou."
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
        written_locale.get("firstContactInsight")
        != translations[lang]
    ):
        fail(
            f"Tradução pós-write incorreta: {lang}"
        )


# ============================================================
# 25. RESULTADO
# ============================================================

print("✓ Primeiro contacto derivado de dados reais")
print("✓ ratings vazio = início real da relação")
print("✓ Nenhum estado React novo")
print("✓ Nenhum storage novo")
print("✓ Nenhuma memória artificial")
print("✓ Sem histórico: CONFIA apresenta a relação")
print("✓ Com histórico: experiência inicial desaparece")
print("✓ Memória reativa preservada")
print("✓ Reactive Engine preservado")
print("✓ Decisão de homeNowAction preservada")
print("✓ +1 referência visual a homeNowAction validada")
print("✓ Para ti agora preservado")
print("✓ Primeiro contacto ligado visualmente à ação")
print("✓ HomeWorld preservado")
print("✓ Hoje/Registar preservado")
print("✓ O teu espaço preservado")
print("✓ PT atualizado")
print("✓ EN atualizado")
print("✓ ES atualizado")
print("✓ FR atualizado")
print("✓ Apenas firstContactInsight foi adicionado aos idiomas")
print("✓ JSON dos 4 idiomas validado")
print("✓ Nenhuma dependência nova")
print()
print("Experiência inicial:")
print("  O TEU MUNDO")
print("       ↓")
print("  A CONFIA COMEÇA AQUI")
print("  Vamos começar por te conhecer")
print("       ↓")
print("  PARA TI AGORA")
print("  primeiro registo")
print()
print(f"✓ Backup App: {APP_BACKUP}")

for lang in LOCALE_FILES:
    print(
        f"✓ Backup {lang.upper()}: "
        f"{LOCALE_BACKUPS[lang]}"
    )

print("=" * 72)
print("OK — 1D.11A APLICADA")
print("=" * 72)
