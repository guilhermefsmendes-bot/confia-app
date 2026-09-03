from pathlib import Path
import shutil
import sys

path = Path("src/App.tsx")

if not path.exists():
    print("ERRO: src/App.tsx não encontrado.")
    sys.exit(1)

text = path.read_text(encoding="utf-8")
original = text

shutil.copy2(path, "/tmp/App.tsx.before_premium_daily_rating")

# =========================================================
# 1. ESTADO DO PAINEL
# =========================================================

state_marker = """  const [afternoonRating, setAfternoonRating] = useState<number>(5);"""

state_replacement = """  const [afternoonRating, setAfternoonRating] = useState<number>(5);
  const [showDayRatingPanel, setShowDayRatingPanel] = useState(false);"""

if "showDayRatingPanel" not in text:
    if state_marker not in text:
        print("ERRO: estado afternoonRating não encontrado.")
        sys.exit(1)

    text = text.replace(state_marker, state_replacement, 1)

# =========================================================
# 2. LOCALIZAR PAINEL ATUAL
# =========================================================

start_marker = """              {/* Day Rating Panel */}"""

start = text.find(start_marker)

if start == -1:
    print("ERRO: início do Day Rating Panel não encontrado.")
    sys.exit(1)

patterns_marker = """{/* Conhece os teus Padrões */}"""

patterns_pos = text.find(patterns_marker, start)

if patterns_pos == -1:
    print("ERRO: marcador dos Padrões não encontrado após o painel.")
    sys.exit(1)

# Antes de "Conhece os teus Padrões" existe o </div> que fecha a
# área principal da Home. Queremos preservá-lo.
outer_close = text.rfind("</div>", start, patterns_pos)

if outer_close == -1:
    print("ERRO: fecho exterior da Home não encontrado.")
    sys.exit(1)

old_block = text[start:outer_close]

required = [
    'value={selectedDate}',
    'value={morningRating}',
    'value={afternoonRating}',
    'value={noteText}',
    'onClick={handleSaveRatings}',
    't("saveDailyRecord")',
]

for item in required:
    if item not in old_block:
        print(f"ERRO: painel encontrado mas falta estrutura esperada: {item}")
        print("Nenhuma alteração foi gravada.")
        sys.exit(1)

# =========================================================
# 3. NOVO PAINEL PROGRESSIVO
# =========================================================

new_block = """              {/* Registo diário premium — progressivo e leve */}
              <section className="overflow-hidden rounded-[28px] border border-[#E5A88B]/15 bg-white shadow-sm">

                <button
                  type="button"
                  onClick={() => setShowDayRatingPanel((current) => !current)}
                  aria-expanded={showDayRatingPanel}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left transition-colors duration-200 active:bg-[#FFF9F5]"
                >
                  <div className="flex min-w-0 items-center gap-3.5">
                    <div className="w-11 h-11 shrink-0 rounded-2xl bg-[#FFF5EF] flex items-center justify-center">
                      <Calendar
                        size={19}
                        strokeWidth={1.8}
                        className="text-[#C97B5E]"
                      />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-[#4E3B36] font-display">
                        {t("classifyDay")}
                      </h3>

                      <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 font-semibold">
                        {t("wellbeingDescription")}
                      </p>
                    </div>
                  </div>

                  <span
                    aria-hidden="true"
                    className="shrink-0 w-8 h-8 rounded-full bg-[#FAF5F0] flex items-center justify-center text-[#C97B5E] text-lg font-light"
                  >
                    {showDayRatingPanel ? "−" : "+"}
                  </span>
                </button>

                {showDayRatingPanel && (
                  <div className="border-t border-[#E5A88B]/10 px-5 pb-5 pt-4 space-y-5">

                    {/* Data */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-[#4E3B36]">
                        {t("recordDate")}
                      </label>

                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-4 py-3 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:border-[#E5A88B] focus:ring-2 focus:ring-[#E5A88B]/15 bg-[#FAF5F0] font-bold text-[#4E3B36]"
                      />
                    </div>

                    {/* Manhã */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-[#C97B5E]">
                          <Sun size={15} strokeWidth={1.8} />
                          {t("morning")}
                        </span>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-[#4E3B36]">
                            {morningRating}
                          </span>

                          <span
                            className={`text-[10px] font-bold flex items-center gap-1 ${getRatingLabel(morningRating).color}`}
                          >
                            <span>{getRatingLabel(morningRating).emoji}</span>
                            <span>{getRatingLabel(morningRating).text}</span>
                          </span>
                        </div>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="1"
                        value={morningRating}
                        onChange={(e) => setMorningRating(Number(e.target.value))}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#E5A88B]"
                      />

                      <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                        <span>0 · {t("difficult")}</span>
                        <span>10 · {t("peaceful")}</span>
                      </div>
                    </div>

                    {/* Tarde */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-[#C97B5E]">
                          <Moon size={15} strokeWidth={1.8} />
                          {t("afternoon")}
                        </span>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-[#4E3B36]">
                            {afternoonRating}
                          </span>

                          <span
                            className={`text-[10px] font-bold flex items-center gap-1 ${getRatingLabel(afternoonRating).color}`}
                          >
                            <span>{getRatingLabel(afternoonRating).emoji}</span>
                            <span>{getRatingLabel(afternoonRating).text}</span>
                          </span>
                        </div>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="1"
                        value={afternoonRating}
                        onChange={(e) => setAfternoonRating(Number(e.target.value))}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#E5A88B]"
                      />

                      <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                        <span>0 · {t("difficult")}</span>
                        <span>10 · {t("peaceful")}</span>
                      </div>
                    </div>

                    {/* Nota opcional */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-[#4E3B36]">
                        {t("dailyNote")}
                      </label>

                      <input
                        type="text"
                        placeholder={t("dailyNotePlaceholder")}
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        maxLength={100}
                        className="w-full px-4 py-3 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:border-[#E5A88B] focus:ring-2 focus:ring-[#E5A88B]/15 bg-[#FAF5F0] font-bold text-[#4E3B36]"
                      />
                    </div>

                    {/* Guardar */}
                    <button
                      onClick={handleSaveRatings}
                      className="w-full py-3.5 bg-[#D59375] active:bg-[#C68060] text-white font-extrabold text-xs rounded-2xl transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={15} />

                      {todayLogged
                        ? t("updateTodayRecord")
                        : t("saveDailyRecord")}
                    </button>

                  </div>
                )}

              </section>

"""

text = text[:start] + new_block + text[outer_close:]

# =========================================================
# 4. VERIFICAÇÕES
# =========================================================

checks = [
    "showDayRatingPanel",
    'setShowDayRatingPanel((current) => !current)',
    'value={morningRating}',
    'value={afternoonRating}',
    'value={noteText}',
    'onClick={handleSaveRatings}',
]

for check in checks:
    if check not in text:
        print(f"ERRO de verificação: {check}")
        sys.exit(1)

if text == original:
    print("ERRO: nenhuma alteração foi produzida.")
    sys.exit(1)

path.write_text(text, encoding="utf-8")

print("=" * 72)
print("CONFIA — PREMIUM HOME 1A.3")
print("=" * 72)
print("✓ Registo diário passou a painel progressivo")
print("✓ Formulário fechado por defeito")
print("✓ Sliders não são renderizados enquanto fechado")
print("✓ Input de data não é renderizado enquanto fechado")
print("✓ Campo de nota não é renderizado enquanto fechado")
print("✓ Guardar / atualizar preservado")
print("✓ morningRating e afternoonRating preservados")
print("✓ selectedDate e noteText preservados")
print("✓ handleSaveRatings preservado")
print("✓ Sem Motion / AnimatePresence")
print("✓ Sem bibliotecas novas")
print("✓ Sem assets novos")
print()
print("OK — Fase 1A.3 aplicada.")
