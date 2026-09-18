from pathlib import Path
import json
import shutil
import sys

component = Path("src/components/ImpulsoSOS.tsx")

translations = {
    "pt": {
        "step": "Passo {{current}} de {{total}}",
        "intensityNow": "Como está a intensidade agora?",
        "intensityNowDesc": "Não precisas de pensar demasiado. Escolhe o número que mais se aproxima do que sentes.",
        "intensityAfter": "Como está a intensidade agora?",
        "intensityAfterDesc": "Compara apenas com o momento em que começaste.",
        "low": "Baixa",
        "medium": "Moderada",
        "high": "Elevada",
        "initial": "No início",
        "now": "Agora"
    },
    "en": {
        "step": "Step {{current}} of {{total}}",
        "intensityNow": "How intense does it feel right now?",
        "intensityNowDesc": "You don't need to overthink it. Choose the number that feels closest to what you're experiencing.",
        "intensityAfter": "How intense does it feel now?",
        "intensityAfterDesc": "Just compare it with how you felt when you started.",
        "low": "Low",
        "medium": "Moderate",
        "high": "High",
        "initial": "At the start",
        "now": "Now"
    },
    "es": {
        "step": "Paso {{current}} de {{total}}",
        "intensityNow": "¿Cómo está la intensidad ahora?",
        "intensityNowDesc": "No necesitas pensarlo demasiado. Elige el número que más se acerque a lo que sientes.",
        "intensityAfter": "¿Cómo está la intensidad ahora?",
        "intensityAfterDesc": "Compárala únicamente con el momento en que empezaste.",
        "low": "Baja",
        "medium": "Moderada",
        "high": "Alta",
        "initial": "Al inicio",
        "now": "Ahora"
    },
    "fr": {
        "step": "Étape {{current}} sur {{total}}",
        "intensityNow": "Quelle est l'intensité maintenant ?",
        "intensityNowDesc": "Tu n'as pas besoin d'y réfléchir longtemps. Choisis le nombre qui correspond le mieux à ce que tu ressens.",
        "intensityAfter": "Quelle est l'intensité maintenant ?",
        "intensityAfterDesc": "Compare-la simplement au moment où tu as commencé.",
        "low": "Faible",
        "medium": "Modérée",
        "high": "Élevée",
        "initial": "Au début",
        "now": "Maintenant"
    }
}


def fail(message):
    print(f"ERRO: {message}")
    sys.exit(1)


if not component.exists():
    fail("src/components/ImpulsoSOS.tsx não encontrado.")

text = component.read_text(encoding="utf-8")
original = text


# ============================================================
# 1. ÍCONES NECESSÁRIOS
# ============================================================

old_import = """  ArrowRight,
  Brain,
  Compass,
  HeartHandshake,
  Sparkles,
  Wind,"""

new_import = """  ArrowLeft,
  ArrowRight,
  Brain,
  Check,
  Compass,
  HeartHandshake,
  Sparkles,
  Wind,"""

if old_import not in text:
    fail("imports Lucide esperados não encontrados.")

text = text.replace(
    old_import,
    new_import,
    1
)


# ============================================================
# 2. CONTENTOR + PROGRESSO PREMIUM
# ============================================================

old_opening = """    <div style={{ padding: "20px", maxWidth: "450px", margin: "0 auto", fontFamily: "sans-serif" }}>
      {/* Barra de Progresso */}
      <div style={{ background: "#eee", borderRadius: "5px", height: "10px", width: "100%" }}>
        <div style={{ background: "#4CAF50", height: "10px", borderRadius: "5px", width: `${progress}%`, transition: "width 0.3s" }}></div>
      </div>
      <div className="mb-5 mt-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#C97B5E]">
            {t("impulseAdaptive.routeLabel")}
          </p>

          <p className="mt-0.5 truncate text-[11px] font-bold text-[#4E3B36]">
            {impulseNeed
              ? t(routeLabelKey[impulseNeed])
              : t("impulse")}
          </p>
        </div>

        <span className="shrink-0 rounded-full bg-[#FFF8F4] px-2.5 py-1 text-[9px] font-black text-[#C97B5E]">
          {progress}%
        </span>
      </div>

      {/* Conteúdo Dinâmico dos Passos */}
      <div style={{ margin: "20px 0", minHeight: "260px" }}>"""

new_opening = """    <section className="relative mx-auto max-w-[450px] overflow-hidden rounded-[32px] border border-[#E8DDD7]/70 bg-gradient-to-b from-[#FFFDFC] via-white to-[#FFF9F5] shadow-[0_18px_50px_rgba(92,64,52,0.07)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#F4D9CA]/25 blur-3xl"
      />

      {/* Cabeçalho do percurso */}
      <div className="relative border-b border-[#E8DDD7]/55 px-5 pb-4 pt-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#C97B5E]">
              {t("impulseAdaptive.routeLabel")}
            </p>

            <p className="mt-1 truncate text-[13px] font-black text-[#4E3B36]">
              {impulseNeed
                ? t(routeLabelKey[impulseNeed])
                : t("impulse")}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[9px] font-bold text-slate-400">
              {t("impulseExperience.step", {
                current: currentRouteIndex + 1,
                total: activeRoute.length,
              })}
            </p>

            <p className="mt-1 text-[11px] font-black text-[#C97B5E]">
              {progress}%
            </p>
          </div>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#F1E8E3]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#E5A88B] to-[#C97B5E] transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Conteúdo Dinâmico dos Passos */}
      <div className="relative min-h-[300px] px-5 py-6">"""

if old_opening not in text:
    fail("bloco inicial/progresso do exercício não encontrado.")

text = text.replace(
    old_opening,
    new_opening,
    1
)


# ============================================================
# 3. INTENSIDADE INICIAL PREMIUM
# ============================================================

old_step1 = """        {step === 1 && (
          <div>
            <h3>{t("impulseStep1")}</h3>
            <input 
              type="range" min="1" max="10" 
              value={intensity} 
              onChange={(e) => setIntensity(Number(e.target.value))} 
              style={{ width: "100%" }}
            />
            <p style={{ textAlign: "center", fontWeight: "bold", fontSize: "24px", color: "#0d6efd" }}>{intensity}</p>
          </div>
        )}"""

new_step1 = """        {step === 1 && (
          <div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[18px] border border-[#E5A88B]/20 bg-[#FFF8F4]">
                <Sparkles
                  size={20}
                  strokeWidth={1.7}
                  className="text-[#C97B5E]"
                />
              </div>

              <h2 className="mt-4 text-xl font-black tracking-tight text-[#4E3B36]">
                {t("impulseExperience.intensityNow")}
              </h2>

              <p className="mx-auto mt-2 max-w-[330px] text-xs font-semibold leading-relaxed text-slate-400">
                {t("impulseExperience.intensityNowDesc")}
              </p>
            </div>

            <div className="mt-7 rounded-[26px] border border-[#E8DDD7]/65 bg-white/80 p-5">
              <div className="text-center">
                <span className="text-[46px] font-black leading-none tracking-[-0.05em] text-[#4E3B36]">
                  {intensity}
                </span>

                <span className="ml-1 text-sm font-black text-[#B8AAA4]">
                  /10
                </span>

                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#C97B5E]">
                  {intensity <= 3
                    ? t("impulseExperience.low")
                    : intensity <= 6
                    ? t("impulseExperience.medium")
                    : t("impulseExperience.high")}
                </p>
              </div>

              <div className="mt-6">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={intensity}
                  onChange={(e) =>
                    setIntensity(Number(e.target.value))
                  }
                  aria-label={t("impulseExperience.intensityNow")}
                  className="w-full accent-[#C97B5E]"
                />

                <div className="mt-2 flex justify-between px-0.5 text-[9px] font-bold text-slate-300">
                  <span>1</span>
                  <span>5</span>
                  <span>10</span>
                </div>
              </div>
            </div>
          </div>
        )}"""

if old_step1 not in text:
    fail("passo 1 original não encontrado.")

text = text.replace(
    old_step1,
    new_step1,
    1
)


# ============================================================
# 4. INTENSIDADE FINAL PREMIUM
# ============================================================

old_step8 = """        {step === 8 && (
          <div>
           <h3>{t("impulseStep8")}</h3>
            <input 
              type="range" min="1" max="10" 
              value={finalIntensity} 
              onChange={(e) => setFinalIntensity(Number(e.target.value))} 
              style={{ width: "100%" }}
            />
            <p style={{ textAlign: "center", fontWeight: "bold", fontSize: "24px", color: "#198754" }}>{finalIntensity}</p>
          </div>
        )}"""

new_step8 = """        {step === 8 && (
          <div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[18px] border border-[#E5A88B]/20 bg-[#FFF8F4]">
                <Check
                  size={20}
                  strokeWidth={1.8}
                  className="text-[#C97B5E]"
                />
              </div>

              <h2 className="mt-4 text-xl font-black tracking-tight text-[#4E3B36]">
                {t("impulseExperience.intensityAfter")}
              </h2>

              <p className="mx-auto mt-2 max-w-[330px] text-xs font-semibold leading-relaxed text-slate-400">
                {t("impulseExperience.intensityAfterDesc")}
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2.5">
              <div className="rounded-[20px] border border-[#E8DDD7]/60 bg-[#FFF9F5] px-4 py-3 text-center">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                  {t("impulseExperience.initial")}
                </p>

                <p className="mt-1 text-xl font-black text-[#8B6B60]">
                  {intensity}
                  <span className="text-[10px] text-slate-300">
                    /10
                  </span>
                </p>
              </div>

              <div className="rounded-[20px] border border-[#E5A88B]/30 bg-white px-4 py-3 text-center shadow-sm">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#C97B5E]">
                  {t("impulseExperience.now")}
                </p>

                <p className="mt-1 text-xl font-black text-[#4E3B36]">
                  {finalIntensity}
                  <span className="text-[10px] text-slate-300">
                    /10
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-[26px] border border-[#E8DDD7]/65 bg-white/80 p-5">
              <div className="text-center">
                <span className="text-[42px] font-black leading-none tracking-[-0.05em] text-[#4E3B36]">
                  {finalIntensity}
                </span>

                <span className="ml-1 text-sm font-black text-[#B8AAA4]">
                  /10
                </span>

                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#C97B5E]">
                  {finalIntensity <= 3
                    ? t("impulseExperience.low")
                    : finalIntensity <= 6
                    ? t("impulseExperience.medium")
                    : t("impulseExperience.high")}
                </p>
              </div>

              <div className="mt-6">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={finalIntensity}
                  onChange={(e) =>
                    setFinalIntensity(Number(e.target.value))
                  }
                  aria-label={t("impulseExperience.intensityAfter")}
                  className="w-full accent-[#C97B5E]"
                />

                <div className="mt-2 flex justify-between px-0.5 text-[9px] font-bold text-slate-300">
                  <span>1</span>
                  <span>5</span>
                  <span>10</span>
                </div>
              </div>
            </div>
          </div>
        )}"""

if old_step8 not in text:
    fail("passo 8 original não encontrado.")

text = text.replace(
    old_step8,
    new_step8,
    1
)


# ============================================================
# 5. RODAPÉ PREMIUM
# ============================================================

old_footer = """      {/* Botões de Navegação (Rodapé) */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "30px", borderTop: "1px solid #eee", paddingTop: "15px" }}>
        <button 
          onClick={prevStep} 
          disabled={currentRouteIndex <= 0} 
          style={{ padding: "10px 20px", cursor: "pointer", background: "#fff", border: "1px solid #ccc", borderRadius: "4px" }}
        >
          {t("back")}
        </button>
        <button 
          onClick={nextStep} 
          style={{ padding: "10px 20px", background: "#0d6efd", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
        >
         {currentRouteIndex === activeRoute.length - 1
           ? t("finish")
           : t("next")}
        </button>
      </div>
    </div>"""

new_footer = """      </div>

      {/* Navegação premium */}
      <div className="relative flex items-center gap-3 border-t border-[#E8DDD7]/55 bg-white/70 px-5 py-4 backdrop-blur-sm">
        <button
          type="button"
          onClick={prevStep}
          disabled={currentRouteIndex <= 0}
          className={`flex h-12 items-center justify-center rounded-[18px] border px-4 transition-all ${
            currentRouteIndex <= 0
              ? "cursor-not-allowed border-[#EEE8E4] bg-[#F8F5F3] text-[#CFC4BF]"
              : "border-[#E8DDD7] bg-white text-[#8B6B60] active:scale-[0.98]"
          }`}
          aria-label={t("back")}
        >
          <ArrowLeft
            size={17}
            strokeWidth={1.9}
          />
        </button>

        <button
          type="button"
          onClick={nextStep}
          className="flex h-12 flex-1 items-center justify-between rounded-[18px] bg-[#C97B5E] px-4 text-white shadow-[0_8px_20px_rgba(201,123,94,0.18)] transition-transform active:scale-[0.99]"
        >
          <span className="text-xs font-black">
            {currentRouteIndex === activeRoute.length - 1
              ? t("finish")
              : t("next")}
          </span>

          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
            {currentRouteIndex === activeRoute.length - 1 ? (
              <Check
                size={15}
                strokeWidth={2}
              />
            ) : (
              <ArrowRight
                size={15}
                strokeWidth={2}
              />
            )}
          </span>
        </button>
      </div>
    </section>"""

if old_footer not in text:
    fail("rodapé original não encontrado.")

text = text.replace(
    old_footer,
    new_footer,
    1
)


# ============================================================
# 6. TRADUÇÕES
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

    if "impulseExperience" in data:
        if data["impulseExperience"] != values:
            fail(
                f"impulseExperience já existe com conteúdo diferente em {lang}."
            )
    else:
        data["impulseExperience"] = values

    updated_locales[path] = data


# ============================================================
# 7. VERIFICAÇÕES
# ============================================================

required = [
    't("impulseExperience.step"',
    't("impulseExperience.intensityNow")',
    't("impulseExperience.intensityAfter")',
    'className="w-full accent-[#C97B5E]"',
    "<ArrowLeft",
    "<ArrowRight",
    "<Check",
    "nextStep",
    "prevStep",
    "currentRouteIndex",
    "activeRoute",
    "finishSOS();",
    "saveEpisode({",
    'source: "impulse"',
]

for fragment in required:
    if fragment not in text:
        fail(f"verificação falhou: {fragment}")


# Garantir que elementos antigos comuns desapareceram.
if 'background: "#4CAF50"' in text:
    fail("barra verde antiga ainda existe.")

if (
    'color: "#0d6efd" }}>{intensity}</p>'
    in text
):
    fail("intensidade inicial antiga ainda existe.")

if (
    'color: "#198754" }}>{finalIntensity}</p>'
    in text
):
    fail("intensidade final antiga ainda existe.")


# IMPORTANTE:
# ainda podem existir azul/verde antigos noutros passos.
# Não os removemos nesta fase porque pertencem à 1C.4B.


# ============================================================
# 8. BACKUPS EM /tmp
# ============================================================

shutil.copy2(
    component,
    "/tmp/ImpulsoSOS.tsx.before_premium_experience"
)

for path in updated_locales:
    shutil.copy2(
        path,
        f"/tmp/{path.name}.before_impulse_experience"
    )


# ============================================================
# 9. ESCREVER
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
print("CONFIA — IMPULSO PREMIUM 1C.4A")
print("=" * 72)
print("✓ Contentor do percurso elevado")
print("✓ Progresso premium")
print("✓ Passo atual / total apresentado")
print("✓ Intensidade inicial premium")
print("✓ Intensidade final premium")
print("✓ Comparação antes/agora")
print("✓ Rodapé Voltar/Seguinte premium")
print("✓ Identidade visual CONFIA preservada")
print("✓ Rotas adaptativas preservadas")
print("✓ Reactive Engine preservado")
print("✓ saveEpisode preservado")
print("✓ XP preservado")
print("✓ Nenhum storage novo")
print("✓ Nenhuma dependência nova")
print("✓ PT / EN / ES / FR atualizados")
print()
print("OK — 1C.4A concluída.")
