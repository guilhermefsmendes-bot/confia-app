from pathlib import Path

path = Path("src/App.tsx")
text = path.read_text(encoding="utf-8")

# 1. Remover o AnimatePresence que envolve os ecrãs do primeiro separador
old_start = '''<main className="flex-1 pb-24 px-4 max-w-lg mx-auto w-full pt-4">
<AnimatePresence mode="wait">
{currentTab === 0 && homeScreen === "home" && ('''

new_start = '''<main className="flex-1 pb-24 px-4 max-w-lg mx-auto w-full pt-4">
{currentTab === 0 && homeScreen === "home" && ('''

if old_start not in text:
    print("ERRO: início do AnimatePresence principal não encontrado.")
    raise SystemExit(1)

text = text.replace(old_start, new_start, 1)

# 2. Encontrar o AnimatePresence que acabámos de remover.
# O seu fecho está imediatamente antes da zona seguinte do App.
# Procuramos o primeiro </AnimatePresence> depois do main-menu.
menu_pos = text.find('key="main-menu"')

if menu_pos == -1:
    print("ERRO: key='main-menu' não encontrado.")
    raise SystemExit(1)

close_pos = text.find("</AnimatePresence>", menu_pos)

if close_pos == -1:
    print("ERRO: fecho do AnimatePresence principal não encontrado.")
    raise SystemExit(1)

text = text[:close_pos] + text[close_pos + len("</AnimatePresence>"):]

path.write_text(text, encoding="utf-8")

print("✓ AnimatePresence principal removido")
print("✓ Menu principal continua sem motion")
print("✓ Navegação do primeiro separador passa a ser imediata")
print("✓ Nenhuma lógica dos botões foi alterada")
