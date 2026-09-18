from pathlib import Path
import shutil
import sys

APP = Path("src/App.tsx")
BACKUP = Path("/tmp/App.tsx.before_language_position_fix_v2")

text = APP.read_text(encoding="utf-8")

# ============================================================
# LOCALIZAR DEFINIÇÕES
# ============================================================

settings_pos = text.find(
    '{currentTab === 0 && homeScreen === "settings" && ('
)

if settings_pos == -1:
    print("ERRO: Definições não encontradas.")
    sys.exit(1)

# ============================================================
# LOCALIZAR BLOCO IDIOMA
# ============================================================

language_start = text.find('{/* Idioma */}', settings_pos)

if language_start == -1:
    print("ERRO: bloco Idioma não encontrado.")
    print("NENHUMA ALTERAÇÃO FOI FEITA.")
    sys.exit(1)

# ============================================================
# LOCALIZAR FIM DO BLOCO IDIOMA
# ============================================================

# O bloco atual termina imediatamente antes do:
# <h3> dos Termos da Comunidade.
#
# Procuramos communityTerms depois do início do Idioma.

community_key = '{t("communityTerms")}'
community_pos = text.find(community_key, language_start)

if community_pos == -1:
    print("ERRO: communityTerms não encontrado.")
    sys.exit(1)

# Encontrar o <h3> que contém communityTerms
terms_h3_start = text.rfind("<h3", language_start, community_pos)

if terms_h3_start == -1:
    print("ERRO: início do título dos Termos não encontrado.")
    sys.exit(1)

# O bloco Idioma é tudo desde {/* Idioma */}
# até imediatamente antes do <h3> dos Termos,
# ignorando espaços/newlines intermédios.

language_block = text[language_start:terms_h3_start]

# Confirmar que estamos mesmo a retirar o bloco correto.
required = [
    '{t("language")}',
    '{t("chooseLanguage")}',
    'changeAppLanguage("pt")',
    'changeAppLanguage("en")',
    'changeAppLanguage("es")',
    'changeAppLanguage("fr")',
]

for marker in required:
    if marker not in language_block:
        print(f"ERRO: marcador não encontrado no bloco Idioma: {marker}")
        print("NENHUMA ALTERAÇÃO FOI FEITA.")
        sys.exit(1)

# ============================================================
# LOCALIZAR INÍCIO DO CARTÃO DOS TERMOS
# ============================================================

# Não dependemos da classe completa.
# Procuramos o <div> imediatamente anterior ao <h3> dos Termos.

terms_container_start = text.rfind("<div", settings_pos, terms_h3_start)

if terms_container_start == -1:
    print("ERRO: container dos Termos não encontrado.")
    sys.exit(1)

# Verificar se esse container é realmente o dos Termos.
container_preview = text[terms_container_start:terms_h3_start]

if "communityTerms" not in text[terms_container_start:community_pos]:
    print("ERRO: container identificado não corresponde aos Termos.")
    sys.exit(1)

# ============================================================
# BACKUP
# ============================================================

shutil.copy2(APP, BACKUP)

# ============================================================
# REMOVER O BLOCO IDIOMA
# ============================================================

before = text[:language_start]
after = text[terms_h3_start:]

without_language = before + after

# ============================================================
# LOCALIZAR NOVAMENTE O TÍTULO DOS TERMOS
# ============================================================

new_settings_pos = without_language.find(
    '{currentTab === 0 && homeScreen === "settings" && ('
)

new_community_pos = without_language.find(
    '{t("communityTerms")}',
    new_settings_pos
)

if new_community_pos == -1:
    print("ERRO: communityTerms desapareceu.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

new_terms_h3_start = without_language.rfind(
    "<h3",
    new_settings_pos,
    new_community_pos
)

if new_terms_h3_start == -1:
    print("ERRO: <h3> dos Termos desapareceu.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

# ============================================================
# INSERIR IDIOMA ANTES DOS TERMOS
# ============================================================

clean_block = language_block.strip() + "\n\n"

updated = (
    without_language[:new_terms_h3_start]
    + clean_block
    + without_language[new_terms_h3_start:]
)

# ============================================================
# VALIDAÇÕES
# ============================================================

if updated.count('{/* Idioma */}') != 1:
    print("ERRO: bloco Idioma não aparece exatamente uma vez.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

for lang in ["pt", "en", "es", "fr"]:
    marker = f'changeAppLanguage("{lang}")'

    if updated.count(marker) != 1:
        print(f"ERRO: {marker} aparece {updated.count(marker)} vezes.")
        shutil.copy2(BACKUP, APP)
        sys.exit(1)

# Idioma antes de communityTerms
final_language = updated.find('{/* Idioma */}')
final_community = updated.find(
    '{t("communityTerms")}',
    final_language
)

if final_language == -1 or final_community == -1:
    print("ERRO: posição final não encontrada.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

if final_language >= final_community:
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

if "const changeAppLanguage" not in updated:
    print("ERRO: changeAppLanguage desapareceu.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

# ============================================================
# ESCREVER
# ============================================================

APP.write_text(updated, encoding="utf-8")

print("=" * 80)
print("CONFIA — CORREÇÃO POSIÇÃO IDIOMA V2")
print("=" * 80)
print()
print("OK: backup criado.")
print("OK: bloco Idioma identificado.")
print("OK: bloco Idioma retirado da posição incorreta.")
print("OK: bloco Idioma colocado antes dos Termos.")
print("OK: PT / EN / ES / FR preservados.")
print("OK: changeAppLanguage preservado.")
print("OK: componentes críticos preservados.")
print()
print("NÃO EXECUTAR BUILD.")
print("Próximo passo: verificar linhas 1350–1445.")
print("=" * 80)
