from pathlib import Path
import shutil
import sys

APP = Path("src/App.tsx")
BACKUP = Path("/tmp/App.tsx.before_fase3a1_language")

if not APP.exists():
    print("ERRO: src/App.tsx não encontrado.")
    sys.exit(1)

text = APP.read_text(encoding="utf-8")

# ============================================================
# BACKUP
# ============================================================

shutil.copy2(APP, BACKUP)

# ============================================================
# LOCALIZAR O ECRÃ DE DEFINIÇÕES
# ============================================================

settings_marker = '{currentTab === 0 && homeScreen === "settings" && ('

settings_pos = text.find(settings_marker)

if settings_pos == -1:
    print("ERRO: ecrã de Definições não encontrado.")
    print("NENHUMA ALTERAÇÃO FOI FEITA.")
    sys.exit(1)

# ============================================================
# LOCALIZAR O FIM DO CABEÇALHO DAS DEFINIÇÕES
# ============================================================

header_end_marker = '''      </div>

  <div className="bg-white border border-[#E5A88B]/20 rounded-3xl p-5 shadow-sm mb-4">'''

header_pos = text.find(header_end_marker, settings_pos)

if header_pos == -1:
    print("ERRO: local de inserção das Definições não encontrado.")
    print("NENHUMA ALTERAÇÃO FOI FEITA.")
    sys.exit(1)

# ============================================================
# GARANTIR QUE A SECÇÃO AINDA NÃO EXISTE
# ============================================================

existing_marker = 'changeAppLanguage("pt")'

settings_end = text.find(
    '{currentTab === 0 && homeScreen !== "home"',
    settings_pos + len(settings_marker)
)

# Não usamos a existência global da função para detetar duplicação.
# Procuramos especificamente os botões dentro da zona de Settings.

settings_region_end = text.find(
    '{currentTab === 1',
    settings_pos
)

if settings_region_end == -1:
    settings_region_end = min(len(text), settings_pos + 15000)

settings_region = text[settings_pos:settings_region_end]

if (
    'changeAppLanguage("pt")' in settings_region
    or 'changeAppLanguage("en")' in settings_region
    or 'changeAppLanguage("es")' in settings_region
    or 'changeAppLanguage("fr")' in settings_region
):
    print("ERRO: seletor de idioma já parece existir nas Definições.")
    print("NENHUMA ALTERAÇÃO FOI FEITA.")
    sys.exit(1)

# ============================================================
# BLOCO MULTILINGUE
# ============================================================

language_block = '''
      {/* Idioma */}
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
# VALIDAR TRADUÇÕES NECESSÁRIAS
# ============================================================

required_keys = [
    '"language"',
    '"chooseLanguage"',
]

missing = []

for locale_name in ["pt", "en", "es", "fr"]:
    locale = Path(f"src/locales/{locale_name}.json")

    if not locale.exists():
        missing.append(f"{locale_name}.json inexistente")
        continue

    content = locale.read_text(encoding="utf-8")

    for key in required_keys:
        if key not in content:
            missing.append(f"{locale_name}: {key}")

if missing:
    print("ERRO: faltam traduções necessárias:")
    for item in missing:
        print(" -", item)
    print("NENHUMA ALTERAÇÃO FOI FEITA.")
    sys.exit(1)

# ============================================================
# INSERIR
# ============================================================

insert_at = settings_pos + header_pos - settings_pos + len(header_end_marker) - len('''

  <div className="bg-white border border-[#E5A88B]/20 rounded-3xl p-5 shadow-sm mb-4">''')

# Forma mais segura: encontrar a posição absoluta do início
# do cartão dos Termos.
terms_start = text.find(
    '''  <div className="bg-white border border-[#E5A88B]/20 rounded-3xl p-5 shadow-sm mb-4">''',
    settings_pos
)

if terms_start == -1:
    print("ERRO: cartão dos Termos da Comunidade não encontrado.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

updated = (
    text[:terms_start]
    + language_block
    + text[terms_start:]
)

# ============================================================
# VALIDAÇÕES
# ============================================================

# Todos os quatro botões devem existir exatamente uma vez.
for lang in ["pt", "en", "es", "fr"]:
    marker = f'changeAppLanguage("{lang}")'
    if updated.count(marker) != 1:
        print(f"ERRO: {marker} não aparece exatamente uma vez.")
        shutil.copy2(BACKUP, APP)
        sys.exit(1)

# A função original continua.
if "const changeAppLanguage" not in updated:
    print("ERRO: função changeAppLanguage desapareceu.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

# Componentes/lógica críticos continuam.
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

# ============================================================
# ESCREVER
# ============================================================

APP.write_text(updated, encoding="utf-8")

print("=" * 80)
print("CONFIA — FASE 3A.1 — IDIOMA NAS DEFINIÇÕES")
print("=" * 80)
print()
print("OK: backup criado em /tmp/App.tsx.before_fase3a1_language")
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
print("Próximo passo: auditar as linhas das Definições.")
print("=" * 80)
