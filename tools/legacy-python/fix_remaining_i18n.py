from pathlib import Path

files = [
    "src/App.tsx"
]

replacements = {
    '"Tens a certeza que queres eliminar todos os teus dados? Esta ação não pode ser desfeita."':
        't("deleteDataConfirm")',

    '"Os teus dados foram apagados com sucesso."':
        't("deleteDataSuccess")',

    '"Não foi possível apagar os teus dados. Tenta novamente."':
        't("deleteDataError")',

    '"A comunidade Confia foi criada para partilha e apoio entre utilizadores."':
        't("communityDescription")',

    '"Elimina as tuas publicações, reações, conversas e restantes dados associados à tua conta."':
        't("deleteAccountDescription")'
}

for file in files:
    p = Path(file)
    text = p.read_text(encoding="utf-8")

    for old,new in replacements.items():
        text=text.replace(old,new)

    p.write_text(text,encoding="utf-8")

print("App.tsx corrigido")
