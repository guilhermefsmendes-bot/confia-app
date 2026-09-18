from pathlib import Path
import shutil
import sys

APP = Path("src/App.tsx")
BACKUP = Path("/tmp/App.tsx.before_home_insight_jsx_fix")

if not APP.exists():
    print("ERRO: src/App.tsx não encontrado.")
    sys.exit(1)

text = APP.read_text(encoding="utf-8")

# Backup
shutil.copy2(APP, BACKUP)

old = '''{homeScreen === "home" && (
    <HomeProgressSummary />

    {reactiveMessageKey && ('''

new = '''{homeScreen === "home" && (
    <>
      <HomeProgressSummary />

      {reactiveMessageKey && ('''

if old not in text:
    print("ERRO: estrutura esperada não encontrada.")
    print("NENHUMA ALTERAÇÃO FOI FEITA.")
    sys.exit(1)

# Substituição inicial
updated = text.replace(old, new, 1)

# O bloco atual termina assim:
#
#   )}
# )}
#
# Precisamos transformar o segundo fechamento em:
#
#   )}
#   </>
# )}
#
# Fazemos isso apenas na região imediatamente depois do novo bloco.

marker = '''{homeScreen === "home" && (
    <>
      <HomeProgressSummary />

      {reactiveMessageKey && ('''

start = updated.find(marker)

if start == -1:
    print("ERRO: não foi possível localizar o bloco após a primeira alteração.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

# Procurar a sequência de fechamentos que existe atualmente.
search_start = start + len(marker)

closing = '''  )}
  )}'''

closing_pos = updated.find(closing, search_start)

if closing_pos == -1:
    print("ERRO: fechamentos JSX esperados não encontrados.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

replacement = '''  )}
    </>
  )}'''

updated = (
    updated[:closing_pos]
    + replacement
    + updated[closing_pos + len(closing):]
)

# Validações
expected_start = '''{homeScreen === "home" && (
    <>
      <HomeProgressSummary />

      {reactiveMessageKey && ('''

if expected_start not in updated:
    print("ERRO: início final não corresponde ao esperado.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

if updated.count('reactiveMessageKey && (') != 1:
    print("ERRO: reactiveMessageKey não aparece exatamente uma vez.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

if updated.count('<HomeProgressSummary />') != 1:
    print("ERRO: HomeProgressSummary não aparece exatamente uma vez.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

# Verificar que o fragmento existe
if "<>" not in updated[start:start + 2000]:
    print("ERRO: fragmento JSX não foi encontrado.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

APP.write_text(updated, encoding="utf-8")

print("=" * 80)
print("CONFIA — CORREÇÃO JSX HOME / FASE 2")
print("=" * 80)
print()
print("OK: backup criado em /tmp/App.tsx.before_home_insight_jsx_fix")
print("OK: HomeProgressSummary preservado.")
print("OK: reactiveMessageKey preservado.")
print("OK: Home recebeu fragmento JSX.")
print("OK: estrutura {homeScreen === home && (...)} corrigida.")
print("OK: nenhuma tradução alterada.")
print("OK: reactiveEngine não alterado.")
print()
print("PRÓXIMO PASSO: auditoria das linhas 1095–1128.")
print("NÃO EXECUTAR BUILD AINDA.")
print("=" * 80)
