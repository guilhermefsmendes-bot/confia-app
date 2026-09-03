from pathlib import Path
import shutil
import sys

FILE = Path("src/App.tsx")
BACKUP = Path("/tmp/App.tsx.before_1d10a")


def fail(message):
    print(f"ERRO: {message}")
    sys.exit(1)


print("=" * 72)
print("CONFIA — PRINCIPAL VIVO — 1D.10A")
print("REORGANIZAÇÃO DA HIERARQUIA")
print("=" * 72)

if not FILE.exists():
    fail("src/App.tsx não encontrado.")

original = FILE.read_text(encoding="utf-8")
text = original


# ============================================================
# 1. ÂNCORAS
# ============================================================

ACTION_START = (
    '{/* Para ti agora — ação contextual da CONFIA */}'
)

SPACE_START = (
    '{/* O teu espaço — navegação secundária premium */}'
)

TODAY_START = (
    '{/* Hoje — resumo + registo diário */}'
)

REACTIVE_START = (
    '{reactiveMessageKey && ('
)

if text.count(ACTION_START) != 1:
    fail(
        "bloco 'Para ti agora' não encontrado "
        "de forma única."
    )

if text.count(SPACE_START) != 1:
    fail(
        "bloco 'O teu espaço' não encontrado "
        "de forma única."
    )

if text.count(TODAY_START) != 1:
    fail(
        "bloco 'Hoje' não encontrado "
        "de forma única."
    )

if text.count(REACTIVE_START) != 1:
    fail(
        "bloco reativo não encontrado "
        "de forma única."
    )


# ============================================================
# 2. LOCALIZAR BLOCOS
# ============================================================

action_start = text.index(ACTION_START)
space_start = text.index(
    SPACE_START,
    action_start
)

if space_start <= action_start:
    fail("ordem atual inesperada.")

action_block = text[
    action_start:space_start
]

if "homeNowAction" not in action_block:
    fail(
        "bloco extraído não contém homeNowAction."
    )

if "handleHomeNowAction" not in action_block:
    fail(
        "bloco extraído não contém "
        "handleHomeNowAction."
    )

if 't(homeNowAction.titleKey)' not in action_block:
    fail(
        "título da ação contextual não encontrado."
    )

if 't(homeNowAction.actionKey)' not in action_block:
    fail(
        "CTA da ação contextual não encontrado."
    )


# ============================================================
# 3. REMOVER BLOCO DA POSIÇÃO ATUAL
# ============================================================

without_action = (
    text[:action_start] +
    text[space_start:]
)

if ACTION_START in without_action:
    fail(
        "bloco Para ti agora permaneceu "
        "na posição antiga."
    )


# ============================================================
# 4. ENCONTRAR FIM DA RESPOSTA REATIVA
# ============================================================

reactive_start = without_action.index(
    REACTIVE_START
)

today_start = without_action.index(
    TODAY_START,
    reactive_start
)

between_reactive_and_today = without_action[
    reactive_start:today_start
]

# O bloco termina com:
#
# )}
#
#   </>
# )}
#
# antes de Hoje.
#
# Usamos o início de Hoje como âncora segura:
# inserimos a ação imediatamente antes de Hoje.
#
# Isto mantém:
# HomeWorld
# → memória isolada quando aplicável
# → mensagem reativa
# → Para ti agora
# → Hoje

insert_at = today_start


# ============================================================
# 5. INSERIR NA NOVA POSIÇÃO
# ============================================================

separator = "\n"

new_text = (
    without_action[:insert_at]
    + action_block.rstrip()
    + "\n\n"
    + without_action[insert_at:]
)


# ============================================================
# 6. VALIDAR NOVA ORDEM
# ============================================================

world_pos = new_text.find("<HomeWorld")
reactive_pos = new_text.find(
    REACTIVE_START,
    world_pos
)
action_pos = new_text.find(
    ACTION_START,
    world_pos
)
today_pos = new_text.find(
    TODAY_START,
    world_pos
)
space_pos = new_text.find(
    SPACE_START,
    world_pos
)

positions = [
    world_pos,
    reactive_pos,
    action_pos,
    today_pos,
    space_pos,
]

if any(pos == -1 for pos in positions):
    fail(
        "uma das secções principais desapareceu."
    )

if not (
    world_pos
    < reactive_pos
    < action_pos
    < today_pos
    < space_pos
):
    fail(
        "a nova hierarquia não ficou na "
        "ordem esperada."
    )


# ============================================================
# 7. GARANTIR BLOCO ÚNICO
# ============================================================

if new_text.count(ACTION_START) != 1:
    fail(
        "Para ti agora ficou duplicado."
    )

if new_text.count(
    "handleHomeNowAction"
) != original.count(
    "handleHomeNowAction"
):
    fail(
        "número de referências a "
        "handleHomeNowAction mudou."
    )

if new_text.count(
    "homeNowContext"
) != original.count(
    "homeNowContext"
):
    fail(
        "número de referências a "
        "homeNowContext mudou."
    )


# ============================================================
# 8. GARANTIR QUE O BLOCO NÃO FOI MODIFICADO
# ============================================================

new_action_start = new_text.index(
    ACTION_START
)

new_today_start = new_text.index(
    TODAY_START,
    new_action_start
)

moved_block = new_text[
    new_action_start:new_today_start
].rstrip()

if moved_block != action_block.rstrip():
    fail(
        "conteúdo interno de Para ti agora "
        "foi alterado durante a movimentação."
    )


# ============================================================
# 9. GUARDRAILS
# ============================================================

if new_text.count("<HomeWorld") != original.count(
    "<HomeWorld"
):
    fail("HomeWorld foi alterado/duplicado.")

if new_text.count(
    "<HomeProgressSummary"
) != original.count(
    "<HomeProgressSummary"
):
    fail(
        "HomeProgressSummary foi "
        "alterado/duplicado."
    )

if new_text.count(
    'id="home-daily-record"'
) != original.count(
    'id="home-daily-record"'
):
    fail(
        "registo diário foi "
        "alterado/duplicado."
    )

if new_text.count(
    SPACE_START
) != original.count(
    SPACE_START
):
    fail(
        "O teu espaço foi alterado/duplicado."
    )

if "localStorage.setItem(" in (
    new_text[len(original):]
    if len(new_text) > len(original)
    else ""
):
    fail("foi introduzido novo storage.")


# ============================================================
# 10. ALTERAÇÃO REAL
# ============================================================

if new_text == original:
    fail("nenhuma alteração foi produzida.")


# ============================================================
# 11. BACKUP + WRITE
# ============================================================

shutil.copy2(FILE, BACKUP)

FILE.write_text(
    new_text,
    encoding="utf-8"
)


print("✓ HomeWorld preservado")
print("✓ Memória existente preservada")
print("✓ Mensagem reativa preservada")
print("✓ Para ti agora movido para cima")
print("✓ Conteúdo interno da ação não alterado")
print("✓ Hoje preservado")
print("✓ Registo diário preservado")
print("✓ O teu espaço preservado")
print("✓ homeNowContext preservado")
print("✓ handleHomeNowAction preservado")
print("✓ Nenhum storage novo")
print("✓ Nenhuma tradução nova")
print("✓ Nenhuma dependência nova")
print()
print("Nova hierarquia:")
print("  O teu Mundo")
print("       ↓")
print("  A CONFIA percebeu")
print("       ↓")
print("  Para ti agora")
print("       ↓")
print("  Hoje")
print("       ↓")
print("  Registar")
print("       ↓")
print("  O teu espaço")
print()
print(f"✓ Backup: {BACKUP}")
print("=" * 72)
print("OK — 1D.10A APLICADA")
print("=" * 72)
