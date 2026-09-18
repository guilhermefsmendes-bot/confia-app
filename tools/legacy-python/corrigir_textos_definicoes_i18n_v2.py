import shutil
from pathlib import Path

APP = Path("src/App.tsx")

backup = APP.with_name(APP.name + ".backup_i18n_definicoes_v2")
shutil.copy2(APP, backup)

print(f"Backup criado: {backup}")

text = APP.read_text(encoding="utf-8")

# ---------------------------------------------------------
# COMMUNITY GUIDELINES — descrição completa
# ---------------------------------------------------------

old_community = """    A comunidade Confia foi criada para partilha e apoio entre utilizadores.
    Respeita os outros membros e evita publicar conteúdo ofensivo,
    ameaçador ou informações pessoais.
    <br /><br />
    Publicações inadequadas podem ser denunciadas e removidas.
    Utilizadores podem ser bloqueados para manter um ambiente seguro."""

new_community = """    {t("communityGuidelinesDescription")}"""

if old_community in text:
    text = text.replace(old_community, new_community)
    print("✓ Descrição completa das Community Guidelines corrigida")
else:
    print("⚠ Descrição completa das Community Guidelines não encontrada exatamente")

# ---------------------------------------------------------
# DELETE MY DATA — descrição
# ---------------------------------------------------------

old_delete = """        Elimina as tuas publicações, reações, conversas e restantes dados
        associados à tua conta."""

new_delete = """        {t("deleteMyDataDescription")}"""

if old_delete in text:
    text = text.replace(old_delete, new_delete)
    print("✓ Descrição de Delete my data corrigida")
else:
    print("⚠ Descrição de Delete my data não encontrada exatamente")

# ---------------------------------------------------------
# GRAVAR
# ---------------------------------------------------------

APP.write_text(text, encoding="utf-8")

print()
print("======================================")
print("CORREÇÃO V2 CONCLUÍDA")
print("======================================")
print(f"Backup: {backup}")

# ---------------------------------------------------------
# VERIFICAÇÃO
# ---------------------------------------------------------

final = APP.read_text(encoding="utf-8")

checks = {
    "communityGuidelinesDescription":
        '{t("communityGuidelinesDescription")}',

    "communityGuidelinesShort":
        '{t("communityGuidelinesShort")}',

    "deleteMyDataDescription":
        '{t("deleteMyDataDescription")}',

    "deleteMyData":
        '{t("deleteMyData")}',
}

print()
print("=== VERIFICAÇÃO FINAL ===")

for key, pattern in checks.items():

    if pattern in final:
        print(f"✓ {key}")
    else:
        print(f"⚠ {key} NÃO encontrado")

# ---------------------------------------------------------
# VERIFICAR PORTUGUÊS HARDCODED
# ---------------------------------------------------------

hardcoded = [
    "A comunidade Confia foi criada para partilha",
    "Respeita os outros membros",
    "Publicações inadequadas podem ser denunciadas",
    "Utilizadores podem ser bloqueados",
    "Elimina as tuas publicações",
]

print()
print("=== VERIFICAÇÃO DE TEXTO PORTUGUÊS HARDCODED ===")

found = False

for phrase in hardcoded:

    if phrase in final:
        print(f"⚠ Ainda existe: {phrase}")
        found = True

if not found:
    print("✓ Nenhum dos textos hardcoded problemáticos foi encontrado")

print()
print("Próximo passo:")
print("sed -n '1225,1290p' src/App.tsx")
