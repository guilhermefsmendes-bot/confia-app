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
print("CONFIA — CORREÇÃO CONTINUIDADE — 1D.7B")
print("=" * 72)


# ============================================================
# 1. LER E VALIDAR TUDO ANTES DE ESCREVER
# ============================================================

if not APP.exists():
    fail("src/App.tsx não encontrado.")

app = APP.read_text(encoding="utf-8")

locale_data = {}

for lang, path in LOCALES.items():
    if not path.exists():
        fail(f"{path} não encontrado.")

    try:
        locale_data[lang] = json.loads(
            path.read_text(encoding="utf-8")
        )
    except Exception as exc:
        fail(f"{lang}.json inválido: {exc}")


required = [
    "const homeNowMemory = (() => {",
    "const homeNowAction = (() => {",
    "collectReactiveRecentMemory()",
    "memory?.hasImpulseLearning",
    'kind: "continuity" as const',
    'homeNowAction.kind === "continuity"',
]

for fragment in required:
    if fragment not in app:
        fail(f"estrutura esperada não encontrada: {fragment}")


# ============================================================
# 2. GARANTIR QUE CONTINUITY É LIDA DA MEMÓRIA
# ============================================================

old_memory_start = '''    const effectiveImpulse =
      memory?.recentEffectiveImpulse ?? null;

    /*
     * 1D.6C — HIERARQUIA DA MEMÓRIA
'''

new_memory_start = '''    const effectiveImpulse =
      memory?.recentEffectiveImpulse ?? null;

    const continuity =
      memory?.continuity ?? null;

    /*
     * 1D.6C — HIERARQUIA DA MEMÓRIA
'''

if old_memory_start not in app:
    fail(
        "ponto de inserção de continuity não encontrado."
    )

app = app.replace(
    old_memory_start,
    new_memory_start,
    1
)


# ============================================================
# 3. REMOVER A IDEIA ERRADA DE CONTINUITY COMO AÇÃO
# ============================================================

old_title = '''          {homeNowAction.kind === "continuity"
            ? t("homeNow.continuity.title")
            : t(homeNowAction.titleKey)}
'''

new_title = '''          {t(homeNowAction.titleKey)}
'''

if old_title not in app:
    fail(
        "condição antiga homeNowAction.kind === continuity "
        "não encontrada."
    )

app = app.replace(
    old_title,
    new_title,
    1
)


# ============================================================
# 4. EYEBROW: APRENDIZAGEM > CONTINUIDADE > NORMAL
# ============================================================

old_eyebrow = '''          {homeNowMemory?.kind === "impulseLearning"
            ? t("impulseLearning.eyebrow")
            : t("homeNow.eyebrow")}
'''

new_eyebrow = '''          {homeNowMemory?.kind === "impulseLearning"
            ? t("impulseLearning.eyebrow")
            : homeNowMemory?.kind === "continuity" ||
              (
                homeNowMemory?.kind === "impulseMemory" &&
                homeNowMemory.continuity?.hasRepeatedSignals
              )
              ? t("homeNow.continuity.eyebrow")
              : t("homeNow.eyebrow")}
'''

if old_eyebrow not in app:
    fail("eyebrow atual não encontrado.")

app = app.replace(
    old_eyebrow,
    new_eyebrow,
    1
)


# ============================================================
# 5. ACRESCENTAR CONTEXTO SEM ALTERAR A AÇÃO
# ============================================================

old_text = '''        <p className="mt-1.5 text-[11px] font-semibold leading-relaxed text-slate-500">
          {t(homeNowAction.textKey)}
        </p>
'''

new_text = '''        {(homeNowMemory?.kind === "continuity" ||
          (
            homeNowMemory?.kind === "impulseMemory" &&
            homeNowMemory.continuity?.hasRepeatedSignals
          )) && (
          <p className="mt-1.5 text-[11px] font-semibold leading-relaxed text-[#8A6A5D]">
            {t("homeNow.continuity.text", {
              count:
                homeNowMemory.kind === "continuity"
                  ? Math.max(
                      homeNowMemory.repeatedNeedCount,
                      homeNowMemory.recentEffectiveImpulseCount
                    )
                  : Math.max(
                      homeNowMemory.continuity?.repeatedNeedCount ?? 0,
                      homeNowMemory.continuity?.recentEffectiveImpulseCount ?? 0
                    ),
            })}
          </p>
        )}

        <p className="mt-1.5 text-[11px] font-semibold leading-relaxed text-slate-500">
          {t(homeNowAction.textKey)}
        </p>
'''

if old_text not in app:
    fail("texto principal do cartão não encontrado.")

app = app.replace(
    old_text,
    new_text,
    1
)


# ============================================================
# 6. TRADUÇÕES PT / EN / ES / FR
# ============================================================

translations = {
    "pt": {
        "eyebrow": "A CONFIA REPAROU NUMA REPETIÇÃO",
        "text": "Há sinais semelhantes que já apareceram mais do que uma vez nos teus registos recentes ({{count}} ocorrências). Vale a pena observá-los sem tirar conclusões precipitadas."
    },
    "en": {
        "eyebrow": "CONFIA NOTICED A REPEAT",
        "text": "Similar signals have appeared more than once in your recent records ({{count}} occurrences). They may be worth noticing without jumping to conclusions."
    },
    "es": {
        "eyebrow": "CONFIA HA NOTADO UNA REPETICIÓN",
        "text": "Hay señales similares que han aparecido más de una vez en tus registros recientes ({{count}} ocasiones). Puede valer la pena observarlas sin sacar conclusiones precipitadas."
    },
    "fr": {
        "eyebrow": "CONFIA A REMARQUÉ UNE RÉPÉTITION",
        "text": "Des signaux similaires sont apparus plusieurs fois dans tes données récentes ({{count}} occurrences). Il peut être utile de les observer sans tirer de conclusions trop vite."
    },
}

for lang, data in locale_data.items():
    home_now = data.get("homeNow")

    if not isinstance(home_now, dict):
        fail(f"homeNow ausente em {lang}")

    home_now["continuity"] = translations[lang]


# ============================================================
# 7. VALIDAÇÃO EM MEMÓRIA
# ============================================================

forbidden = [
    'homeNowAction.kind === "continuity"',
    'case "continuity":',
]

for fragment in forbidden:
    if fragment in app:
        fail(
            f"continuidade ainda está a ser tratada como ação: "
            f"{fragment}"
        )


required_after = [
    "const continuity =",
    "memory?.continuity ?? null",
    'homeNowMemory?.kind === "continuity"',
    'homeNow.continuity.eyebrow',
    'homeNow.continuity.text',
    "t(homeNowAction.titleKey)",
    "t(homeNowAction.textKey)",
]

for fragment in required_after:
    if fragment not in app:
        fail(f"validação falhou: {fragment}")


serialized = {}

for lang, data in locale_data.items():
    text = json.dumps(
        data,
        ensure_ascii=False,
        indent=2
    ) + "\n"

    json.loads(text)
    serialized[lang] = text


# ============================================================
# 8. BACKUPS
# ============================================================

shutil.copy2(
    APP,
    "/tmp/App.tsx.before_1d7b_fix"
)

for lang, path in LOCALES.items():
    shutil.copy2(
        path,
        f"/tmp/{lang}.json.before_1d7b_fix"
    )


# ============================================================
# 9. ESCREVER
# ============================================================

APP.write_text(
    app,
    encoding="utf-8"
)

for lang, path in LOCALES.items():
    path.write_text(
        serialized[lang],
        encoding="utf-8"
    )


# ============================================================
# 10. VALIDAÇÃO FINAL
# ============================================================

for lang, path in LOCALES.items():
    data = json.loads(
        path.read_text(encoding="utf-8")
    )

    if "continuity" not in data["homeNow"]:
        fail(f"homeNow.continuity ausente em {lang}")

    print(f"✓ {lang}: continuidade traduzida")


print()
print("=" * 72)
print("CONFIA — 1D.7B CORRIGIDA")
print("=" * 72)
print("✓ continuity é lida da memória")
print("✓ continuity deixou de ser tratada como ação")
print("✓ Reactive Engine continua a decidir a ação")
print("✓ Continuidade apenas contextualiza o cartão")
print("✓ Aprendizagem continua com prioridade visual")
print("✓ Memória imediata preservada")
print("✓ Nenhuma seleção automática de percurso")
print("✓ Nenhum storage novo")
print("✓ Nenhum listener novo")
print("✓ Nenhuma dependência nova")
print("✓ PT / EN / ES / FR atualizados")
print("✓ JSON validado")
print("=" * 72)
print("OK — 1D.7B CORRIGIDA")
print("=" * 72)
