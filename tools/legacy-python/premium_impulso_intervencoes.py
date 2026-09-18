from pathlib import Path
import shutil
import sys

path = Path("src/components/ImpulsoSOS.tsx")

if not path.exists():
    print("ERRO: ImpulsoSOS.tsx não encontrado.")
    sys.exit(1)

text = path.read_text(encoding="utf-8")
original = text


def replace_once(old, new, label):
    global text

    if old not in text:
        print(f"ERRO: {label} não encontrado.")
        sys.exit(1)

    text = text.replace(old, new, 1)


# ============================================================
# 1. ÍCONES
# ============================================================

old = """  ArrowLeft,
  ArrowRight,
  Brain,
  Check,
  Compass,
  HeartHandshake,
  Sparkles,
  Wind,"""

new = """  ArrowLeft,
  ArrowRight,
  Brain,
  Check,
  Compass,
  Heart,
  HeartHandshake,
  Lightbulb,
  MapPin,
  Search,
  Sparkles,
  Wind,"""

replace_once(old, new, "imports Lucide")


# ============================================================
# 2. PASSO 2 — GATILHO
# ============================================================

old = """        {step === 2 && (
          <div>
           <h3>{t("impulseStep2")}</h3>
            {triggers.map((t) => (
              <button 
                key={t} 
                onClick={() => setTrigger(t)}
                style={{ display: "block", width: "100%", margin: "8px 0", padding: "10px", background: trigger === t ? "#d1e7dd" : "#f8f9fa", border: trigger === t ? "1px solid #198754" : "1px solid #ccc", borderRadius: "4px", textAlign: "left", cursor: "pointer" }}
              >
                {t}
              </button>
            ))}
          </div>
        )}"""

new = """        {step === 2 && (
          <div>
            <div className="mb-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-[#E5A88B]/20 bg-[#FFF8F4]">
                <MapPin
                  size={18}
                  strokeWidth={1.8}
                  className="text-[#C97B5E]"
                />
              </div>

              <h2 className="mt-3 text-xl font-black tracking-tight text-[#4E3B36]">
                {t("impulseStep2")}
              </h2>
            </div>

            <div className="space-y-2.5">
              {triggers.map((item) => {
                const selected = trigger === item;

                return (
                  <button
                    type="button"
                    key={item}
                    onClick={() => setTrigger(item)}
                    className={`flex w-full items-center gap-3 rounded-[20px] border px-4 py-3.5 text-left transition-all active:scale-[0.99] ${
                      selected
                        ? "border-[#E5A88B]/55 bg-[#FFF5EF] shadow-[0_7px_18px_rgba(201,123,94,0.08)]"
                        : "border-[#E8DDD7]/65 bg-white/80"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                        selected
                          ? "border-[#C97B5E] bg-[#C97B5E] text-white"
                          : "border-[#DED4CF] bg-white text-transparent"
                      }`}
                    >
                      <Check size={13} strokeWidth={2.2} />
                    </span>

                    <span
                      className={`text-[13px] font-bold leading-snug ${
                        selected
                          ? "text-[#4E3B36]"
                          : "text-[#6F625E]"
                      }`}
                    >
                      {item}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}"""

replace_once(old, new, "passo 2")


# ============================================================
# 3. PASSO 3 — EMOÇÃO
# ============================================================

old = """        {step === 3 && (
          <div>
           <h3>{t("impulseStep3")}</h3>
            {emotions.map((e) => (
              <button 
                key={e} 
                onClick={() => setEmotion(e)}
                style={{ display: "block", width: "100%", margin: "8px 0", padding: "10px", background: emotion === e ? "#d1e7dd" : "#f8f9fa", border: emotion === e ? "1px solid #198754" : "1px solid #ccc", borderRadius: "4px", textAlign: "left", cursor: "pointer" }}
              >
                {e}
              </button>
            ))}
          </div>
        )}"""

new = """        {step === 3 && (
          <div>
            <div className="mb-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-[#E5A88B]/20 bg-[#FFF8F4]">
                <Heart
                  size={18}
                  strokeWidth={1.8}
                  className="text-[#C97B5E]"
                />
              </div>

              <h2 className="mt-3 text-xl font-black tracking-tight text-[#4E3B36]">
                {t("impulseStep3")}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {emotions.map((item) => {
                const selected = emotion === item;

                return (
                  <button
                    type="button"
                    key={item}
                    onClick={() => setEmotion(item)}
                    className={`flex w-full items-center gap-3 rounded-[20px] border px-4 py-3.5 text-left transition-all active:scale-[0.99] ${
                      selected
                        ? "border-[#E5A88B]/55 bg-[#FFF5EF] shadow-[0_7px_18px_rgba(201,123,94,0.08)]"
                        : "border-[#E8DDD7]/65 bg-white/80"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                        selected
                          ? "border-[#C97B5E] bg-[#C97B5E] text-white"
                          : "border-[#DED4CF] bg-white text-transparent"
                      }`}
                    >
                      <Check size={13} strokeWidth={2.2} />
                    </span>

                    <span
                      className={`text-[13px] font-bold leading-snug ${
                        selected
                          ? "text-[#4E3B36]"
                          : "text-[#6F625E]"
                      }`}
                    >
                      {item}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}"""

replace_once(old, new, "passo 3")


# ============================================================
# 4. PASSO 4 — PENSAMENTO
# Mantém exatamente o avanço adaptativo.
# ============================================================

start_marker = "{step === 4 && ("
end_marker = "{step === 5 && ("

start = text.find(start_marker)

if start == -1:
    print("ERRO: início do passo 4 não encontrado.")
    sys.exit(1)

end = text.find(end_marker, start)

if end == -1:
    print("ERRO: fim do passo 4 não encontrado.")
    sys.exit(1)

old = text[start:end]

if "activeRoute.indexOf(4)" not in old:
    print("ERRO: lógica adaptativa do passo 4 não encontrada.")
    sys.exit(1)

new = """{step === 4 && (
          <div>
            <div className="mb-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-[#E5A88B]/20 bg-[#FFF8F4]">
                <Brain
                  size={18}
                  strokeWidth={1.8}
                  className="text-[#C97B5E]"
                />
              </div>

              <h2 className="mt-3 text-xl font-black tracking-tight text-[#4E3B36]">
                {t("impulseStep4")}
              </h2>
            </div>

            <div className="space-y-2.5">
              {thoughts.map((item) => {
                const selected = thought === item;

                return (
                  <button
                    type="button"
                    key={item}
                    onClick={() => {
                      setThought(item);

                      const routeIndex =
                        activeRoute.indexOf(4);

                      if (
                        routeIndex >= 0 &&
                        routeIndex < activeRoute.length - 1
                      ) {
                        setStep(
                          activeRoute[routeIndex + 1]
                        );
                      }
                    }}
                    className={`group flex w-full items-center justify-between gap-3 rounded-[20px] border px-4 py-4 text-left transition-all active:scale-[0.99] ${
                      selected
                        ? "border-[#E5A88B]/55 bg-[#FFF5EF]"
                        : "border-[#E8DDD7]/65 bg-white/80"
                    }`}
                  >
                    <span className="text-[13px] font-bold leading-snug text-[#5F504B]">
                      {item}
                    </span>

                    <ArrowRight
                      size={15}
                      strokeWidth={1.9}
                      className="shrink-0 text-[#C97B5E]"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        """

text = text[:start] + new + text[end:]


# ============================================================
# 5. PASSO 5 — COMPREENSÃO PREMIUM
# ============================================================

start_marker = "{step === 5 && ("
end_marker = "{step === 6 && ("

start = text.find(start_marker)

if start == -1:
    print("ERRO: início do passo 5 não encontrado.")
    sys.exit(1)

end = text.find(end_marker, start)

if end == -1:
    print("ERRO: fim do passo 5 não encontrado.")
    sys.exit(1)

old = text[start:end]

required_step5 = [
    't("identifiedSoFar")',
    "getPsychoeducationMessage()",
    't("anxietyCycle")',
    't("cycleAnxiety")',
    't("cycleSearch")',
    't("cycleTemporaryRelief")',
    't("cycleNewDoubts")',
    't("cycleMoreAnxiety")',
    't("cycleExplanation")',
]

for fragment in required_step5:
    if fragment not in old:
        print(f"ERRO: passo 5 não contém {fragment}")
        sys.exit(1)

new = """{step === 5 && (
          <div>
            <div className="mb-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-[#E5A88B]/20 bg-[#FFF8F4]">
                <Lightbulb
                  size={18}
                  strokeWidth={1.8}
                  className="text-[#C97B5E]"
                />
              </div>

              <h2 className="mt-3 text-xl font-black tracking-tight text-[#4E3B36]">
                {t("impulseStep5")}
              </h2>
            </div>

            <div className="rounded-[24px] border border-[#E8DDD7]/65 bg-white/80 p-4">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#C97B5E]">
                {t("identifiedSoFar")}
              </p>

              <div className="mt-4 space-y-2">
                {trigger && (
                  <div className="flex items-start gap-3 rounded-[17px] bg-[#FFF9F5] px-3.5 py-3">
                    <MapPin
                      size={15}
                      strokeWidth={1.8}
                      className="mt-0.5 shrink-0 text-[#C97B5E]"
                    />

                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                        {t("trigger")}
                      </p>

                      <p className="mt-0.5 text-xs font-bold leading-snug text-[#4E3B36]">
                        {trigger}
                      </p>
                    </div>
                  </div>
                )}

                {emotion && (
                  <div className="flex items-start gap-3 rounded-[17px] bg-[#FFF9F5] px-3.5 py-3">
                    <Heart
                      size={15}
                      strokeWidth={1.8}
                      className="mt-0.5 shrink-0 text-[#C97B5E]"
                    />

                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                        {t("emotion")}
                      </p>

                      <p className="mt-0.5 text-xs font-bold leading-snug text-[#4E3B36]">
                        {emotion}
                      </p>
                    </div>
                  </div>
                )}

                {thought && (
                  <div className="flex items-start gap-3 rounded-[17px] bg-[#FFF9F5] px-3.5 py-3">
                    <Brain
                      size={15}
                      strokeWidth={1.8}
                      className="mt-0.5 shrink-0 text-[#C97B5E]"
                    />

                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                        {t("thought")}
                      </p>

                      <p className="mt-0.5 text-xs font-bold leading-snug text-[#4E3B36]">
                        {thought}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 rounded-[24px] border border-[#F0D8C9]/70 bg-gradient-to-br from-[#FFF8F3] to-[#FFFDFC] p-4">
              <div className="flex items-start gap-3">
                <Sparkles
                  size={16}
                  strokeWidth={1.8}
                  className="mt-0.5 shrink-0 text-[#C97B5E]"
                />

                <p className="whitespace-pre-line text-xs font-semibold leading-relaxed text-[#6B5750]">
                  {getPsychoeducationMessage()}
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-[24px] border border-[#E8DDD7]/65 bg-white p-4">
              <div className="flex items-center gap-2">
                <Search
                  size={15}
                  strokeWidth={1.8}
                  className="text-[#C97B5E]"
                />

                <h3 className="text-xs font-black text-[#4E3B36]">
                  {t("anxietyCycle")}
                </h3>
              </div>

              <div className="mt-4 space-y-1.5">
                {[
                  t("cycleAnxiety"),
                  t("cycleSearch"),
                  t("cycleTemporaryRelief"),
                  t("cycleNewDoubts"),
                  t("cycleMoreAnxiety"),
                ].map((label, index) => (
                  <React.Fragment key={`${label}-${index}`}>
                    <div className="flex items-center gap-3 rounded-[16px] bg-[#FFF9F5] px-3 py-2.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[9px] font-black text-[#C97B5E] shadow-sm">
                        {index + 1}
                      </span>

                      <span className="text-[11px] font-bold leading-snug text-[#5F504B]">
                        {label}
                      </span>
                    </div>

                    {index < 4 && (
                      <div className="flex justify-center text-[#D8B7A7]">
                        <span className="text-xs">↓</span>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>

              <p className="mt-4 border-t border-[#EFE6E1] pt-3 text-center text-[10px] font-semibold italic leading-relaxed text-slate-400">
                {t("cycleExplanation")}
              </p>
            </div>
          </div>
        )}

        """

text = text[:start] + new + text[end:]


# ============================================================
# 6. PASSO 6 — RESPIRAÇÃO PREMIUM
# Sem timers, listeners ou novas animações permanentes.
# ============================================================

start_marker = "{step === 6 && ("
end_marker = "{step === 7 && ("

start = text.find(start_marker)

if start == -1:
    print("ERRO: início do passo 6 não encontrado.")
    sys.exit(1)

end = text.find(end_marker, start)

if end == -1:
    print("ERRO: fim do passo 6 não encontrado.")
    sys.exit(1)

old = text[start:end]

required_step6 = [
    't("impulseStep6")',
    't("inhale")',
    't("inhaleDescription")',
    't("holdBreath")',
    't("holdBreathDescription")',
    't("exhale")',
    't("exhaleDescription")',
    't("repeatBreathing")',
]

for fragment in required_step6:
    if fragment not in old:
        print(f"ERRO: passo 6 não contém {fragment}")
        sys.exit(1)

new = """{step === 6 && (
          <div>
            <div className="text-center">
              <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-[#E5A88B]/25 bg-gradient-to-br from-[#FFF8F4] to-white shadow-[0_12px_30px_rgba(201,123,94,0.10)]">
                <div className="absolute inset-2 rounded-full border border-[#E5A88B]/15" />

                <Wind
                  size={30}
                  strokeWidth={1.4}
                  className="relative text-[#C97B5E]"
                />
              </div>

              <h2 className="mt-5 text-xl font-black tracking-tight text-[#4E3B36]">
                {t("impulseStep6")}
              </h2>
            </div>

            <div className="mt-6 space-y-2.5">
              <div className="flex items-center gap-3 rounded-[20px] border border-[#E8DDD7]/60 bg-white/80 px-4 py-3.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFF3EC] text-[10px] font-black text-[#C97B5E]">
                  1
                </span>

                <div>
                  <p className="text-xs font-black text-[#4E3B36]">
                    {t("inhale")}
                  </p>

                  <p className="mt-0.5 text-[10px] font-semibold leading-relaxed text-slate-400">
                    {t("inhaleDescription")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-[20px] border border-[#E8DDD7]/60 bg-white/80 px-4 py-3.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFF3EC] text-[10px] font-black text-[#C97B5E]">
                  2
                </span>

                <div>
                  <p className="text-xs font-black text-[#4E3B36]">
                    {t("holdBreath")}
                  </p>

                  <p className="mt-0.5 text-[10px] font-semibold leading-relaxed text-slate-400">
                    {t("holdBreathDescription")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-[20px] border border-[#E8DDD7]/60 bg-white/80 px-4 py-3.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFF3EC] text-[10px] font-black text-[#C97B5E]">
                  3
                </span>

                <div>
                  <p className="text-xs font-black text-[#4E3B36]">
                    {t("exhale")}
                  </p>

                  <p className="mt-0.5 text-[10px] font-semibold leading-relaxed text-slate-400">
                    {t("exhaleDescription")}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-[18px] bg-[#FFF8F4] px-4 py-3 text-center">
              <p className="text-[10px] font-semibold italic leading-relaxed text-[#8B6B60]">
                {t("repeatBreathing")}
              </p>
            </div>
          </div>
        )}

        """

text = text[:start] + new + text[end:]


# ============================================================
# 7. VERIFICAÇÕES
# ============================================================

required = [
    "<MapPin",
    "<Heart",
    "<Brain",
    "<Lightbulb",
    "<Search",
    "<Wind",
    'activeRoute.indexOf(4)',
    "getPsychoeducationMessage()",
    't("cycleAnxiety")',
    't("cycleMoreAnxiety")',
    't("inhaleDescription")',
    't("holdBreathDescription")',
    't("exhaleDescription")',
    't("repeatBreathing")',
    'impulseNeed === "support"',
    "finishSOS();",
    "saveEpisode({",
    'source: "impulse"',
    "recordReactiveResponse({",
    "onAddXp(30)",
]

for fragment in required:
    if fragment not in text:
        print(f"ERRO: verificação final falhou: {fragment}")
        sys.exit(1)


# Estes estilos antigos pertenciam especificamente aos passos 2/3.
if 'background: trigger === t ? "#d1e7dd"' in text:
    print("ERRO: estilo antigo do gatilho ainda existe.")
    sys.exit(1)

if 'background: emotion === e ? "#d1e7dd"' in text:
    print("ERRO: estilo antigo da emoção ainda existe.")
    sys.exit(1)


# ============================================================
# 8. BACKUP
# ============================================================

shutil.copy2(
    path,
    "/tmp/ImpulsoSOS.tsx.before_premium_interventions"
)


# ============================================================
# 9. ESCREVER
# ============================================================

path.write_text(text, encoding="utf-8")


print("=" * 72)
print("CONFIA — IMPULSO PREMIUM 1C.4B")
print("=" * 72)
print("✓ Gatilhos convertidos em cartões premium")
print("✓ Emoções convertidas em cartões premium")
print("✓ Pensamentos convertidos em cartões premium")
print("✓ Avanço adaptativo dos pensamentos preservado")
print("✓ Compreensão reorganizada visualmente")
print("✓ Gatilho → emoção → pensamento apresentados com Lucide")
print("✓ Psicoeducação preservada")
print("✓ Ciclo reorganizado numa sequência premium")
print("✓ Respiração transformada numa experiência focada")
print("✓ Sem timers ou listeners adicionais")
print("✓ Rotas adaptativas preservadas")
print("✓ Reactive Engine preservado")
print("✓ saveEpisode preservado")
print("✓ XP preservado")
print("✓ Nenhum storage novo")
print("✓ Nenhuma dependência nova")
print("✓ Sem novo texto visível — traduções existentes reutilizadas")
print()
print("OK — 1C.4B concluída.")
