from pathlib import Path
import shutil
import sys

APP = Path("src/App.tsx")
BACKUP = Path("/tmp/App.tsx.before_fase3a1")

if not APP.exists():
    print("ERRO: src/App.tsx não encontrado.")
    sys.exit(1)

text = APP.read_text(encoding="utf-8")
shutil.copy2(APP, BACKUP)

# ============================================================
# 1. SEGUNDO LOGO + CONFIA + TAGLINE
# ============================================================

old_logo = '''                {/* Logo da App */}
                  <div className="flex flex-col items-center justify-center pt-2 pb-1 text-center space-y-2 border-b border-slate-50 pb-4">
  <div className="flex items-center justify-center w-12 h-12">
  <img
    src="/images/confia-icon.png"
    alt="Confia"
    className="w-12 h-12 rounded-2xl shadow-md"
  />
                    </div>
                    <div className="space-y-0.5">
                      <h2 className="text-base font-black tracking-tight text-[#4E3B36] font-display">
                        Confia
                      </h2>
                      <p className="text-[9px] text-[#C97B5E] font-extrabold uppercase tracking-widest font-display">
                       {t("tagline")}
                      </p>
                    </div>
                  </div>
'''

if old_logo not in text:
    print("ERRO: segundo logo não encontrado exatamente.")
    print("NENHUMA ALTERAÇÃO FOI FEITA.")
    sys.exit(1)

# ============================================================
# 2. SELETOR DE IDIOMAS
# ============================================================

old_languages = '''  <div className="flex justify-center gap-2 py-2">
    <button onClick={() => changeAppLanguage("pt")}>🇵🇹</button>
    <button onClick={() => changeAppLanguage("en")}>🇬🇧</button>
    <button onClick={() => changeAppLanguage("es")}>🇪🇸</button>
    <button onClick={() => changeAppLanguage("fr")}>🇫🇷</button>
  </div>
'''

if old_languages not in text:
    print("ERRO: seletor de idiomas não encontrado exatamente.")
    print("NENHUMA ALTERAÇÃO FOI FEITA.")
    sys.exit(1)

# ============================================================
# 3. GARANTIR QUE SÓ ESTAMOS A REMOVER O LOGO DA HOME
# ============================================================

home_start = text.find('{currentTab === 0 && homeScreen === "home" && (')

if home_start == -1:
    print("ERRO: Home principal não encontrada.")
    print("NENHUMA ALTERAÇÃO FOI FEITA.")
    sys.exit(1)

logo_pos = text.find(old_logo)

if logo_pos == -1 or logo_pos < home_start:
    print("ERRO: segundo logo não está dentro da Home esperada.")
    print("NENHUMA ALTERAÇÃO FOI FEITA.")
    sys.exit(1)

language_pos = text.find(old_languages)

if language_pos == -1 or language_pos < home_start:
    print("ERRO: seletor de idiomas não está dentro da Home esperada.")
    print("NENHUMA ALTERAÇÃO FOI FEITA.")
    sys.exit(1)

# ============================================================
# 4. APLICAÇÃO
# ============================================================

updated = text.replace(old_logo, "", 1)
updated = updated.replace(old_languages, "", 1)

# ============================================================
# 5. VALIDAÇÕES
# ============================================================

# O logo do header deve continuar.
if updated.count('src="/images/confia-icon.png"') != text.count('src="/images/confia-icon.png"') - 1:
    print("ERRO: número de logos alterado incorretamente.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

# A função de mudança de idioma continua.
if "const changeAppLanguage" not in updated:
    print("ERRO: changeAppLanguage desapareceu.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

# Os quatro idiomas continuam implementados na função.
for lang in ["pt", "en", "es", "fr"]:
    if f'changeAppLanguage("{lang}")' not in updated and \
       f"changeAppLanguage('{lang}')" not in updated:
        print(f"ERRO: suporte ao idioma {lang} desapareceu.")
        shutil.copy2(BACKUP, APP)
        sys.exit(1)

# Componentes importantes permanecem.
for marker in [
    "<HomeWorld",
    "<HomeProgressSummary />",
    "reactiveMessageKey",
    "analyzeReactiveState",
    "handleSaveRatings",
]:
    if marker not in updated:
        print(f"ERRO: componente/lógica {marker} desapareceu.")
        shutil.copy2(BACKUP, APP)
        sys.exit(1)

# ============================================================
# 6. ESCREVER
# ============================================================

APP.write_text(updated, encoding="utf-8")

print("=" * 80)
print("CONFIA — FASE 3A.1 — LIMPEZA DA HOME")
print("=" * 80)
print()
print("OK: backup criado.")
print("OK: segundo logo removido da Home.")
print("OK: Confia duplicado removido.")
print("OK: tagline duplicada removida.")
print("OK: seletor PT/EN/ES/FR removido da Home.")
print("OK: changeAppLanguage preservado.")
print("OK: suporte aos 4 idiomas preservado.")
print("OK: HomeWorld preservado.")
print("OK: HomeProgressSummary preservado.")
print("OK: reactiveEngine preservado.")
print("OK: handleSaveRatings preservado.")
print()
print("NÃO EXECUTAR BUILD AINDA.")
print("Próximo passo: auditar o diff.")
print("=" * 80)
