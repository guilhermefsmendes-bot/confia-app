from pathlib import Path
import re
import sys

APP = Path("src/App.tsx")

if not APP.exists():
    print("ERRO: src/App.tsx não encontrado.")
    sys.exit(1)

text = APP.read_text(encoding="utf-8")

# ------------------------------------------------------------
# Localizar o bloco que introduzimos na Fase 2
# ------------------------------------------------------------

start_marker = '{reactiveMessageKey && ('

positions = [m.start() for m in re.finditer(re.escape(start_marker), text)]

if len(positions) != 1:
    print(
        f"ERRO: esperava exatamente 1 bloco reactiveMessageKey. "
        f"Encontrados: {len(positions)}"
    )
    print("NENHUMA ALTERAÇÃO FEITA.")
    sys.exit(1)

start = positions[0]

# ------------------------------------------------------------
# Localizar o fim do bloco reativo
# ------------------------------------------------------------

end_match = re.search(
    r'\n\s*\)\}',
    text[start:]
)

if not end_match:
    print("ERRO: não encontrei o fim do bloco reativo.")
    print("NENHUMA ALTERAÇÃO FEITA.")
    sys.exit(1)

end = start + end_match.end()

reactive_block = text[start:end]

# ------------------------------------------------------------
# Verificar o HomeProgressSummary imediatamente antes
# ------------------------------------------------------------

summary = '<HomeProgressSummary />'

summary_pos = text.rfind(summary, 0, start)

if summary_pos == -1:
    print("ERRO: HomeProgressSummary não encontrado antes da resposta.")
    print("NENHUMA ALTERAÇÃO FEITA.")
    sys.exit(1)

# ------------------------------------------------------------
# Encontrar o fechamento da expressão:
#
# {homeScreen === "home" && (
#    ...
#    <HomeProgressSummary />
# )}
#
# Precisamos colocar a resposta DEPOIS desse )}
# ------------------------------------------------------------

after_summary = text[summary_pos + len(summary):start]

close_match = re.search(
    r'\n\s*\)\}',
    after_summary
)

if not close_match:
    print(
        "ERRO: não foi encontrado o fechamento da expressão "
        "homeScreen === home."
    )
    print("NENHUMA ALTERAÇÃO FEITA.")
    sys.exit(1)

close_pos = summary_pos + len(summary) + close_match.end()

# ------------------------------------------------------------
# Remover o bloco reativo da posição errada
# ------------------------------------------------------------

without = text[:start] + text[end:]

# Recalcular posição do fechamento após remoção
summary_pos2 = without.rfind(summary)

if summary_pos2 == -1:
    print("ERRO interno: HomeProgressSummary desapareceu.")
    sys.exit(1)

after_summary2 = without[summary_pos2 + len(summary):]

close_match2 = re.search(
    r'\n\s*\)\}',
    after_summary2
)

if not close_match2:
    print("ERRO interno: fechamento do bloco Home não encontrado.")
    sys.exit(1)

close_pos2 = summary_pos2 + len(summary) + close_match2.end()

# ------------------------------------------------------------
# Inserir depois do fechamento do bloco Home
# ------------------------------------------------------------

insertion = "\n\n" + reactive_block

updated = (
    without[:close_pos2]
    + insertion
    + without[close_pos2:]
)

# ------------------------------------------------------------
# Validação
# ------------------------------------------------------------

if updated.count('{reactiveMessageKey && (') != 1:
    print("ERRO: bloco reactiveMessageKey não ficou exatamente uma vez.")
    sys.exit(1)

if updated.count('<HomeProgressSummary />') != 1:
    print("ERRO: HomeProgressSummary não ficou exatamente uma vez.")
    sys.exit(1)

# Confirmar que a sequência problemática desapareceu
bad_pattern = '<HomeProgressSummary />\n\n  {reactiveMessageKey && ('

if bad_pattern in updated:
    print("ERRO: a resposta continua dentro da expressão Home.")
    sys.exit(1)

APP.write_text(updated, encoding="utf-8")

print("=" * 80)
print("CONFIA — CORREÇÃO HOME / FASE 2")
print("=" * 80)
print()
print("OK: resposta reativa removida da posição JSX inválida.")
print("OK: resposta reativa colocada após o fechamento da Home.")
print("OK: HomeProgressSummary preservado.")
print("OK: reactiveMessageKey existe exatamente uma vez.")
print("OK: nenhuma alteração no reactiveEngine.")
print("OK: nenhuma alteração nas traduções.")
print("OK: nenhuma alteração no histórico.")
print()
print("PRÓXIMO PASSO: npm run build")
print("=" * 80)
