from pathlib import Path
import shutil
import sys

APP = Path("src/App.tsx")
BACKUP = Path("/tmp/App.tsx.before_definicoes_idioma_final")

if not APP.exists():
    print("ERRO: src/App.tsx não encontrado.")
    sys.exit(1)

text = APP.read_text(encoding="utf-8")

# ============================================================
# BACKUP
# ============================================================

shutil.copy2(APP, BACKUP)

# ============================================================
# LOCALIZAR ECRÃ DE DEFINIÇÕES
# ============================================================

settings_marker = '{currentTab === 0 && homeScreen === "settings" && ('
settings_pos = text.find(settings_marker)

if settings_pos == -1:
    print("ERRO: ecrã de Definições não encontrado.")
    sys.exit(1)

# ============================================================
# LOCALIZAR CABEÇALHO "settings"
# ============================================================

settings_title = '{t("settings")}'
settings_title_pos = text.find(settings_title, settings_pos)

if settings_title_pos == -1:
    print("ERRO: título das Definições não encontrado.")
    sys.exit(1)

# Encontrar o fim do div do cabeçalho.
header_end = text.find('</div>', settings_title_pos)

if header_end == -1:
    print("ERRO: fim do cabeçalho das Definições não encontrado.")
    sys.exit(1)

header_end += len('</div>')

# ============================================================
# LOCALIZAR O CARTÃO "ELIMINAR OS MEUS DADOS"
# ============================================================

delete_marker = '<div className="bg-white border border-red-100 rounded-3xl p-5 shadow-sm">'

delete_pos = text.find(delete_marker, header_end)

if delete_pos == -1:
    print("ERRO: cartão de eliminação de dados não encontrado.")
    print("NENHUMA ALTERAÇÃO FOI FEITA.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

# ============================================================
# LOCALIZAR OS TERMOS DA COMUNIDADE
# ============================================================

community_marker = '{t("communityTerms")}'
community_pos = text.find(community_marker, header_end)

if community_pos == -1 or community_pos > delete_pos:
    print("ERRO: communityTerms não encontrado na zona esperada.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

# ============================================================
# EXTRAIR O CONTEÚDO ORIGINAL DOS TERMOS
# ============================================================

terms_h3_start = text.rfind("<h3", header_end, community_pos)

if terms_h3_start == -1:
    print("ERRO: <h3> dos Termos não encontrado.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

terms_card_start = text.rfind("<div", header_end, terms_h3_start)

if terms_card_start == -1:
    print("ERRO: início do cartão dos Termos não encontrado.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

# O cartão dos Termos termina antes do cartão de eliminação.
terms_card = text[terms_card_start:delete_pos].strip()

# ============================================================
# VALIDAR O CARTÃO DOS TERMOS
# ============================================================

for marker in [
    '{t("communityTerms")}',
    '{t("communityGuidelinesShort")}',
    '{t("communityTermsButton")}',
    'setShowCommunityTerms(true)',
]:
    if marker not in terms_card:
        print(f"ERRO: conteúdo dos Termos não contém: {marker}")
        shutil.copy2(BACKUP, APP)
        sys.exit(1)

# ============================================================
# CONSTRUIR NOVO CARTÃO DE IDIOMA
# ============================================================

language_card = '''<div className="bg-white border border-[#E5A88B]/20 rounded-3xl p-5 shadow-sm mb-4">
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
</div>'''

# ============================================================
# CONSTRUIR NOVA ZONA
# ============================================================

new_settings_content = (
    "\n\n"
    + language_card
    + "\n\n"
    + terms_card
    + "\n"
)

# ============================================================
# SUBSTITUIR APENAS A ZONA PROBLEMÁTICA
# ============================================================

updated = (
    text[:header_end]
    + new_settings_content
    + text[delete_pos:]
)

# ============================================================
# VALIDAÇÕES
# ============================================================

# Idioma exatamente uma vez
if updated.count('{t("language")}') != 1:
    print("ERRO: language não aparece exatamente uma vez.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

if updated.count('{t("chooseLanguage")}') != 1:
    print("ERRO: chooseLanguage não aparece exatamente uma vez.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

# Cada idioma exatamente uma vez
for lang in ["pt", "en", "es", "fr"]:
    marker = f'changeAppLanguage("{lang}")'

    if updated.count(marker) != 1:
        print(
            f"ERRO: {marker} aparece "
            f"{updated.count(marker)} vezes."
        )
        shutil.copy2(BACKUP, APP)
        sys.exit(1)

# Termos exatamente uma vez
if updated.count('{t("communityTerms")}') != 1:
    print("ERRO: communityTerms foi duplicado/removido.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

# Eliminação preservada
if updated.count('{t("deleteMyData")}') < 1:
    print("ERRO: deleteMyData desapareceu.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

if "handleDeleteAccountData" not in updated:
    print("ERRO: handleDeleteAccountData desapareceu.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

# Função de idioma preservada
if "const changeAppLanguage" not in updated:
    print("ERRO: changeAppLanguage desapareceu.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

# Componentes/lógica críticos
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
# VERIFICAR ORDEM FINAL
# ============================================================

language_pos = updated.find('{t("language")}')
community_pos_final = updated.find('{t("communityTerms")}')
delete_pos_final = updated.find('{t("deleteMyData")}')

if not (
    language_pos != -1
    and community_pos_final != -1
    and delete_pos_final != -1
):
    print("ERRO: não foi possível verificar a ordem final.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

if not (
    language_pos < community_pos_final < delete_pos_final
):
    print("ERRO: ordem dos cartões incorreta.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

# ============================================================
# ESCREVER
# ============================================================

APP.write_text(updated, encoding="utf-8")

print("=" * 80)
print("CONFIA — DEFINIÇÕES / IDIOMA — CORREÇÃO FINAL")
print("=" * 80)
print()
print("OK: backup criado.")
print("OK: bloco Idioma reconstruído como cartão independente.")
print("OK: Termos da Comunidade preservados.")
print("OK: Eliminar os meus dados preservado.")
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
print("ORDEM VALIDADA:")
print("  1. Idioma")
print("  2. Termos da Comunidade")
print("  3. Eliminar os meus dados")
print()
print("NÃO EXECUTAR BUILD AINDA.")
print("Próximo passo: verificar linhas 1350–1450.")
print("=" * 80)
