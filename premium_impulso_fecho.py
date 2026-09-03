from pathlib import Path
import json
import shutil
import sys

component = Path("src/components/ImpulsoSOS.tsx")

translations = {
    "pt": {
        "gratitudeEyebrow": "UM MOMENTO PARA TI",
        "timerTitle": "Fica aqui durante alguns minutos",
        "timerDesc": "Dá espaço ao exercício sem pressa. Não precisas de fazer nada perfeitamente.",
        "completedEyebrow": "IMPULSO CONCLUÍDO",
        "completedTitle": "Repara onde estás agora.",
        "completedDesc": "Este momento ficou registado. A CONFIA vai aprendendo contigo.",
        "before": "Antes",
        "after": "Agora",
        "difference": "Variação",
        "confiaNoticed": "A CONFIA reparou...",
        "xpEarned": "+30 XP",
        "xpDesc": "Por teres cuidado de ti neste momento"
    },
    "en": {
        "gratitudeEyebrow": "A MOMENT FOR YOU",
        "timerTitle": "Stay here for a few minutes",
        "timerDesc": "Give the exercise some space without rushing. You don't need to do anything perfectly.",
        "completedEyebrow": "IMPULSE COMPLETE",
        "completedTitle": "Notice where you are now.",
        "completedDesc": "This moment has been recorded. CONFIA will keep learning with you.",
        "before": "Before",
        "after": "Now",
        "difference": "Change",
        "confiaNoticed": "CONFIA noticed...",
        "xpEarned": "+30 XP",
        "xpDesc": "For taking care of yourself in this moment"
    },
    "es": {
        "gratitudeEyebrow": "UN MOMENTO PARA TI",
        "timerTitle": "Quédate aquí durante unos minutos",
        "timerDesc": "Dale espacio al ejercicio sin prisa. No necesitas hacer nada perfectamente.",
        "completedEyebrow": "IMPULSO COMPLETADO",
        "completedTitle": "Observa dónde estás ahora.",
        "completedDesc": "Este momento ha quedado registrado. CONFIA seguirá aprendiendo contigo.",
        "before": "Antes",
        "after": "Ahora",
        "difference": "Variación",
        "confiaNoticed": "CONFIA ha notado...",
        "xpEarned": "+30 XP",
        "xpDesc": "Por haberte cuidado en este momento"
    },
    "fr": {
        "gratitudeEyebrow": "UN MOMENT POUR TOI",
        "timerTitle": "Reste ici quelques minutes",
        "timerDesc": "Laisse un peu de place à l'exercice, sans te presser. Tu n'as pas besoin de faire les choses parfaitement.",
        "completedEyebrow": "IMPULSION TERMINÉE",
        "completedTitle": "Observe où tu en es maintenant.",
        "completedDesc": "Ce moment a été enregistré. CONFIA continuera d'apprendre avec toi.",
        "before": "Avant",
        "after": "Maintenant",
        "difference": "Variation",
        "confiaNoticed": "CONFIA a remarqué...",
        "xpEarned": "+30 XP",
        "xpDesc": "Pour avoir pris soin de toi à ce moment"
    }
}


def fail(message):
    print(f"ERRO: {message}")
    sys.exit(1)


if not component.exists():
    fail("ImpulsoSOS.tsx não encontrado.")

text = component.read_text(encoding="utf-8")
original = text


# ============================================================
# 1. ÍCONE PLAY
# ============================================================

old_import = """  MapPin,
  Search,
  Sparkles,
  Wind,"""

new_import = """  MapPin,
  Pause,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  Wind,"""

if old_import not in text:
    fail("zona dos imports Lucide não encontrada.")

text = text.replace(old_import, new_import, 1)


# ============================================================
# 2. CONCLUSÃO PREMIUM
# ============================================================

start_marker = """  // 1. Ecrã de Conclusão (Sucesso)
  if (completed) {"""

end_marker = """  // 2. Entrada premium do Impulso"""

start = text.find(start_marker)

if start == -1:
    fail("início da conclusão não encontrado.")

end = text.find(end_marker, start)

if end == -1:
    fail("fim da conclusão não encontrado.")

old_completion = text[start:end]

for fragment in [
    't("sosCompleted")',
    't("impulseCongratulations")',
    "reactiveMessageKey",
    "t(reactiveMessageKey)",
]:
    if fragment not in old_completion:
        fail(f"conclusão antiga não contém {fragment}")

new_completion = """  // 1. Ecrã de Conclusão premium
  if (completed) {
    const intensityDifference =
      finalIntensity - intensity;

    const formattedDifference =
      intensityDifference > 0
        ? `+${intensityDifference}`
        : `${intensityDifference}`;

    return (
      <section className="relative mx-auto max-w-[450px] overflow-hidden rounded-[32px] border border-[#E8DDD7]/70 bg-gradient-to-b from-[#FFFDFC] via-white to-[#FFF9F5] px-5 py-6 shadow-[0_18px_50px_rgba(92,64,52,0.07)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#F4D9CA]/25 blur-3xl"
        />

        <div className="relative text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] border border-[#E5A88B]/25 bg-[#FFF8F4] shadow-sm">
            <Check
              size={23}
              strokeWidth={1.8}
              className="text-[#C97B5E]"
            />
          </div>

          <p className="mt-4 text-[9px] font-black uppercase tracking-[0.18em] text-[#C97B5E]">
            {t("impulseClosing.completedEyebrow")}
          </p>

          <h2 className="mx-auto mt-2 max-w-[330px] text-[22px] font-black leading-tight tracking-tight text-[#4E3B36]">
            {t("impulseClosing.completedTitle")}
          </h2>

          <p className="mx-auto mt-2 max-w-[330px] text-xs font-semibold leading-relaxed text-slate-400">
            {t("impulseClosing.completedDesc")}
          </p>
        </div>

        <div className="relative mt-6 grid grid-cols-3 gap-2">
          <div className="rounded-[20px] border border-[#E8DDD7]/60 bg-[#FFF9F5] px-2 py-3 text-center">
            <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">
              {t("impulseClosing.before")}
            </p>

            <p className="mt-1.5 text-xl font-black text-[#8B6B60]">
              {intensity}
            </p>
          </div>

          <div className="rounded-[20px] border border-[#E5A88B]/25 bg-white px-2 py-3 text-center shadow-sm">
            <p className="text-[8px] font-black uppercase tracking-wider text-[#C97B5E]">
              {t("impulseClosing.after")}
            </p>

            <p className="mt-1.5 text-xl font-black text-[#4E3B36]">
              {finalIntensity}
            </p>
          </div>

          <div className="rounded-[20px] border border-[#E8DDD7]/60 bg-[#FFF9F5] px-2 py-3 text-center">
            <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">
              {t("impulseClosing.difference")}
            </p>

            <p className="mt-1.5 text-xl font-black text-[#C97B5E]">
              {formattedDifference}
            </p>
          </div>
        </div>

        {reactiveMessageKey && (
          <div className="relative mt-4 rounded-[24px] border border-[#E5A88B]/25 bg-gradient-to-br from-[#FFF8F4] to-white p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] border border-[#E5A88B]/20 bg-white">
                <Sparkles
                  size={16}
                  strokeWidth={1.8}
                  className="text-[#C97B5E]"
                />
              </div>

              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#C97B5E]">
                  {t("impulseClosing.confiaNoticed")}
                </p>

                <p className="mt-1.5 text-xs font-semibold leading-relaxed text-[#5F504B]">
                  {t(reactiveMessageKey)}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="relative mt-4 flex items-center gap-3 rounded-[20px] border border-[#E8DDD7]/60 bg-white/75 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] bg-[#FFF3EC]">
            <Sparkles
              size={15}
              strokeWidth={1.8}
              className="text-[#C97B5E]"
            />
          </div>

          <div>
            <p className="text-xs font-black text-[#4E3B36]">
              {t("impulseClosing.xpEarned")}
            </p>

            <p className="mt-0.5 text-[9px] font-semibold leading-relaxed text-slate-400">
              {t("impulseClosing.xpDesc")}
            </p>
          </div>
        </div>
      </section>
    );
  }

"""

text = text[:start] + new_completion + text[end:]


# ============================================================
# 3. PASSO 7 — FALLBACK GRATIDÃO / TIMER PREMIUM
# A rota support permanece exatamente como está.
# ============================================================

support_else_start = """            ) : (
              <div
                style={{
                  textAlign: "center",
                  lineHeight: "1.5",
                }}
              >"""

support_end = """            )}
          </>
        )}"""

start = text.find(support_else_start)

if start == -1:
    fail("fallback antigo do passo 7 não encontrado.")

end = text.find(support_end, start)

if end == -1:
    fail("fim do passo 7 não encontrado.")

old_fallback = text[start:end]

for fragment in [
    "getJustificationPhrase()",
    't("gratitudeExercise")',
    "formatTime(timeLeft)",
    "setTimerRunning(!timerRunning)",
    "setTimeLeft(180)",
]:
    if fragment not in old_fallback:
        fail(f"fallback do passo 7 não contém {fragment}")

new_fallback = """            ) : (
              <div>
                <div className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[18px] border border-[#E5A88B]/20 bg-[#FFF8F4]">
                    <Heart
                      size={20}
                      strokeWidth={1.7}
                      className="text-[#C97B5E]"
                    />
                  </div>

                  <p className="mt-4 text-[9px] font-black uppercase tracking-[0.16em] text-[#C97B5E]">
                    {t("impulseClosing.gratitudeEyebrow")}
                  </p>

                  <h2 className="mt-2 text-xl font-black tracking-tight text-[#4E3B36]">
                    {t("gratitudeExercise")}
                  </h2>
                </div>

                <div className="mt-5 rounded-[22px] border border-[#E5A88B]/20 bg-gradient-to-br from-[#FFF8F4] to-white p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles
                      size={16}
                      strokeWidth={1.8}
                      className="mt-0.5 shrink-0 text-[#C97B5E]"
                    />

                    <p className="text-xs font-semibold leading-relaxed text-[#6B5750]">
                      {getJustificationPhrase()}
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-[26px] border border-[#E8DDD7]/65 bg-white/80 p-5 text-center">
                  <p className="text-xs font-black text-[#4E3B36]">
                    {t("impulseClosing.timerTitle")}
                  </p>

                  <p className="mx-auto mt-1.5 max-w-[300px] text-[10px] font-semibold leading-relaxed text-slate-400">
                    {t("impulseClosing.timerDesc")}
                  </p>

                  <div className="my-6">
                    <p
                      className={`font-mono text-[42px] font-black tracking-[-0.04em] ${
                        timeLeft < 30
                          ? "text-[#C97B5E]"
                          : "text-[#4E3B36]"
                      }`}
                    >
                      {formatTime(timeLeft)}
                    </p>
                  </div>

                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        setTimerRunning(!timerRunning)
                      }
                      className="flex h-11 flex-1 items-center justify-center gap-2 rounded-[17px] bg-[#C97B5E] px-4 text-white shadow-[0_7px_18px_rgba(201,123,94,0.16)] transition-transform active:scale-[0.98]"
                    >
                      {timerRunning ? (
                        <Pause
                          size={15}
                          strokeWidth={2}
                        />
                      ) : (
                        <Play
                          size={15}
                          strokeWidth={2}
                        />
                      )}

                      <span className="text-[11px] font-black">
                        {timerRunning
                          ? t("pause")
                          : t("startTimer")}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTimerRunning(false);
                        setTimeLeft(180);
                      }}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[17px] border border-[#E8DDD7] bg-white text-[#8B6B60] transition-transform active:scale-[0.98]"
                      aria-label={t("reset")}
                    >
                      <RotateCcw
                        size={16}
                        strokeWidth={1.9}
                      />
                    </button>
                  </div>
                </div>
              </div>
"""

text = (
    text[:start]
    + new_fallback
    + text[end:]
)


# ============================================================
# 4. TRADUÇÕES — 4 IDIOMAS
# ============================================================

updated_locales = {}

for lang, values in translations.items():
    path = Path(f"src/locales/{lang}.json")

    if not path.exists():
        fail(f"{path} não encontrado.")

    try:
        data = json.loads(
            path.read_text(encoding="utf-8")
        )
    except Exception as exc:
        fail(f"JSON inválido em {path}: {exc}")

    if "impulseClosing" in data:
        if data["impulseClosing"] != values:
            fail(
                f"impulseClosing já existe com conteúdo diferente em {lang}."
            )
    else:
        data["impulseClosing"] = values

    updated_locales[path] = data


# ============================================================
# 5. VERIFICAÇÕES
# ============================================================

required = [
    "<Pause",
    "<Play",
    "<RotateCcw",
    "formatTime(timeLeft)",
    "setTimerRunning(!timerRunning)",
    "setTimerRunning(false)",
    "setTimeLeft(180)",
    "getJustificationPhrase()",
    'impulseNeed === "support"',
    't("impulseAdaptive.supportStepTitle")',
    "reactiveMessageKey",
    "t(reactiveMessageKey)",
    "const intensityDifference",
    "const formattedDifference",
    't("impulseClosing.before")',
    't("impulseClosing.after")',
    't("impulseClosing.confiaNoticed")',
    't("impulseClosing.xpEarned")',
    "finishSOS();",
    "saveEpisode({",
    'source: "impulse"',
    "recordReactiveResponse({",
    "onAddXp(30)",
]

for fragment in required:
    if fragment not in text:
        fail(
            f"verificação final falhou: {fragment}"
        )


# Estilos antigos específicos do timer devem desaparecer.
for obsolete in [
    'background: timerRunning',
    'borderLeft: "4px solid #0d6efd"',
    'background: "#6c757d"',
]:
    if obsolete in text:
        fail(
            f"estilo antigo ainda encontrado: {obsolete}"
        )


if text == original:
    fail("nenhuma alteração realizada.")


# ============================================================
# 6. BACKUPS /tmp
# ============================================================

shutil.copy2(
    component,
    "/tmp/ImpulsoSOS.tsx.before_premium_closing"
)

for path in updated_locales:
    shutil.copy2(
        path,
        f"/tmp/{path.name}.before_impulse_closing"
    )


# ============================================================
# 7. ESCREVER
# ============================================================

component.write_text(
    text,
    encoding="utf-8"
)

for path, data in updated_locales.items():
    path.write_text(
        json.dumps(
            data,
            ensure_ascii=False,
            indent=2
        ) + "\n",
        encoding="utf-8"
    )


print("=" * 72)
print("CONFIA — IMPULSO PREMIUM 1C.4C")
print("=" * 72)
print("✓ Gratidão elevada visualmente")
print("✓ Cronómetro premium")
print("✓ Play / Pause / Reiniciar preservados")
print("✓ Estado do cronómetro preservado")
print("✓ Rota Apoio preservada")
print("✓ Conclusão completamente redesenhada")
print("✓ Comparação Antes / Agora adicionada")
print("✓ Variação de intensidade apresentada")
print("✓ Feedback do Reactive Engine em destaque")
print("✓ +30 XP apresentado discretamente")
print("✓ saveEpisode preservado")
print("✓ Reactive Engine preservado")
print("✓ Histórico reativo preservado")
print("✓ Nenhum storage novo")
print("✓ Nenhuma dependência nova")
print("✓ PT / EN / ES / FR atualizados")
print()
print("OK — 1C.4C concluída.")
