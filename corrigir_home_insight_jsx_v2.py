from pathlib import Path
import shutil
import sys

APP = Path("src/App.tsx")
BACKUP = Path("/tmp/App.tsx.before_home_insight_jsx_fix_v2")

text = APP.read_text(encoding="utf-8")

# ------------------------------------------------------------
# Backup
# ------------------------------------------------------------
shutil.copy2(APP, BACKUP)

# ------------------------------------------------------------
# Localizar a expressão Home
# ------------------------------------------------------------
start_marker = '{homeScreen === "home" && ('
start = text.find(start_marker)

if start == -1:
    print("ERRO: início de homeScreen === home não encontrado.")
    print("NENHUMA ALTERAÇÃO FOI FEITA.")
    sys.exit(1)

# Garantir que existe apenas uma ocorrência
if text.count(start_marker) < 1:
    print("ERRO: estrutura Home não encontrada.")
    sys.exit(1)

# ------------------------------------------------------------
# Verificar estrutura atual
# ------------------------------------------------------------
summary_marker = '<HomeProgressSummary />'
reactive_marker = '{reactiveMessageKey && ('

summary_pos = text.find(summary_marker, start)
reactive_pos = text.find(reactive_marker, start)

if summary_pos == -1 or reactive_pos == -1:
    print("ERRO: HomeProgressSummary ou reactiveMessageKey não encontrados.")
    print("NENHUMA ALTERAÇÃO FOI FEITA.")
    sys.exit(1)

if reactive_pos < summary_pos:
    print("ERRO: ordem inesperada dos elementos.")
    print("NENHUMA ALTERAÇÃO FOI FEITA.")
    sys.exit(1)

# ------------------------------------------------------------
# Verificar que ainda não existe fragmento
# ------------------------------------------------------------
region = text[start:reactive_pos]

if "<>" in region:
    print("AVISO: fragmento JSX já parece existir.")
    print("NENHUMA ALTERAÇÃO FOI FEITA.")
    sys.exit(0)

# ------------------------------------------------------------
# Inserir fragmento depois da abertura da expressão Home
# ------------------------------------------------------------
insert_position = start + len(start_marker)

updated = (
    text[:insert_position]
    + '\n  <>'
    + text[insert_position:]
)

# ------------------------------------------------------------
# Localizar novamente o bloco após a inserção
# ------------------------------------------------------------
start2 = updated.find(start_marker)

reactive_pos2 = updated.find(reactive_marker, start2)

if reactive_pos2 == -1:
    print("ERRO interno: reactiveMessageKey desapareceu.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

# ------------------------------------------------------------
# Encontrar o fechamento da expressão Home
#
# A estrutura conhecida termina antes de:
#   {/* Botões do menu principal
#
# Portanto usamos esse marcador para limitar a pesquisa.
# ------------------------------------------------------------
next_section = updated.find(
    '{/* Botões do menu principal',
    reactive_pos2
)

if next_section == -1:
    print("ERRO: não encontrei a próxima secção da Home.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

region = updated[start2:next_section]

# O último )} desta região é o fechamento de homeScreen.
closing = region.rfind(')}')

if closing == -1:
    print("ERRO: fechamento da Home não encontrado.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

absolute_closing = start2 + closing

# Inserir fragmento antes do fechamento final da Home
updated = (
    updated[:absolute_closing]
    + '\n  </>\n'
    + updated[absolute_closing:]
)

# ------------------------------------------------------------
# Validações
# ------------------------------------------------------------
final_region_end = updated.find(
    '{/* Botões do menu principal',
    start2
)

final_region = updated[start2:final_region_end]

if "<>" not in final_region:
    print("ERRO: fragmento <> não encontrado.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

if "</>" not in final_region:
    print("ERRO: fechamento </> não encontrado.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

if final_region.count('<HomeProgressSummary />') != 1:
    print("ERRO: HomeProgressSummary não está correto.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

if final_region.count('{reactiveMessageKey && (') != 1:
    print("ERRO: reactiveMessageKey não está correto.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

# ------------------------------------------------------------
# Escrever
# ------------------------------------------------------------
APP.write_text(updated, encoding="utf-8")

print("=" * 80)
print("CONFIA — CORREÇÃO JSX HOME / FASE 2")
print("=" * 80)
print()
print("OK: backup criado em /tmp/App.tsx.before_home_insight_jsx_fix_v2")
print("OK: HomeProgressSummary preservado.")
print("OK: reactiveMessageKey preservado.")
print("OK: fragmento JSX <> adicionado.")
print("OK: fechamento </> adicionado.")
print("OK: estrutura Home corrigida.")
print("OK: nenhuma tradução alterada.")
print("OK: reactiveEngine não alterado.")
print()
print("NÃO EXECUTAR BUILD AINDA.")
print("Próximo passo: verificar linhas 1095–1130.")
print("=" * 80)
