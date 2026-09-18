from pathlib import Path
import shutil
import sys

APP = Path("src/App.tsx")
BACKUP = Path("/tmp/App.tsx.before_cartoes_definicoes")

text = APP.read_text(encoding="utf-8")

# ============================================================
# BACKUP
# ============================================================

shutil.copy2(APP, BACKUP)

# ============================================================
# LOCALIZAR ZONA DAS DEFINIÇÕES
# ============================================================

settings_pos = text.find(
    '{currentTab === 0 && homeScreen === "settings" && ('
)

if settings_pos == -1:
    print("ERRO: Definições não encontradas.")
    sys.exit(1)

# ============================================================
# ÂNCORAS
# ============================================================

language_marker = '      {/* Idioma */}'
community_marker = '{t("communityTerms")}'
delete_marker = '<div className="bg-white border border-red-100 rounded-3xl p-5 shadow-sm">'

language_pos = text.find(language_marker, settings_pos)
community_pos = text.find(community_marker, settings_pos)
delete_pos = text.find(delete_marker, settings_pos)

if language_pos == -1:
    print("ERRO: bloco Idioma não encontrado.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

if community_pos == -1:
    print("ERRO: communityTerms não encontrado.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

if delete_pos == -1:
    print("ERRO: cartão deleteMyData não encontrado.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

if not (language_pos < community_pos < delete_pos):
    print("ERRO: ordem inesperada dos elementos.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

# ============================================================
# LOCALIZAR O DIV EXTERIOR QUE ENGLOBA IDIOMA + TERMOS
# ============================================================

outer_start = text.rfind("<div", settings_pos, language_pos)

if outer_start == -1:
    print("ERRO: container exterior não encontrado.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

# ============================================================
# ENCONTRAR O FIM DO CONTAINER EXTERIOR
# ============================================================

# Neste trecho sabemos que o container exterior fecha
# imediatamente antes do cartão deleteMyData.
#
# Vamos usar o fechamento </div> imediatamente anterior
# ao cartão vermelho.

before_delete = text[:delete_pos]

outer_end = before_delete.rfind("</div>")

if outer_end == -1 or outer_end <= outer_start:
    print("ERRO: fechamento do container exterior não encontrado.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

outer_end += len("</div>")

# ============================================================
# EXTRAIR O CABEÇALHO DAS DEFINIÇÕES
# ============================================================

header = text[settings_pos:outer_start]

# ============================================================
# EXTRAIR O BLOCO DE IDIOMA
# ============================================================

language_block_start = language_pos

# O Idioma termina no </div> imediatamente antes de communityTerms.
language_end = text.rfind("</div>", language_block_start, community_pos)

if language_end == -1:
    print("ERRO: fim do cartão Idioma não encontrado.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

language_end += len("</div>")

language_block = text[language_block_start:language_end].strip()

# ============================================================
# EXTRAIR O CONTEÚDO DOS TERMOS
# ============================================================

terms_block = text[language_end:outer_end].strip()

# O bloco inclui eventualmente espaços/newlines, mas deve conter:
for marker in [
    '{t("communityTerms")}',
    '{t("communityGuidelinesShort")}',
    '{t("communityTermsButton")}',
    'setShowCommunityTerms(true)',
]:
    if marker not in terms_block:
        print(f"ERRO: Termos não contém {marker}")
        shutil.copy2(BACKUP, APP)
        sys.exit(1)

# Remover possíveis restos do antigo cartão exterior
# e garantir que o conteúdo dos Termos começa no <h3>.
terms_h3 = terms_block.find("<h3")

if terms_h3 == -1:
    print("ERRO: <h3> dos Termos não encontrado.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

terms_block = terms_block[terms_h3:].strip()

# ============================================================
# RECONSTRUIR OS DOIS CARTÕES
# ============================================================

new_language = language_block

new_terms = '''<div className="bg-white border border-[#E5A88B]/20 rounded-3xl p-5 shadow-sm mb-4">
  ''' + terms_block + '''
</div>'''

replacement = (
    "\n\n"
    + new_language
    + "\n\n"
    + new_terms
    + "\n"
)

# ============================================================
# SUBSTITUIR APENAS A ZONA DOS DOIS CARTÕES
# ============================================================

updated = (
    text[:outer_start]
    + replacement
    + text[outer_end:]
)

# ============================================================
# VALIDAÇÕES
# ============================================================

# Um único bloco Idioma
if updated.count('{/* Idioma */}') != 1:
    print("ERRO: bloco Idioma não ficou único.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

# As chaves de idioma devem existir
for marker in [
    '{t("language")}',
    '{t("chooseLanguage")}',
]:
    if updated.count(marker) != 1:
        print(f"ERRO: {marker} aparece {updated.count(marker)} vezes.")
        shutil.copy2(BACKUP, APP)
        sys.exit(1)

# Cada botão deve existir exatamente uma vez
for lang in ["pt", "en", "es", "fr"]:
    marker = f'changeAppLanguage("{lang}")'

    if updated.count(marker) != 1:
        print(
            f"ERRO: botão {lang} aparece "
            f"{updated.count(marker)} vezes."
        )
        shutil.copy2(BACKUP, APP)
        sys.exit(1)

# Termos preservados
for marker in [
    '{t("communityTerms")}',
    '{t("communityGuidelinesShort")}',
    '{t("communityTermsButton")}',
    'setShowCommunityTerms(true)',
]:
    if updated.count(marker) != 1:
        print(f"ERRO: Termos — {marker} não está exatamente uma vez.")
        shutil.copy2(BACKUP, APP)
        sys.exit(1)

# Eliminação preservada
if 'handleDeleteAccountData' not in updated:
    print("ERRO: handleDeleteAccountData desapareceu.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

# Lógica crítica preservada
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

# Função de idioma preservada
if "const changeAppLanguage" not in updated:
    print("ERRO: changeAppLanguage desapareceu.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

# ============================================================
# ESCRITA
# ============================================================

APP.write_text(updated, encoding="utf-8")

print("=" * 80)
print("CONFIA — CARTÕES DAS DEFINIÇÕES CORRIGIDOS")
print("=" * 80)
print()
print("OK: Idioma é agora um cartão independente.")
print("OK: Termos da Comunidade é agora um cartão independente.")
print("OK: Eliminar os meus dados preservado.")
print("OK: PT / EN / ES / FR preservados.")
print("OK: changeAppLanguage preservado.")
print("OK: HomeWorld preservado.")
print("OK: HomeProgressSummary preservado.")
print("OK: reactiveEngine preservado.")
print("OK: handleSaveRatings preservado.")
print()
print("NÃO EXECUTAR BUILD AINDA.")
print("Próximo passo: verificar linhas 1350–1450.")
print("=" * 80)
