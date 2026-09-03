from pathlib import Path
import shutil
import sys
import json

APP = Path("src/App.tsx")
BACKUP = Path("/tmp/App.tsx.before_fase3a1_language_v2")

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
# LOCALIZAR O PRIMEIRO CARTÃO DAS DEFINIÇÕES
# ============================================================

terms_marker = '''  <div className="bg-white border border-[#E5A88B]/20 rounded-3xl p-5 shadow-sm mb-4">'''

terms_pos = text.find(terms_marker, settings_pos)

if terms_pos == -1:
    print("ERRO: primeiro cartão das Definições não encontrado.")
    print("NENHUMA ALTERAÇÃO FOI FEITA.")
    sys.exit(1)

# ============================================================
# GARANTIR QUE ESTAMOS NO CARTÃO DE TERMOS
# ============================================================

terms_section = text[terms_pos:terms_pos + 1200]

if 't("communityTerms")' not in terms_section:
    print("ERRO: cartão encontrado não corresponde aos Termos da Comunidade.")
    print("NENHUMA ALTERAÇÃO FOI FEITA.")
    sys.exit(1)

# ============================================================
# VERIFICAR SE O SELETOR JÁ EXISTE NAS DEFINIÇÕES
# ============================================================

settings_end = text.find('{currentTab === 1 && (', terms_pos)

if settings_end == -1:
    settings_end = min(len(text), terms_pos + 10000)

settings_region = text[settings_pos:settings_end]

if 'changeAppLanguage("pt")' in settings_region:
    print("ERRO: seletor de idioma já existe nas Definições.")
    print("NENHUMA ALTERAÇÃO FOI FEITA.")
    sys.exit(1)

# ============================================================
# VERIFICAR TRADUÇÕES
# ============================================================

missing = []

for lang in ["pt", "en", "es", "fr"]:
    path = Path(f"src/locales/{lang}.json")

    if not path.exists():
        missing.append(f"{lang}.json não encontrado")
        continue

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:
        missing.append(f"{lang}.json inválido: {e}")
        continue

    for key in ["language", "chooseLanguage"]:
        if key not in data:
            missing.append(f"{lang}: {key}")

if missing:
    print("ERRO: faltam traduções necessárias.")
    for item in missing:
        print(" -", item)
    print()
    print("NENHUMA ALTERAÇÃO FOI FEITA.")
    sys.exit(1)

# ============================================================
# BLOCO A INSERIR
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

updated = text[:terms_pos] + language_block + text[terms_pos:]

# ============================================================
# VALIDAÇÕES
# ============================================================

# Cada botão deve existir uma única vez no ficheiro.
for lang in ["pt", "en", "es", "fr"]:
    marker = f'changeAppLanguage("{lang}")'

    if updated.count(marker) != 1:
        print(f"ERRO: {marker} não aparece exatamente uma vez.")
        shutil.copy2(BACKUP, APP)
        sys.exit(1)

# A função original continua.
if "const changeAppLanguage" not in updated:
    print("ERRO: changeAppLanguage desapareceu.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

# Os componentes/lógica anteriores continuam.
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

# A Home não pode voltar a ter os botões de idioma.
home_end = updated.find('{currentTab === 1 && (', settings_pos)

if home_end == -1:
    home_end = min(len(updated), settings_pos + 10000)

# Apenas verificamos a zona anterior às Definições.
home_region = updated[:settings_pos]

for lang in ["pt", "en", "es", "fr"]:
    marker = f'changeAppLanguage("{lang}")'

    # Pode existir apenas na função e no bloco das Definições.
    occurrences = updated.count(marker)

    if occurrences != 1:
        print(f"ERRO: número inesperado de ocorrências de {marker}: {occurrences}")
        shutil.copy2(BACKUP, APP)
        sys.exit(1)

# ============================================================
# ESCREVER
# ============================================================

APP.write_text(updated, encoding="utf-8")

print("=" * 80)
print("CONFIA — FASE 3A.1 — IDIOMA NAS DEFINIÇÕES")
print("=" * 80)
print()
print("OK: backup criado.")
print("OK: secção Idioma inserida antes dos Termos da Comunidade.")
print("OK: PT — Português.")
print("OK: EN — English.")
print("OK: ES — Español.")
print("OK: FR — Français.")
print("OK: traduções language/chooseLanguage confirmadas nos 4 idiomas.")
print("OK: changeAppLanguage preservado.")
print("OK: HomeWorld preservado.")
print("OK: HomeProgressSummary preservado.")
print("OK: reactiveEngine preservado.")
print("OK: handleSaveRatings preservado.")
print()
print("NÃO EXECUTAR BUILD AINDA.")
print("Próximo passo: auditar as linhas das Definições.")
print("=" * 80)
