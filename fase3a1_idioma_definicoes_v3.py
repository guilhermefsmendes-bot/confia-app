from pathlib import Path
import shutil
import sys
import json

APP = Path("src/App.tsx")
BACKUP = Path("/tmp/App.tsx.before_fase3a1_language_v3")

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
# LOCALIZAR communityTerms DENTRO DAS DEFINIÇÕES
# ============================================================

terms_key = '{t("communityTerms")}'

terms_pos = text.find(terms_key, settings_pos)

if terms_pos == -1:
    print("ERRO: communityTerms não encontrado dentro das Definições.")
    print("NENHUMA ALTERAÇÃO FOI FEITA.")
    sys.exit(1)

# Encontrar o início do cartão/h3 que contém communityTerms.
# Usamos a linha imediatamente anterior ao <h3> real.
line_start = text.rfind("\n", settings_pos, terms_pos) + 1

# Retroceder até encontrar a abertura do h3.
h3_start = text.rfind("<h3", settings_pos, terms_pos)

if h3_start == -1:
    print("ERRO: <h3> de communityTerms não encontrado.")
    print("NENHUMA ALTERAÇÃO FOI FEITA.")
    sys.exit(1)

# ============================================================
# VERIFICAR SE JÁ EXISTE O BLOCO DE IDIOMA
# ============================================================

settings_end = text.find('{currentTab === 1 && (', terms_pos)

if settings_end == -1:
    settings_end = min(len(text), terms_pos + 10000)

settings_region = text[settings_pos:settings_end]

if '{t("language")}' in settings_region:
    print("ERRO: secção de idioma já existe nas Definições.")
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

    if "language" not in data:
        missing.append(f"{lang}: language")

    if "chooseLanguage" not in data:
        missing.append(f"{lang}: chooseLanguage")

if missing:
    print("ERRO: faltam traduções:")
    for item in missing:
        print(" -", item)
    print("NENHUMA ALTERAÇÃO FOI FEITA.")
    sys.exit(1)

# ============================================================
# BLOCO DE IDIOMA
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
# INSERIR ANTES DO CARTÃO DE TERMOS
# ============================================================

updated = text[:h3_start] + language_block + text[h3_start:]

# ============================================================
# VALIDAÇÕES
# ============================================================

# Os quatro botões devem existir.
for lang in ["pt", "en", "es", "fr"]:
    marker = f'changeAppLanguage("{lang}")'

    if updated.count(marker) != 1:
        print(
            f"ERRO: {marker} aparece "
            f"{updated.count(marker)} vezes."
        )
        shutil.copy2(BACKUP, APP)
        sys.exit(1)

# Função original preservada.
if "const changeAppLanguage" not in updated:
    print("ERRO: changeAppLanguage desapareceu.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

# Componentes importantes preservados.
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

# O bloco foi inserido antes de communityTerms.
new_language_pos = updated.find('{t("language")}', settings_pos)
new_terms_pos = updated.find('{t("communityTerms")}', settings_pos)

if new_language_pos == -1:
    print("ERRO: novo bloco de idioma não encontrado.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

if new_language_pos >= new_terms_pos:
    print("ERRO: idioma não ficou antes dos Termos.")
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
print("OK: backup criado em /tmp/App.tsx.before_fase3a1_language_v3")
print("OK: secção Idioma inserida.")
print("OK: Português.")
print("OK: English.")
print("OK: Español.")
print("OK: Français.")
print("OK: traduções confirmadas nos 4 idiomas.")
print("OK: idioma colocado antes dos Termos da Comunidade.")
print("OK: changeAppLanguage preservado.")
print("OK: HomeWorld preservado.")
print("OK: HomeProgressSummary preservado.")
print("OK: reactiveEngine preservado.")
print("OK: handleSaveRatings preservado.")
print()
print("NÃO EXECUTAR BUILD AINDA.")
print("Próximo passo: auditar linhas 1350–1435.")
print("=" * 80)
