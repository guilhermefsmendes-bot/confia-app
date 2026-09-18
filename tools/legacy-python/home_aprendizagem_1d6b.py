from pathlib import Path
import json
import shutil
import re

APP = Path("src/App.tsx")

LOCALES = [
    Path("src/locales/pt.json"),
    Path("src/locales/en.json"),
    Path("src/locales/es.json"),
    Path("src/locales/fr.json"),
]

print("=" * 72)
print("CONFIA — PRINCIPAL — 1D.6B — APRENDIZAGEM VISÍVEL")
print("=" * 72)


# ================================================================
# 1. VALIDAR FICHEIROS
# ================================================================

if not APP.exists():
    print("ERRO: src/App.tsx não encontrado.")
    raise SystemExit(1)

for path in LOCALES:
    if not path.exists():
        print(f"ERRO: locale não encontrado: {path}")
        raise SystemExit(1)

    try:
        json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"ERRO: JSON inválido: {path}")
        print(e)
        raise SystemExit(1)


text = APP.read_text(encoding="utf-8")


# ================================================================
# 2. BACKUPS
# ================================================================

shutil.copy2(
    APP,
    "/tmp/App.tsx.before_1d6b"
)

for locale in LOCALES:
    shutil.copy2(
        locale,
        f"/tmp/{locale.stem}.json.before_1d6b"
    )


# ================================================================
# 3. EXTENDER homeNowMemory
# ================================================================

old_memory = """    if (
      effectiveImpulse &&
      typeof effectiveImpulse.initialIntensity === "number" &&
      typeof effectiveImpulse.finalIntensity === "number"
    ) {
      return {
        kind: "impulseMemory" as const,
        need: effectiveImpulse.need ?? null,
        before: effectiveImpulse.initialIntensity,
        after: effectiveImpulse.finalIntensity,
        reduction: effectiveImpulse.reduction,
      };
    }
"""

if old_memory not in text:
    print(
        "ERRO: bloco conhecido de homeNowMemory não encontrado."
    )
    raise SystemExit(1)


new_memory = """    if (
      effectiveImpulse &&
      typeof effectiveImpulse.initialIntensity === "number" &&
      typeof effectiveImpulse.finalIntensity === "number"
    ) {
      return {
        kind: "impulseMemory" as const,
        need: effectiveImpulse.need ?? null,
        before: effectiveImpulse.initialIntensity,
        after: effectiveImpulse.finalIntensity,
        reduction: effectiveImpulse.reduction,
      };
    }

    /**
     * Aprendizagem personalizada do Impulso.
     *
     * Esta informação é apenas contextual.
     * Não escolhe automaticamente um percurso.
     */
    if (memory?.hasImpulseLearning) {
      return {
        kind: "impulseLearning" as const,
        effectiveCount:
          memory.effectiveImpulseCount,
        recentCount:
          memory.recentImpulseCount,
        averageReduction:
          memory.recentImpulseAverageReduction ?? null,
        need:
          memory.effectiveImpulseNeed ?? null,
        needCount:
          memory.effectiveImpulseNeedCount,
      };
    }
"""

text = text.replace(
    old_memory,
    new_memory,
    1
)


# ================================================================
# 4. INSERIR CARTÃO DE APRENDIZAGEM
# ================================================================

anchor = """{reactiveMessageKey && (
  <div className="mt-4 rounded-[28px] border border-[#E5A88B]/25 bg-gradient-to-br from-[#FFF9F5] to-white p-5 shadow-sm">
"""

if anchor not in text:
    print(
        "ERRO: cartão Reactive Insight não encontrado."
    )
    raise SystemExit(1)


learning_card = """{homeNowMemory?.kind === "impulseLearning" && (
  <div className="mt-4 overflow-hidden rounded-[28px] border border-[#E5A88B]/25 bg-gradient-to-br from-[#FFF9F5] via-white to-[#FFFDFC] shadow-[0_10px_30px_rgba(92,64,52,0.06)]">
    <div className="px-5 pt-5 pb-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#E5A88B]/20 bg-white">
          <Sparkles
            size={18}
            strokeWidth={1.8}
            className="text-[#C97B5E]"
          />
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#C97B5E]">
            {t("impulseLearning.eyebrow")}
          </p>

          <h3 className="mt-1 text-base font-black leading-tight text-[#4E3B36]">
            {t("impulseLearning.title")}
          </h3>

          <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-500">
            {t("impulseLearning.description", {
              count: homeNowMemory.effectiveCount,
              reduction:
                homeNowMemory.averageReduction !== null
                  ? Math.round(
                      homeNowMemory.averageReduction * 10
                    ) / 10
                  : 0,
            })}
          </p>
        </div>
      </div>

      {homeNowMemory.need && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-[20px] border border-[#E8DDD7]/60 bg-white/80 px-4 py-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
              {t("impulseLearning.patternLabel")}
            </p>

            <p className="mt-1 text-sm font-black text-[#4E3B36]">
              {t(
                `impulsePremium.${homeNowMemory.need}Title`
              )}
            </p>
          </div>

          <div className="rounded-full bg-[#FFF3EC] px-3 py-1.5 text-[9px] font-black text-[#C97B5E]">
            {t("impulseLearning.observed", {
              count: homeNowMemory.needCount,
            })}
          </div>
        </div>
      )}

      <p className="mt-3 text-[10px] font-semibold leading-relaxed text-slate-400">
        {t("impulseLearning.disclaimer")}
      </p>
    </div>
  </div>
)}

"""

# Colocar antes do Reactive Insight existente.
text = text.replace(
    anchor,
    learning_card + anchor,
    1
)


# ================================================================
# 5. TRADUÇÕES
# ================================================================

translations = {
    "pt": {
        "eyebrow": "A CONFIA APRENDEU CONTIGO",
        "title": "Uma abordagem parece estar a ajudar-te",
        "description": "Nos teus últimos episódios eficazes, a intensidade reduziu em média {{reduction}} pontos. Já existem {{count}} experiências que nos ajudam a reconhecer este sinal.",
        "patternLabel": "Sinal observado",
        "observed": "{{count}} vezes",
        "disclaimer": "Isto não significa que seja sempre a melhor opção. A Confia apenas reconhece um padrão nos teus registos.",
    },
    "en": {
        "eyebrow": "CONFIA HAS LEARNED FROM YOU",
        "title": "One approach seems to be helping you",
        "description": "In your recent effective episodes, intensity dropped by an average of {{reduction}} points. We now have {{count}} experiences showing this signal.",
        "patternLabel": "Pattern observed",
        "observed": "{{count}} times",
        "disclaimer": "This does not mean it is always the best option. Confia is simply recognizing a pattern in your records.",
    },
    "es": {
        "eyebrow": "CONFIA HA APRENDIDO CONTIGO",
        "title": "Un enfoque parece estar ayudándote",
        "description": "En tus episodios eficaces recientes, la intensidad se redujo una media de {{reduction}} puntos. Ya tenemos {{count}} experiencias que muestran esta señal.",
        "patternLabel": "Señal observada",
        "observed": "{{count}} veces",
        "disclaimer": "Esto no significa que sea siempre la mejor opción. Confia simplemente reconoce un patrón en tus registros.",
    },
    "fr": {
        "eyebrow": "CONFIA A APPRIS AVEC TOI",
        "title": "Une approche semble t'aider",
        "description": "Lors de tes épisodes efficaces récents, l'intensité a diminué de {{reduction}} points en moyenne. Nous avons maintenant {{count}} expériences qui montrent ce signal.",
        "patternLabel": "Tendance observée",
        "observed": "{{count}} fois",
        "disclaimer": "Cela ne signifie pas que ce soit toujours la meilleure option. Confia reconnaît simplement une tendance dans tes données.",
    },
}


for locale in LOCALES:
    lang = locale.stem

    data = json.loads(
        locale.read_text(encoding="utf-8")
    )

    data["impulseLearning"] = translations[lang]

    locale.write_text(
        json.dumps(
            data,
            ensure_ascii=False,
            indent=2
        ) + "\n",
        encoding="utf-8"
    )

    print(f"✓ {lang}: traduções 1D.6B atualizadas")


# ================================================================
# 6. VALIDAÇÃO BÁSICA
# ================================================================

if text.count('kind: "impulseLearning"') != 1:
    print(
        "ERRO: bloco impulseLearning não ficou exatamente uma vez."
    )
    raise SystemExit(1)

if text.count('homeNowMemory?.kind === "impulseLearning"') != 1:
    print(
        "ERRO: cartão de aprendizagem não ficou exatamente uma vez."
    )
    raise SystemExit(1)


APP.write_text(
    text,
    encoding="utf-8"
)


# ================================================================
# 7. VALIDAR JSON
# ================================================================

for locale in LOCALES:
    try:
        json.loads(
            locale.read_text(encoding="utf-8")
        )
    except json.JSONDecodeError as e:
        print(
            f"ERRO: JSON inválido depois da alteração: {locale}"
        )
        print(e)
        raise SystemExit(1)


print()
print("=" * 72)
print("✓ homeNowMemory passou a reconhecer aprendizagem do Impulso")
print("✓ Dados reais da memória 1D.6A utilizados")
print("✓ Cartão premium de aprendizagem adicionado")
print("✓ Necessidade mais eficaz apresentada apenas como padrão observado")
print("✓ Nenhuma seleção automática de percurso")
print("✓ Nenhum storage novo")
print("✓ Nenhum listener novo")
print("✓ Nenhuma dependência nova")
print("✓ PT / EN / ES / FR atualizados")
print("✓ JSON validado")
print("=" * 72)
print("OK — 1D.6B APLICADA")
print("=" * 72)
