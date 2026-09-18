import os

files = [
    "src/components/PartilhaFeed.tsx",
    "src/App.tsx"
]

replacements = {
    '"Conteúdo inadequado"': 't("inappropriateContent")',

    '>🚩 Denunciar<': '>{t("report")}<',

    '🚩 Denunciar': '{t("report")}',

    'Bloquear este utilizador?': '${t("blockConfirm")}',

    '>🚫 Bloquear<': '>{t("blockUser")}<',

    'Termos da Comunidade': '{t("communityTerms")}',

    '📜 Ver termos da comunidade': '{t("communityTermsButton")}',

    'Eliminar os meus dados': '{t("deleteMyData")}',
}


for file in files:
    if not os.path.exists(file):
        print("Não encontrado:", file)
        continue

    with open(file, "r", encoding="utf-8") as f:
        content = f.read()

    original = content

    for old, new in replacements.items():
        content = content.replace(old, new)

    if content != original:
        with open(file, "w", encoding="utf-8") as f:
            f.write(content)

        print("Corrigido:", file)
    else:
        print("Sem alterações:", file)

print("Fim.")
