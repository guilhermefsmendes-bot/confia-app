from pathlib import Path
import shutil
import sys

APP = Path("src/App.tsx")
BACKUP = Path("/tmp/App.tsx.before_fase3a1_v3")

text = APP.read_text(encoding="utf-8")
lines = text.splitlines(keepends=True)

# ============================================================
# ENCONTRAR A HOME
# ============================================================

home_line = next(
    (
        i for i, line in enumerate(lines)
        if '{currentTab === 0 && homeScreen === "home" && (' in line
    ),
    None
)

if home_line is None:
    print("ERRO: Home principal não encontrada.")
    sys.exit(1)

# ============================================================
# ENCONTRAR SEGUNDO LOGO
# ============================================================

logo_comment = next(
    (
        i for i in range(home_line, min(home_line + 100, len(lines)))
        if '/* Logo da App */' in lines[i]
    ),
    None
)

if logo_comment is None:
    print("ERRO: bloco 'Logo da App' não encontrado.")
    sys.exit(1)

tagline_line = next(
    (
        i for i in range(logo_comment, min(logo_comment + 30, len(lines)))
        if 't("tagline")' in lines[i]
    ),
    None
)

if tagline_line is None:
    print("ERRO: tagline não encontrada.")
    sys.exit(1)

# O bloco termina no segundo </div> consecutivo.
logo_end = None

for i in range(tagline_line + 1, min(tagline_line + 10, len(lines))):
    if lines[i].strip() == '</div>' and i + 1 < len(lines):
        if lines[i + 1].strip() == '</div>':
            logo_end = i + 2
            break

if logo_end is None:
    print("ERRO: fim do segundo logo não encontrado.")
    sys.exit(1)

logo_block = ''.join(lines[logo_comment:logo_end])

if 'confia-icon.png' not in logo_block:
    print("ERRO: bloco identificado não contém o logo Confia.")
    sys.exit(1)

if 't("tagline")' not in logo_block:
    print("ERRO: bloco identificado não contém tagline.")
    sys.exit(1)

# ============================================================
# ENCONTRAR BLOCO DE IDIOMAS
# ============================================================

pt_line = next(
    (
        i for i in range(home_line, min(home_line + 100, len(lines)))
        if 'changeAppLanguage("pt")' in lines[i]
    ),
    None
)

en_line = next(
    (
        i for i in range(home_line, min(home_line + 100, len(lines)))
        if 'changeAppLanguage("en")' in lines[i]
    ),
    None
)

es_line = next(
    (
        i for i in range(home_line, min(home_line + 100, len(lines)))
        if 'changeAppLanguage("es")' in lines[i]
    ),
    None
)

fr_line = next(
    (
        i for i in range(home_line, min(home_line + 100, len(lines)))
        if 'changeAppLanguage("fr")' in lines[i]
    ),
    None
)

if None in (pt_line, en_line, es_line, fr_line):
    print("ERRO: não foram encontrados os quatro idiomas na Home.")
    print("NENHUMA ALTERAÇÃO FOI FEITA.")
    sys.exit(1)

language_start = min(pt_line, en_line, es_line, fr_line)
language_last = max(pt_line, en_line, es_line, fr_line)

# Encontrar o <div> imediatamente antes do primeiro botão.
container_start = None

for i in range(language_start - 3, language_start + 1):
    if i >= home_line and '<div' in lines[i]:
        container_start = i
        break

if container_start is None:
    print("ERRO: container dos idiomas não encontrado.")
    sys.exit(1)

# Encontrar </div> imediatamente depois do último botão.
language_end = None

for i in range(language_last + 1, min(language_last + 5, len(lines))):
    if lines[i].strip() == '</div>':
        language_end = i + 1
        break

if language_end is None:
    print("ERRO: fim do seletor de idiomas não encontrado.")
    sys.exit(1)

language_block = ''.join(lines[container_start:language_end])

# ============================================================
# VERIFICAÇÕES DE SEGURANÇA
# ============================================================

if 'changeAppLanguage("pt")' not in language_block:
    print("ERRO: PT não está no bloco identificado.")
    sys.exit(1)

if 'changeAppLanguage("en")' not in language_block:
    print("ERRO: EN não está no bloco identificado.")
    sys.exit(1)

if 'changeAppLanguage("es")' not in language_block:
    print("ERRO: ES não está no bloco identificado.")
    sys.exit(1)

if 'changeAppLanguage("fr")' not in language_block:
    print("ERRO: FR não está no bloco identificado.")
    sys.exit(1)

# Confirmar que a função de idioma existe fora deste bloco.
function_marker = 'const changeAppLanguage'

if function_marker not in text:
    print("ERRO: função changeAppLanguage não encontrada.")
    sys.exit(1)

# ============================================================
# BACKUP
# ============================================================

shutil.copy2(APP, BACKUP)

# ============================================================
# REMOVER OS DOIS BLOCOS
# ============================================================

remove_ranges = [
    (logo_comment, logo_end),
    (container_start, language_end),
]

for start, end in sorted(remove_ranges, reverse=True):
    del lines[start:end]

updated = ''.join(lines)

# ============================================================
# VALIDAÇÕES FINAIS
# ============================================================

# Função permanece.
if function_marker not in updated:
    print("ERRO: changeAppLanguage foi removida.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

# Os idiomas continuam definidos na função/estrutura restante.
# Não exigimos que os botões continuem, porque eles foram removidos
# intencionalmente da Home.

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

# Exatamente um segundo logo removido:
before_logos = text.count('src="/images/confia-icon.png"')
after_logos = updated.count('src="/images/confia-icon.png"')

if after_logos != before_logos - 1:
    print("ERRO: número de logos inesperado.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

# Os quatro botões devem ter sido removidos da Home.
home_after = updated.find('{currentTab === 0 && homeScreen === "home" && (')

if home_after != -1:
    # Limitar até ao primeiro grande conteúdo seguinte.
    check = updated[home_after:home_after + 2500]

    for lang in ["pt", "en", "es", "fr"]:
        if f'changeAppLanguage("{lang}")' in check:
            print(f"ERRO: botão {lang} ainda aparece na Home.")
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
print("OK: segundo logo removido.")
print("OK: tagline duplicada removida.")
print("OK: seletor de idiomas removido da Home.")
print("OK: função changeAppLanguage preservada.")
print("OK: HomeWorld preservado.")
print("OK: HomeProgressSummary preservado.")
print("OK: reactiveEngine preservado.")
print("OK: handleSaveRatings preservado.")
print("OK: backup criado em /tmp/App.tsx.before_fase3a1_v3")
print()
print("NÃO EXECUTAR BUILD AINDA.")
print("Próximo passo: auditar git diff.")
print("=" * 80)
