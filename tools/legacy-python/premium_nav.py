from pathlib import Path
import shutil
import sys

path = Path("src/App.tsx")
backup = Path("/tmp/App.tsx.before_premium_nav")

if not path.exists():
    print("ERRO: src/App.tsx não encontrado.")
    sys.exit(1)

lines = path.read_text(encoding="utf-8").splitlines()
shutil.copy2(path, backup)

# ---------------------------------------------------------
# 1. IMPORTS
# ---------------------------------------------------------

import_start = None
import_end = None

for i, line in enumerate(lines):
    if line.strip() == "import {":
        # confirmar que é o bloco lucide
        for j in range(i, min(i + 30, len(lines))):
            if "from 'lucide-react'" in lines[j]:
                import_start = i
                import_end = j
                break
        if import_start is not None:
            break

if import_start is None or import_end is None:
    print("ERRO: bloco de imports do lucide-react não encontrado.")
    sys.exit(1)

needed_icons = [
    "House",
    "Wind",
    "Target",
    "Zap",
    "ChartNoAxesCombined",
]

import_block = lines[import_start:import_end + 1]
import_text = "\n".join(import_block)

missing = [icon for icon in needed_icons if icon not in import_text]

if missing:
    # inserir antes da linha que fecha o import
    closing_index = import_end - import_start

    # garantir vírgula no último item atual
    prev = import_block[closing_index - 1].rstrip()
    if not prev.endswith(","):
        import_block[closing_index - 1] = prev + ","

    insertion = [f"  {icon}," for icon in missing]
    insertion[-1] = insertion[-1].rstrip(",")

    import_block = (
        import_block[:closing_index]
        + insertion
        + import_block[closing_index:]
    )

    lines[import_start:import_end + 1] = import_block

# ---------------------------------------------------------
# 2. LOCALIZAR CONFIGURAÇÃO DOS TABS
# ---------------------------------------------------------

home_idx = None
progress_idx = None

for i, line in enumerate(lines):
    if '{ label: t("home")' in line and "icon:" in line and "index: 0" in line:
        home_idx = i
    if '{ label: t("progress")' in line and "icon:" in line and "index: 4" in line:
        progress_idx = i

if home_idx is None or progress_idx is None:
    print("ERRO: não encontrei os separadores Home/Progresso.")
    sys.exit(1)

if progress_idx - home_idx != 4:
    print("ERRO: a estrutura dos 5 separadores não está como esperado.")
    sys.exit(1)

indent = lines[home_idx][:len(lines[home_idx]) - len(lines[home_idx].lstrip())]

replacement_tabs = [
    f'{indent}{{ label: t("home"), icon: House, index: 0 }},',
    f'{indent}{{ label: t("hug"), icon: Wind, index: 1 }},',
    f'{indent}{{ label: t("objectives"), icon: Target, index: 2 }},',
    f'{indent}{{ label: t("impulse"), icon: Zap, index: 3 }},',
    f'{indent}{{ label: t("progress"), icon: ChartNoAxesCombined, index: 4 }}',
]

lines[home_idx:progress_idx + 1] = replacement_tabs

# ---------------------------------------------------------
# 3. ALTERAR .map(tab => (
# ---------------------------------------------------------

map_idx = None

for i in range(home_idx, min(home_idx + 15, len(lines))):
    if "].map(tab => (" in lines[i]:
        map_idx = i
        break

if map_idx is None:
    print("ERRO: não encontrei ].map(tab => (")
    sys.exit(1)

map_indent = lines[map_idx][:len(lines[map_idx]) - len(lines[map_idx].lstrip())]

lines[map_idx] = f"{map_indent}].map(tab => {{"
lines.insert(map_idx + 1, f"{map_indent}  const TabIcon = tab.icon;")
lines.insert(map_idx + 2, "")
lines.insert(map_idx + 3, f"{map_indent}  return (")

# ---------------------------------------------------------
# 4. LOCALIZAR RENDERIZAÇÃO DO ÍCONE
# ---------------------------------------------------------

emoji_render_idx = None

for i in range(map_idx, min(map_idx + 50, len(lines))):
    if "{tab.icon}" in lines[i]:
        emoji_render_idx = i
        break

if emoji_render_idx is None:
    print("ERRO: não encontrei a linha que renderiza tab.icon.")
    sys.exit(1)

icon_indent = lines[emoji_render_idx][:len(lines[emoji_render_idx]) - len(lines[emoji_render_idx].lstrip())]

new_icon_lines = [
    f"{icon_indent}<TabIcon",
    f"{icon_indent}  size={{20}}",
    f"{icon_indent}  strokeWidth={{currentTab === tab.index ? 2.4 : 1.9}}",
    f'{icon_indent}  className="mb-1 transition-all duration-300"',
    f"{icon_indent}/>",
]

lines[emoji_render_idx:emoji_render_idx + 1] = new_icon_lines

# ---------------------------------------------------------
# 5. FECHAR MAP CORRETAMENTE
# ---------------------------------------------------------

close_idx = None

for i in range(emoji_render_idx, min(emoji_render_idx + 30, len(lines))):
    if lines[i].strip() == "))}":
        close_idx = i
        break

if close_idx is None:
    print("ERRO: não encontrei o fecho ))} da navegação.")
    sys.exit(1)

close_indent = lines[close_idx][:len(lines[close_idx]) - len(lines[close_idx].lstrip())]

lines[close_idx] = f"{close_indent}  );"
lines.insert(close_idx + 1, f"{close_indent}}})}}")

# ---------------------------------------------------------
# 6. GRAVAR
# ---------------------------------------------------------

path.write_text("\n".join(lines) + "\n", encoding="utf-8")

print("=" * 70)
print("CONFIA — PREMIUM NAVIGATION 1A.1")
print("=" * 70)
print("✓ Backup criado em:", backup)
print("✓ Imports Lucide atualizados")
print("✓ Home      → House")
print("✓ Abraço    → Wind")
print("✓ Objetivos → Target")
print("✓ Impulso   → Zap")
print("✓ Progresso → ChartNoAxesCombined")
print("✓ Labels preservadas")
print("✓ Índices preservados")
print("✓ onClick preservado")
print()
print("OK — alteração gravada.")
