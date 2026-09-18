from pathlib import Path
import shutil
import sys

APP = Path("src/App.tsx")
BACKUP = Path("/tmp/App.tsx.before_language_selector")

if not APP.exists():
    print("ERRO: src/App.tsx não encontrado.")
    sys.exit(1)

text = APP.read_text(encoding="utf-8")

# ============================================================
# LOCALIZAR DEFINIÇÕES
# ============================================================

settings_marker = '{currentTab === 0 && homeScreen === "settings" && ('
settings_pos = text.find(settings_marker)

if settings_pos == -1:
    print("ERRO: ecrã de Definições não encontrado.")
    sys.exit(1)

# ============================================================
# LOCALIZAR communityTerms
# ============================================================

terms_marker = '{t("communityTerms")}'
terms_pos = text.find(terms_marker, settings_pos)

if terms_pos == -1:
    print("ERRO: communityTerms não encontrado nas Definições.")
    sys.exit(1)

# Encontrar o <h3> que contém communityTerms
h3_pos = text.rfind("<h3", settings_pos, terms_pos)

if h3_pos == -1:
    print("ERRO: <h3> dos Termos não encontrado.")
    sys.exit(1)

# ============================================================
# VERIFICAR SE JÁ EXISTE
# ============================================================

settings_end = text.find('{currentTab === 1 && (', terms_pos)

if settings_end == -1:
    settings_end = min(len(text), terms_pos + 10000)

settings_region = text[settings_pos:settings_end]

if '{t("language")}' in settings_region:
    print("ERRO: seletor de idioma já existe nas Definições.")
    print("NENHUMA ALTERAÇÃO FOI FEITA.")
    sys.exit(1)

# ============================================================
# BLOCO DO SELETOR
# ============================================================

language_block = '''  {/* Idioma */}
  <div className="bg-white border border-[#E5A88B]/20 rounded-3xl p-5 shadow-sm mb-4">
    <h3 className="text-sm font-black text-[#4E3B36] mb-1">
      {t("language")}
    </h3>

    <p className="text-xs text-slate-500 leading-relaxed mb-4">
      {t("chooseLanguage")}
    </p>

    <div className="grid grid-cols-2 gap-2">
      <button
        onClick={() => changeAppLanguage("pt")}
        className="py-3 rounded-2xl border border-[#E5A88B]/30 bg-[#FFF0E8] text-[#C97B5E] font-black text-xs"
      >
        🇵🇹 Português
      </button>

      <button
        onClick={() => changeAppLanguage("en")}
        className="py-3 rounded-2xl border border-slate-200 bg-white text-[#4E3B36] font-black text-xs"
      >
        🇬🇧 English
      </button>

      <button
        onClick={() => changeAppLanguage("es")}
        className="py-3 rounded-2xl border border-slate-200 bg-white text-[#4E3B36] font-black text-xs"
      >
        🇪🇸 Español
      </button>

      <button
        onClick={() => changeAppLanguage("fr")}
        className="py-3 rounded-2xl border border-slate-200 bg-white text-[#4E3B36] font-black text-xs"
      >
        🇫🇷 Français
      </button>
    </div>
  </div>

'''

# ============================================================
# BACKUP
# ============================================================

shutil.copy2(APP, BACKUP)

# ============================================================
# INSERIR
# ============================================================

updated = text[:h3_pos] + language_block + text[h3_pos:]

# ============================================================
# VALIDAÇÕES
# ============================================================

for lang in ["pt", "en", "es", "fr"]:
    marker = f'changeAppLanguage("{lang}")'

    if updated.count(marker) != 1:
        print(
            f"ERRO: {marker} aparece "
            f"{updated.count(marker)} vezes."
        )
        shutil.copy2(BACKUP, APP)
        sys.exit(1)

# Confirmar função existente
if "const changeAppLanguage" not in updated:
    print("ERRO: changeAppLanguage desapareceu.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

# Confirmar componentes críticos
for marker in [
    "<HomeWorld",
    "<HomeProgressSummary />",
    "reactiveMessageKey",
    "analyzeReactiveState",
    "handleSaveRatings",
]:
    if marker not in updated:
        print(f"ERRO: {marker} desapareceu.")
        shutil.copy2(BACKUP, APP)
        sys.exit(1)

# Confirmar posição
language_pos = updated.find('{t("language")}', settings_pos)
new_terms_pos = updated.find('{t("communityTerms")}', settings_pos)

if language_pos == -1:
    print("ERRO: bloco de idioma não encontrado após inserção.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

if language_pos >= new_terms_pos:
    print("ERRO: Idioma não ficou antes dos Termos.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

# ============================================================
# ESCREVER
# ============================================================

APP.write_text(updated, encoding="utf-8")

print("=" * 80)
print("CONFIA — FASE 3A.1 — SELETOR DE IDIOMA")
print("=" * 80)
print()
print("OK: backup criado em /tmp/App.tsx.before_language_selector")
print("OK: secção Idioma adicionada às Definições.")
print("OK: Português.")
print("OK: English.")
print("OK: Español.")
print("OK: Français.")
print("OK: changeAppLanguage preservado.")
print("OK: HomeWorld preservado.")
print("OK: HomeProgressSummary preservado.")
print("OK: reactiveEngine preservado.")
print("OK: handleSaveRatings preservado.")
print()
print("NÃO EXECUTAR BUILD AINDA.")
print("Próximo passo: auditoria.")
print("=" * 80)
