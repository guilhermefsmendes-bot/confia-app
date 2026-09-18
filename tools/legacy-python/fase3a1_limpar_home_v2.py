from pathlib import Path
import shutil
import sys

APP = Path("src/App.tsx")
BACKUP = Path("/tmp/App.tsx.before_fase3a1_v2")

text = APP.read_text(encoding="utf-8")
lines = text.splitlines(keepends=True)

# ============================================================
# LOCALIZAR HOME
# ============================================================

home_line = next(
    (i for i, line in enumerate(lines)
     if '{currentTab === 0 && homeScreen === "home" && (' in line),
    None
)

if home_line is None:
    print("ERRO: Home principal não encontrada.")
    sys.exit(1)

# ============================================================
# LOCALIZAR O SEGUNDO LOGO DENTRO DA HOME
# ============================================================

logo_comment = next(
    (i for i in range(home_line, min(home_line + 100, len(lines)))
     if '/* Logo da App */' in lines[i]),
    None
)

if logo_comment is None:
    print("ERRO: comentário 'Logo da App' não encontrado dentro da Home.")
    print("NENHUMA ALTERAÇÃO FOI FEITA.")
    sys.exit(1)

# Procurar a tagline
tagline_line = next(
    (i for i in range(logo_comment, min(logo_comment + 30, len(lines)))
     if 't("tagline")' in lines[i]),
    None
)

if tagline_line is None:
    print("ERRO: tagline não encontrada no bloco do segundo logo.")
    print("NENHUMA ALTERAÇÃO FOI FEITA.")
    sys.exit(1)

# O bloco do logo termina no primeiro </div> estrutural depois da tagline.
# Na estrutura atual sabemos que a tagline está dentro de:
#
# <div className="space-y-0.5">
#   ...
# </div>
# </div>
#
# Procuramos dois fechamentos consecutivos.

logo_end = None

for i in range(tagline_line + 1, min(tagline_line + 10, len(lines))):
    if lines[i].strip() == '</div>':
        if i + 1 < len(lines) and lines[i + 1].strip() == '</div>':
            logo_end = i + 2
            break

if logo_end is None:
    print("ERRO: fim estrutural do bloco do segundo logo não encontrado.")
    print("NENHUMA ALTERAÇÃO FOI FEITA.")
    sys.exit(1)

# ============================================================
# LOCALIZAR IDIOMAS
# ============================================================

language_lines = []

for i in range(home_line, min(home_line + 100, len(lines))):
    if 'changeAppLanguage("pt")' in lines[i]:
        language_lines.append(i)
    elif 'changeAppLanguage("en")' in lines[i]:
        language_lines.append(i)
    elif 'changeAppLanguage("es")' in lines[i]:
        language_lines.append(i)
    elif 'changeAppLanguage("fr")' in lines[i]:
        language_lines.append(i)

if len(language_lines) != 4:
    print(
        f"ERRO: esperava os 4 botões de idioma dentro da Home; "
        f"encontrei {len(language_lines)}."
    )
    print("NENHUMA ALTERAÇÃO FOI FEITA.")
    sys.exit(1)

language_start = language_lines[0]

# Procurar o <div> que contém os quatro botões
container_start = None

for i in range(language_start - 3, language_start + 1):
    if i >= home_line and '<div' in lines[i]:
        container_start = i
        break

if container_start is None:
    print("ERRO: container do seletor de idiomas não encontrado.")
    print("NENHUMA ALTERAÇÃO FOI FEITA.")
    sys.exit(1)

# Fecho imediatamente depois do último botão
last_language = language_lines[-1]
language_end = None

for i in range(last_language + 1, min(last_language + 5, len(lines))):
    if lines[i].strip() == '</div>':
        language_end = i + 1
        break

if language_end is None:
    print("ERRO: fim do seletor de idiomas não encontrado.")
    print("NENHUMA ALTERAÇÃO FOI FEITA.")
    sys.exit(1)

# ============================================================
# VALIDAR ANTES DE ALTERAR
# ============================================================

logo_block = ''.join(lines[logo_comment:logo_end])
language_block = ''.join(lines[container_start:language_end])

if 'confia-icon.png' not in logo_block:
    print("ERRO: bloco identificado como logo não contém confia-icon.png.")
    sys.exit(1)

if 't("tagline")' not in logo_block:
    print("ERRO: bloco identificado como logo não contém tagline.")
    sys.exit(1)

for lang in ["pt", "en", "es", "fr"]:
    if f'changeAppLanguage("{lang}")' not in language_block:
        print(f"ERRO: idioma {lang} não está no bloco identificado.")
        sys.exit(1)

# Garantir que estamos removendo o segundo logo, não o header.
logo_occurrences_before = text.count('src="/images/confia-icon.png"')

if logo_occurrences_before < 2:
    print("ERRO: não existem dois logos antes da alteração.")
    sys.exit(1)

# ============================================================
# BACKUP
# ============================================================

shutil.copy2(APP, BACKUP)

# ============================================================
# REMOVER POR ÍNDICES DE LINHAS
# ============================================================

remove_ranges = [
    (logo_comment, logo_end),
    (container_start, language_end),
]

# Remover de baixo para cima
for start, end in sorted(remove_ranges, reverse=True):
    del lines[start:end]

updated = ''.join(lines)

# ============================================================
# VALIDAÇÕES
# ============================================================

logo_occurrences_after = updated.count('src="/images/confia-icon.png"')

if logo_occurrences_after != logo_occurrences_before - 1:
    print("ERRO: número de logos incorreto após alteração.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

if 'const changeAppLanguage' not in updated:
    print("ERRO: função changeAppLanguage desapareceu.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

for lang in ["pt", "en", "es", "fr"]:
    if f'changeAppLanguage("{lang}")' not in updated:
        print(f"ERRO: suporte ao idioma {lang} desapareceu.")
        shutil.copy2(BACKUP, APP)
        sys.exit(1)

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

# ============================================================
# ESCREVER
# ============================================================

APP.write_text(updated, encoding="utf-8")

print("=" * 80)
print("CONFIA — FASE 3A.1 — LIMPEZA DA HOME")
print("=" * 80)
print()
print(f"OK: Home encontrada na linha {home_line + 1}.")
print(f"OK: segundo logo encontrado nas linhas {logo_comment + 1}–{logo_end}.")
print(f"OK: seletor de idiomas encontrado nas linhas {container_start + 1}–{language_end}.")
print("OK: backup criado em /tmp/App.tsx.before_fase3a1_v2")
print("OK: segundo logo removido.")
print("OK: tagline duplicada removida.")
print("OK: seletor PT/EN/ES/FR removido da Home.")
print("OK: função changeAppLanguage preservada.")
print("OK: suporte aos 4 idiomas preservado.")
print("OK: HomeWorld preservado.")
print("OK: HomeProgressSummary preservado.")
print("OK: reactiveEngine preservado.")
print("OK: handleSaveRatings preservado.")
print()
print("NÃO EXECUTAR BUILD AINDA.")
print("Próximo passo: auditoria do diff.")
print("=" * 80)
