from pathlib import Path
import shutil
import sys

APP = Path("src/App.tsx")
BACKUP = Path("/tmp/App.tsx.before_idioma_v3")

text = APP.read_text(encoding="utf-8")
shutil.copy2(APP, BACKUP)

# ============================================================
# LOCALIZAR DEFINIÇÕES
# ============================================================

settings = text.find(
    '{currentTab === 0 && homeScreen === "settings" && ('
)

if settings == -1:
    print("ERRO: Definições não encontradas.")
    sys.exit(1)

# ============================================================
# LOCALIZAR BLOCO IDIOMA PELO CONTEÚDO, NÃO PELA INDENTAÇÃO
# ============================================================

language_comment = text.find('/* Idioma */', settings)

if language_comment == -1:
    print("ERRO: comentário Idioma não encontrado.")
    sys.exit(1)

language_start = text.rfind('{', settings, language_comment)

if language_start == -1:
    print("ERRO: início do bloco Idioma não encontrado.")
    sys.exit(1)

# ============================================================
# LOCALIZAR communityTerms
# ============================================================

community = text.find(
    '{t("communityTerms")}',
    language_comment
)

if community == -1:
    print("ERRO: communityTerms não encontrado.")
    sys.exit(1)

# O <h3> que contém communityTerms
terms_h3 = text.rfind("<h3", language_comment, community)

if terms_h3 == -1:
    print("ERRO: <h3> dos Termos não encontrado.")
    sys.exit(1)

# ============================================================
# O BLOCO IDIOMA TERMINA NO </div> IMEDIATAMENTE ANTES DOS TERMOS
# ============================================================

language_end = text.rfind("</div>", language_start, terms_h3)

if language_end == -1:
    print("ERRO: fim do bloco Idioma não encontrado.")
    sys.exit(1)

language_end += len("</div>")

language_block = text[language_start:language_end].strip()

# ============================================================
# VALIDAR BLOCO IDIOMA
# ============================================================

for marker in [
    '/* Idioma */',
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
# REMOVER O BLOCO IDIOMA
# ============================================================

without_language = (
    text[:language_start]
    + text[language_end:]
)

# ============================================================
# LOCALIZAR NOVAMENTE DEFINIÇÕES E COMMUNITY TERMS
# ============================================================

new_settings = without_language.find(
    '{currentTab === 0 && homeScreen === "settings" && ('
)

new_community = without_language.find(
    '{t("communityTerms")}',
    new_settings
)

if new_settings == -1 or new_community == -1:
    print("ERRO: estrutura desapareceu após remoção.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

new_terms_h3 = without_language.rfind(
    "<h3",
    new_settings,
    new_community
)

if new_terms_h3 == -1:
    print("ERRO: <h3> dos Termos não encontrado após remoção.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

# ============================================================
# ENCONTRAR O INÍCIO REAL DO CONTEÚDO DOS TERMOS
# ============================================================

# Procurar para trás a abertura do cartão que contém o h3.
# Não usamos a classe: encontramos o <div> mais próximo.
terms_container = without_language.rfind(
    "<div",
    new_settings,
    new_terms_h3
)

if terms_container == -1:
    print("ERRO: container dos Termos não encontrado.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

# ============================================================
# INSERIR O IDIOMA ANTES DO CONTAINER DOS TERMOS
# ============================================================

clean_language = language_block + "\n\n"

updated = (
    without_language[:terms_container]
    + clean_language
    + without_language[terms_container:]
)

# ============================================================
# VALIDAÇÕES
# ============================================================

# Comentário único
if updated.count("/* Idioma */") != 1:
    print("ERRO: bloco Idioma não ficou único.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

# Chaves únicas
for marker in [
    '{t("language")}',
    '{t("chooseLanguage")}',
]:
    if updated.count(marker) != 1:
        print(f"ERRO: {marker} aparece {updated.count(marker)} vezes.")
        shutil.copy2(BACKUP, APP)
        sys.exit(1)

# Cada botão exatamente uma vez
for lang in ["pt", "en", "es", "fr"]:
    marker = f'changeAppLanguage("{lang}")'
    if updated.count(marker) != 1:
        print(
            f"ERRO: {marker} aparece "
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
        print(f"ERRO: {marker} não está exatamente uma vez.")
        shutil.copy2(BACKUP, APP)
        sys.exit(1)

# Eliminação preservada
if 'handleDeleteAccountData' not in updated:
    print("ERRO: handleDeleteAccountData desapareceu.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

# Lógica crítica
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

# Função original
if "const changeAppLanguage" not in updated:
    print("ERRO: changeAppLanguage desapareceu.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

# ============================================================
# ESCRITA
# ============================================================

APP.write_text(updated, encoding="utf-8")

print("=" * 80)
print("CONFIA — IDIOMA NAS DEFINIÇÕES — V3")
print("=" * 80)
print()
print("OK: backup criado.")
print("OK: bloco Idioma removido da posição antiga.")
print("OK: bloco Idioma reinserido antes do cartão dos Termos.")
print("OK: PT / EN / ES / FR preservados.")
print("OK: Termos preservados.")
print("OK: eliminação de dados preservada.")
print("OK: lógica reativa preservada.")
print()
print("NÃO EXECUTAR BUILD.")
print("Verificar agora:")
print("nl -ba src/App.tsx | sed -n '1350,1450p'")
print("=" * 80)
