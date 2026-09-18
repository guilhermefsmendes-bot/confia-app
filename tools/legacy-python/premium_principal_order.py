from pathlib import Path
import shutil
import sys

path = Path("src/App.tsx")

if not path.exists():
    print("ERRO: src/App.tsx não encontrado.")
    sys.exit(1)

text = path.read_text(encoding="utf-8")
original = text

# ============================================================
# CONFIA — PRINCIPAL PREMIUM 1B.5A.3
#
# Reorganização da hierarquia da Home:
#
# 1. Mundo
# 2. A Confia reparou...
# 3. Hoje
# 4. O teu espaço / navegação
# 5. SOS
#
# Não altera lógica.
# Não altera traduções.
# Não cria storage.
# ============================================================


# ------------------------------------------------------------
# 1. Localizar bloco da navegação secundária
# ------------------------------------------------------------

nav_start_marker = '''{/* Navegação secundária premium da Home */}'''

nav_end_marker = '''              {/* Crisis Screening SOS Button */}'''

nav_start = text.find(nav_start_marker)

if nav_start == -1:
    print("ERRO: início da navegação secundária não encontrado.")
    sys.exit(1)

nav_end = text.find(nav_end_marker, nav_start)

if nav_end == -1:
    print("ERRO: fim da navegação secundária não encontrado.")
    sys.exit(1)

nav_block = text[nav_start:nav_end]

if 'setHomeScreen("companion")' not in nav_block:
    print("ERRO: Companion não encontrado dentro da navegação.")
    sys.exit(1)

if 'setHomeScreen("patterns")' not in nav_block:
    print("ERRO: Padrões não encontrado dentro da navegação.")
    sys.exit(1)

if 'setHomeScreen("inventory")' not in nav_block:
    print("ERRO: Inventário não encontrado dentro da navegação.")
    sys.exit(1)

if 'setHomeScreen("shop")' not in nav_block:
    print("ERRO: Loja não encontrada dentro da navegação.")
    sys.exit(1)

if 'setHomeScreen("settings")' not in nav_block:
    print("ERRO: Definições não encontradas dentro da navegação.")
    sys.exit(1)


# ------------------------------------------------------------
# 2. Localizar bloco SOS
# ------------------------------------------------------------

sos_start = nav_end

today_marker = '''              {/* Hoje — resumo + registo diário */}'''

sos_end = text.find(today_marker, sos_start)

if sos_end == -1:
    print("ERRO: início da área Hoje não encontrado.")
    sys.exit(1)

sos_block = text[sos_start:sos_end]

if 'setTriageOpen(true)' not in sos_block:
    print("ERRO: ação setTriageOpen não encontrada no bloco SOS.")
    sys.exit(1)

if 't("crisisQuestion")' not in sos_block:
    print("ERRO: texto crisisQuestion não encontrado no bloco SOS.")
    sys.exit(1)


# ------------------------------------------------------------
# 3. Localizar área Hoje completa
# ------------------------------------------------------------

today_start = sos_end

patterns_marker = '''{/* Padrões — ecrã próprio dentro do Principal */}'''

patterns_pos = text.find(patterns_marker, today_start)

if patterns_pos == -1:
    print("ERRO: bloco Padrões não encontrado depois da Home.")
    sys.exit(1)

tail_before_patterns = text[today_start:patterns_pos]

# Encontrar o fecho real da Home dentro desta região.
home_end_marker = '''</div>

            </div>
          )}


'''

home_end_relative = tail_before_patterns.rfind(home_end_marker)

if home_end_relative == -1:
    print("ERRO: fecho estrutural da Home não encontrado.")
    sys.exit(1)

today_end = today_start + home_end_relative

today_block = text[today_start:today_end]

if "<HomeProgressSummary />" not in today_block:
    print("ERRO: HomeProgressSummary não encontrado na área Hoje.")
    sys.exit(1)

if "showDayRatingPanel" not in today_block:
    print("ERRO: painel de registo diário não encontrado na área Hoje.")
    sys.exit(1)

if "handleSaveRatings" not in today_block:
    print("ERRO: handleSaveRatings não encontrado na área Hoje.")
    sys.exit(1)


# ------------------------------------------------------------
# 4. Confirmar que os três blocos estão atualmente
#    na ordem esperada:
#
# navegação → SOS → Hoje
# ------------------------------------------------------------

if not (nav_start < sos_start < today_start < today_end):
    print("ERRO: ordem atual dos blocos não corresponde ao esperado.")
    sys.exit(1)


# ------------------------------------------------------------
# 5. Reconstruir a região
#
# NOVA ORDEM:
#
# Hoje
# Navegação
# SOS
# ------------------------------------------------------------

old_region = text[nav_start:today_end]

new_region = (
    today_block.rstrip()
    + "\n\n"
    + nav_block.strip()
    + "\n\n"
    + sos_block.strip()
    + "\n\n"
)

if text.count(old_region) != 1:
    print("ERRO: região estrutural não é única.")
    sys.exit(1)

text = text.replace(old_region, new_region, 1)


# ------------------------------------------------------------
# 6. Atualizar comentários para refletir hierarquia premium
# ------------------------------------------------------------

text = text.replace(
    "/* Navegação secundária premium da Home */",
    "/* O teu espaço — navegação secundária da Home */",
    1,
)

text = text.replace(
    "/* Crisis Screening SOS Button */",
    "/* Apoio — acesso SOS sempre disponível */",
    1,
)


# ------------------------------------------------------------
# 7. Verificações estruturais finais
# ------------------------------------------------------------

required = [
    "/* Hoje — resumo + registo diário */",
    "/* O teu espaço — navegação secundária da Home */",
    "/* Apoio — acesso SOS sempre disponível */",
    "<HomeProgressSummary />",
    'setHomeScreen("companion")',
    'setHomeScreen("patterns")',
    'setHomeScreen("inventory")',
    'setHomeScreen("shop")',
    'setHomeScreen("settings")',
    "setTriageOpen(true)",
    "handleSaveRatings",
    "showDayRatingPanel",
]

for fragment in required:
    if fragment not in text:
        print(f"ERRO: verificação final falhou: {fragment}")
        sys.exit(1)


# ------------------------------------------------------------
# 8. Confirmar nova ordem
# ------------------------------------------------------------

today_final = text.find(
    "/* Hoje — resumo + registo diário */"
)

nav_final = text.find(
    "/* O teu espaço — navegação secundária da Home */"
)

sos_final = text.find(
    "/* Apoio — acesso SOS sempre disponível */"
)

patterns_final = text.find(
    "/* Padrões — ecrã próprio dentro do Principal */"
)

if not (
    today_final != -1
    and nav_final != -1
    and sos_final != -1
    and patterns_final != -1
):
    print("ERRO: não foi possível validar a nova hierarquia.")
    sys.exit(1)

if not (today_final < nav_final < sos_final < patterns_final):
    print("ERRO: nova ordem da Home ficou incorreta.")
    sys.exit(1)


# ------------------------------------------------------------
# 9. Confirmar unicidade de elementos importantes
# ------------------------------------------------------------

if text.count("<HomeProgressSummary />") != 1:
    print("ERRO: HomeProgressSummary deixou de ser único.")
    sys.exit(1)

if text.count("setTriageOpen(true)") < 1:
    print("ERRO: acesso ao SOS desapareceu.")
    sys.exit(1)

if text.count('setHomeScreen("patterns")') < 1:
    print("ERRO: acesso a Padrões desapareceu.")
    sys.exit(1)


# ------------------------------------------------------------
# 10. Confirmar que houve alteração
# ------------------------------------------------------------

if text == original:
    print("ERRO: nenhuma alteração efetuada.")
    sys.exit(1)


# ------------------------------------------------------------
# 11. Backup fora do projeto
# ------------------------------------------------------------

backup = Path("/tmp/App.tsx.before_principal_order")

shutil.copy2(path, backup)


# ------------------------------------------------------------
# 12. Escrita
# ------------------------------------------------------------

path.write_text(text, encoding="utf-8")


# ------------------------------------------------------------
# 13. Resultado
# ------------------------------------------------------------

print("=" * 72)
print("CONFIA — PRINCIPAL PREMIUM 1B.5A.3")
print("=" * 72)
print("✓ Mundo permanece como protagonista")
print("✓ Insight reativo permanece imediatamente após o mundo")
print("✓ Hoje movido para a posição principal seguinte")
print("✓ Resumo semanal preservado")
print("✓ Registo diário preservado")
print("✓ O teu espaço colocado depois de Hoje")
print("✓ Companion preservado")
print("✓ Padrões preservado")
print("✓ Inventário preservado")
print("✓ Loja preservada")
print("✓ Definições preservadas")
print("✓ SOS colocado no final da hierarquia principal")
print("✓ Nenhuma lógica alterada")
print("✓ Nenhuma tradução alterada")
print("✓ Nenhum storage novo")
print("✓ Nenhuma dependência nova")
print()
print("NOVA HIERARQUIA:")
print("Mundo → Confia reparou → Hoje → O teu espaço → SOS")
print()
print("OK — Principal reorganizado.")
