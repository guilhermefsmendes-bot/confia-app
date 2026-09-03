from pathlib import Path
import shutil

path = Path("src/components/HomeWorld.tsx")

# Backup de segurança
backup = Path("src/components/HomeWorld.tsx.before-cleanup")
shutil.copy2(path, backup)

text = path.read_text()

# ---------------------------------------------------------
# 1. Remover árvore emoji antiga
# ---------------------------------------------------------

old_tree = '''{/* Árvore decorativa com vento */}
<div
  className="
    absolute
    left-8
    bottom-[260px]
    z-20
    text-8xl
    select-none
  "
>
  <div className="animate-[wiggle_4s_ease-in-out_infinite]">
    🌳
  </div>
</div>

'''

if old_tree in text:
    text = text.replace(old_tree, "")
    print("✓ Árvore emoji antiga removida.")
else:
    print("• Árvore emoji antiga não encontrada.")

# ---------------------------------------------------------
# 2. Remover lago antigo
# ---------------------------------------------------------

start_marker = "{/* Lago premium */}"

end_marker = "{/* Árvore decorativa com vento */}"

start = text.find(start_marker)
end = text.find(end_marker)

if start != -1 and end != -1 and start < end:
    text = text[:start] + text[end:]
    print("✓ Lago antigo removido.")
else:
    print("• Lago antigo não encontrado ou já removido.")

# ---------------------------------------------------------
# 3. Remover camada de relva antiga
# ---------------------------------------------------------

old_ground_start = text.find(
    "className={`absolute bottom-0 left-0 right-0 h-[380px]"
)

if old_ground_start != -1:

    div_start = text.rfind("<div", 0, old_ground_start)
    div_end = text.find("/>", old_ground_start)

    if div_start != -1 and div_end != -1:
        div_end += 2
        text = text[:div_start] + text[div_end:]
        print("✓ Camada de relva antiga removida.")
    else:
        print("• Não foi possível localizar a camada antiga.")
else:
    print("• Camada de relva antiga não encontrada.")

path.write_text(text)

print()
print("==============================================")
print("✓ LIMPEZA PREMIUM CONCLUÍDA")
print("==============================================")
print(f"✓ Backup criado em: {backup}")
