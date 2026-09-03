from pathlib import Path
import shutil
import sys

APP = Path("src/App.tsx")
BACKUP = Path("/tmp/App.tsx.before_language_position_fix")

if not APP.exists():
    print("ERRO: src/App.tsx não encontrado.")
    sys.exit(1)

text = APP.read_text(encoding="utf-8")

# ============================================================
# BACKUP
# ============================================================

shutil.copy2(APP, BACKUP)

# ============================================================
# LOCALIZAR DEFINIÇÕES
# ============================================================

settings_marker = '{currentTab === 0 && homeScreen === "settings" && ('
settings_pos = text.find(settings_marker)

if settings_pos == -1:
    print("ERRO: Definições não encontradas.")
    sys.exit(1)

# ============================================================
# LOCALIZAR CARTÃO DOS TERMOS
# ============================================================

terms_card = '<div className="bg-white border border-[#E5A88B]/20 rounded-3xl p-5 shadow-sm mb-4">'

terms_pos = text.find(terms_card, settings_pos)

if terms_pos == -1:
    print("ERRO: cartão dos Termos não encontrado.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

# Confirmar que é realmente o cartão dos Termos
community_pos = text.find('{t("communityTerms")}', terms_pos)

if community_pos == -1 or community_pos > terms_pos + 1000:
    print("ERRO: cartão encontrado não corresponde aos Termos.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

# ============================================================
# LOCALIZAR BLOCO IDIOMA
# ============================================================

language_start = text.find('      {/* Idioma */}', settings_pos)

if language_start == -1:
    # aceitar também indentação diferente
    language_start = text.find('{/* Idioma */}', settings_pos)

if language_start == -1:
    print("ERRO: bloco Idioma não encontrado.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

if language_start > community_pos:
    print("ERRO: bloco Idioma está depois dos Termos.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

# ============================================================
# ENCONTRAR O FIM DO BLOCO IDIOMA
# ============================================================

# O bloco termina imediatamente antes do h3 communityTerms.
language_end = text.rfind('</div>', language_start, community_pos)

if language_end == -1:
    print("ERRO: fim do bloco Idioma não encontrado.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

language_end += len('</div>')

language_block = text[language_start:language_end]

# Confirmar conteúdo
for marker in [
    '{t("language")}',
    '{t("chooseLanguage")}',
    'changeAppLanguage("pt")',
    'changeAppLanguage("en")',
    'changeAppLanguage("es")',
    'changeAppLanguage("fr")',
]:
    if marker not in language_block:
        print(f"ERRO: marcador ausente no bloco Idioma: {marker}")
        shutil.copy2(BACKUP, APP)
        sys.exit(1)

# ============================================================
# REMOVER BLOCO DA POSIÇÃO ATUAL
# ============================================================

before = text[:language_start]
after = text[language_end:]

# Remover espaços em excesso entre os elementos
after = after.lstrip('\n')

without_language = before + after

# ============================================================
# LOCALIZAR NOVAMENTE O CARTÃO DOS TERMOS
# ============================================================

new_terms_pos = without_language.find(terms_card, settings_pos)

if new_terms_pos == -1:
    print("ERRO: cartão dos Termos desapareceu durante a preparação.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

# ============================================================
# INSERIR O BLOCO ANTES DO CARTÃO DOS TERMOS
# ============================================================

clean_language_block = '\n' + language_block.strip() + '\n\n'

updated = (
    without_language[:new_terms_pos]
    + clean_language_block
    + without_language[new_terms_pos:]
)

# ============================================================
# VALIDAÇÕES
# ============================================================

# Idioma deve existir uma vez.
if updated.count('{/* Idioma */}') != 1:
    print("ERRO: número incorreto de blocos Idioma.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

# Os quatro idiomas devem existir uma vez.
for lang in ["pt", "en", "es", "fr"]:
    marker = f'changeAppLanguage("{lang}")'
    if updated.count(marker) != 1:
        print(f"ERRO: {marker} aparece {updated.count(marker)} vezes.")
        shutil.copy2(BACKUP, APP)
        sys.exit(1)

# O idioma deve estar antes do cartão dos Termos.
new_language_pos = updated.find('{/* Idioma */}')
new_terms_pos = updated.find(terms_card, new_language_pos)

if new_language_pos == -1 or new_terms_pos == -1:
    print("ERRO: posição final não pôde ser validada.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

if new_language_pos >= new_terms_pos:
    print("ERRO: Idioma não ficou antes dos Termos.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

# Componentes críticos
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

# Função de idioma
if "const changeAppLanguage" not in updated:
    print("ERRO: changeAppLanguage desapareceu.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

# ============================================================
# ESCREVER
# ============================================================

APP.write_text(updated, encoding="utf-8")

print("=" * 80)
print("CONFIA — CORREÇÃO DA POSIÇÃO DO IDIOMA")
print("=" * 80)
print()
print("OK: backup criado em /tmp/App.tsx.before_language_position_fix")
print("OK: bloco Idioma removido da posição incorreta.")
print("OK: bloco Idioma colocado antes do cartão dos Termos.")
print("OK: PT / EN / ES / FR preservados.")
print("OK: changeAppLanguage preservado.")
print("OK: HomeWorld preservado.")
print("OK: HomeProgressSummary preservado.")
print("OK: reactiveEngine preservado.")
print("OK: handleSaveRatings preservado.")
print()
print("NÃO EXECUTAR BUILD AINDA.")
print("Próximo passo: verificar linhas 1350–1445.")
print("=" * 80)
