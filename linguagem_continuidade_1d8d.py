from pathlib import Path
import json
import shutil
import sys

APP = Path("src/App.tsx")

LOCALES = {
    "pt": Path("src/locales/pt.json"),
    "en": Path("src/locales/en.json"),
    "es": Path("src/locales/es.json"),
    "fr": Path("src/locales/fr.json"),
}


def fail(message):
    print(f"ERRO: {message}")
    sys.exit(1)


print("=" * 72)
print("CONFIA — LINGUAGEM DA CONTINUIDADE TRANSVERSAL — 1D.8D")
print("=" * 72)


# ============================================================
# 1. VALIDAR FICHEIROS ANTES DE QUALQUER ESCRITA
# ============================================================

if not APP.exists():
    fail("src/App.tsx não encontrado.")

for language, path in LOCALES.items():
    if not path.exists():
        fail(f"locale {language} não encontrado: {path}")


original_app = APP.read_text(encoding="utf-8")

locale_data = {}

for language, path in LOCALES.items():
    try:
        locale_data[language] = json.loads(
            path.read_text(encoding="utf-8")
        )
    except Exception as exc:
        fail(
            f"{language}.json inválido antes da alteração: {exc}"
        )


# ============================================================
# 2. VALIDAR 1D.8C
# ============================================================

required_app = [
    "const homeNowContext = (() => {",
    'source: "impulse" as const',
    'source: "cross" as const',
    'source: "mood" as const',
    'homeNowContext?.kind === "continuity"',
    "count: homeNowContext.count",
]

for fragment in required_app:
    if fragment not in original_app:
        fail(
            "1D.8C esperada não encontrada: "
            + fragment
        )

if "1D.8D — LINGUAGEM TRANSVERSAL" in original_app:
    fail("A 1D.8D parece já estar aplicada.")


# ============================================================
# 3. TRADUÇÕES
# ============================================================

translations = {
    "pt": {
        "eyebrow": "A CONFIA TEM REPARADO",
        "mood": (
            "Tenho reparado numa direção semelhante "
            "nos teus últimos registos. Vale a pena "
            "olhares para esta evolução com alguma distância."
        ),
        "checkIn": (
            "Há uma necessidade que tem voltado a aparecer "
            "nos teus check-ins. Pode valer a pena observares "
            "o que estes momentos têm em comum."
        ),
        "impulse": (
            "Há uma abordagem que já te ajudou mais do que "
            "uma vez. Podes tê-la em mente se voltar a fazer "
            "sentido para ti."
        ),
        "cross": (
            "Há sinais em diferentes registos que parecem "
            "merecer ser observados em conjunto."
        ),
    },

    "en": {
        "eyebrow": "CONFIA HAS NOTICED",
        "mood": (
            "I've noticed a similar direction across your "
            "recent records. It may be worth looking at this "
            "change with a little distance."
        ),
        "checkIn": (
            "A need has been showing up repeatedly in your "
            "check-ins. It may be worth noticing what these "
            "moments have in common."
        ),
        "impulse": (
            "There's an approach that has helped you more "
            "than once. You can keep it in mind if it feels "
            "useful again."
        ),
        "cross": (
            "There are signals across different records that "
            "seem worth looking at together."
        ),
    },

    "es": {
        "eyebrow": "CONFIA HA IDO OBSERVANDO",
        "mood": (
            "He observado una dirección parecida en tus "
            "últimos registros. Puede valer la pena mirar "
            "esta evolución con un poco de distancia."
        ),
        "checkIn": (
            "Hay una necesidad que ha vuelto a aparecer en "
            "tus check-ins. Puede valer la pena observar qué "
            "tienen en común estos momentos."
        ),
        "impulse": (
            "Hay un enfoque que ya te ha ayudado más de una "
            "vez. Puedes tenerlo presente si vuelve a tener "
            "sentido para ti."
        ),
        "cross": (
            "Hay señales en distintos registros que parecen "
            "merecer ser observadas en conjunto."
        ),
    },

    "fr": {
        "eyebrow": "CONFIA A REMARQUÉ",
        "mood": (
            "J'ai remarqué une direction similaire dans tes "
            "dernières notes. Il peut être utile d'observer "
            "cette évolution avec un peu de recul."
        ),
        "checkIn": (
            "Un besoin revient dans plusieurs de tes "
            "check-ins. Il peut être utile d'observer ce que "
            "ces moments ont en commun."
        ),
        "impulse": (
            "Il y a une approche qui t'a déjà aidé plus "
            "d'une fois. Tu peux la garder en tête si elle "
            "te semble à nouveau utile."
        ),
        "cross": (
            "Des signaux apparaissent dans différents "
            "registres et semblent mériter d'être observés "
            "ensemble."
        ),
    },
}


# ============================================================
# 4. PREPARAR LOCALES EM MEMÓRIA
#
# Nenhum ficheiro é escrito ainda.
# ============================================================

new_locale_text = {}

for language, data in locale_data.items():
    home_now = data.get("homeNow")

    if not isinstance(home_now, dict):
        fail(
            f'{language}.json não contém objeto "homeNow".'
        )

    if "continuityMemory" in home_now:
        fail(
            f"{language}.json já contém "
            '"homeNow.continuityMemory".'
        )

    home_now["continuityMemory"] = (
        translations[language]
    )

    try:
        rendered = json.dumps(
            data,
            ensure_ascii=False,
            indent=2
        ) + "\n"

        # Validação round-trip.
        parsed = json.loads(rendered)

        created = (
            parsed
            .get("homeNow", {})
            .get("continuityMemory")
        )

        if created != translations[language]:
            fail(
                f"validação das traduções falhou em "
                f"{language}."
            )

        new_locale_text[language] = rendered

    except Exception as exc:
        fail(
            f"erro ao preparar {language}.json: {exc}"
        )


# ============================================================
# 5. ALTERAR APENAS A APRESENTAÇÃO DE CONTINUIDADE
# ============================================================

old_ui = '''        {homeNowContext?.kind === "continuity" && (
          <p className="mt-1.5 text-[11px] font-semibold leading-relaxed text-[#8A6A5D]">
            {t("homeNow.continuity.text", {
              count: homeNowContext.count,
            })}
          </p>
        )}'''

new_ui = '''        {/* 1D.8D — LINGUAGEM TRANSVERSAL */}
        {homeNowContext?.kind === "continuity" && (
          <p className="mt-1.5 text-[11px] font-semibold leading-relaxed text-[#8A6A5D]">
            {homeNowContext.source === "mood"
              ? t("homeNow.continuityMemory.mood")
              : homeNowContext.source === "impulse"
                ? t("homeNow.continuityMemory.impulse")
                : homeNowContext.source === "cross"
                  ? t("homeNow.continuityMemory.cross")
                  : t("homeNow.continuityMemory.checkIn")}
          </p>
        )}'''

if original_app.count(old_ui) != 1:
    fail(
        "bloco visual da 1D.8C não encontrado "
        "de forma única."
    )

new_app = original_app.replace(
    old_ui,
    new_ui,
    1
)


# ============================================================
# 6. EYEBROW PRÓPRIO DA MEMÓRIA TRANSVERSAL
# ============================================================

old_eyebrow = '''            : homeNowContext?.kind === "continuity"
              ? t("homeNow.continuity.eyebrow")
              : t("homeNow.eyebrow")}'''

new_eyebrow = '''            : homeNowContext?.kind === "continuity"
              ? t("homeNow.continuityMemory.eyebrow")
              : t("homeNow.eyebrow")}'''

if new_app.count(old_eyebrow) != 1:
    fail(
        "eyebrow da continuidade não encontrado "
        "de forma única."
    )

new_app = new_app.replace(
    old_eyebrow,
    new_eyebrow,
    1
)


# ============================================================
# 7. VALIDAÇÃO DO APP.tsx EM MEMÓRIA
# ============================================================

required_after = [
    "1D.8D — LINGUAGEM TRANSVERSAL",
    'homeNowContext.source === "mood"',
    'homeNowContext.source === "impulse"',
    'homeNowContext.source === "cross"',
    't("homeNow.continuityMemory.mood")',
    't("homeNow.continuityMemory.impulse")',
    't("homeNow.continuityMemory.cross")',
    't("homeNow.continuityMemory.checkIn")',
    't("homeNow.continuityMemory.eyebrow")',
]

for fragment in required_after:
    if fragment not in new_app:
        fail(
            "validação do App.tsx falhou: "
            + fragment
        )


# ============================================================
# 8. GARANTIR QUE NÃO CRIÁMOS OUTRO MOTOR
# ============================================================

marker = new_app.find(
    "1D.8D — LINGUAGEM TRANSVERSAL"
)

window = new_app[
    max(0, marker - 1000):
    marker + 3000
]

for forbidden in [
    "analyzeReactiveState(",
    "collectReactiveRecentMemory(",
    "localStorage.setItem(",
    "useEffect(",
]:
    if forbidden in window:
        fail(
            "a camada visual ganhou responsabilidade "
            "indevida: "
            + forbidden
        )


# ============================================================
# 9. BACKUPS
# ============================================================

backups = {
    APP: Path("/tmp/App.tsx.before_1d8d"),
}

for language, path in LOCALES.items():
    backups[path] = Path(
        f"/tmp/{language}.json.before_1d8d"
    )

for source, destination in backups.items():
    shutil.copy2(source, destination)


# ============================================================
# 10. ESCREVER APENAS DEPOIS DE TODAS AS VALIDAÇÕES
# ============================================================

APP.write_text(
    new_app,
    encoding="utf-8"
)

for language, path in LOCALES.items():
    path.write_text(
        new_locale_text[language],
        encoding="utf-8"
    )


# ============================================================
# 11. VALIDAR OS FICHEIROS JÁ ESCRITOS
# ============================================================

for language, path in LOCALES.items():
    try:
        data = json.loads(
            path.read_text(encoding="utf-8")
        )
    except Exception as exc:
        fail(
            f"{language}.json ficou inválido: {exc}"
        )

    block = (
        data
        .get("homeNow", {})
        .get("continuityMemory")
    )

    if block != translations[language]:
        fail(
            f"conteúdo final incorreto em {language}."
        )


final_app = APP.read_text(encoding="utf-8")

for fragment in required_after:
    if fragment not in final_app:
        fail(
            "App.tsx final perdeu: "
            + fragment
        )


print("✓ Linguagem própria para continuidade do Humor")
print("✓ Linguagem própria para necessidade repetida")
print("✓ Linguagem própria para aprendizagem do Impulso")
print("✓ Linguagem própria para convergência entre fontes")
print("✓ Eyebrow próprio da memória transversal")
print("✓ Linguagem evita diagnóstico e causalidade")
print("✓ PT atualizado e JSON válido")
print("✓ EN atualizado e JSON válido")
print("✓ ES atualizado e JSON válido")
print("✓ FR atualizado e JSON válido")
print("✓ homeNowAction continua a decidir a ação")
print("✓ Nenhum segundo Reactive Engine")
print("✓ Nenhum storage novo")
print("✓ Nenhum listener novo")
print("✓ Nenhuma dependência nova")
print("✓ Nenhum cartão novo")
print("✓ Backups guardados em /tmp")
print("=" * 72)
print("OK — 1D.8D APLICADA")
print("=" * 72)
