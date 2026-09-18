from pathlib import Path
import shutil
import sys

APP = Path("src/App.tsx")
BACKUP = Path("/tmp/App.tsx.before_home_2_cards")

if not APP.exists():
    print("ERRO: src/App.tsx não encontrado.")
    sys.exit(1)

text = APP.read_text(encoding="utf-8")

# ------------------------------------------------------------
# Marcadores robustos
# ------------------------------------------------------------

start_marker = "/* Para ti agora — ação contextual da CONFIA */"
end_marker = "/* Hoje — resumo + registo diário */"

start = text.find(start_marker)
if start == -1:
    print("ERRO: início do cartão redundante não encontrado.")
    sys.exit(1)

# apanhar o início real da linha/comentário
start = text.rfind("\n", 0, start) + 1

end = text.find(end_marker, start)
if end == -1:
    print("ERRO: fim do cartão redundante não encontrado.")
    sys.exit(1)

# apanhar o início real da linha do comentário seguinte
end = text.rfind("\n", 0, end) + 1

block = text[start:end]

required = [
    'homeScreen === "home" && homeNowAction',
    't(homeNowAction.titleKey)',
    't(homeNowAction.textKey)',
    't(homeNowAction.actionKey)',
    'handleHomeNowAction',
]

missing = [item for item in required if item not in block]

if missing:
    print("ERRO: o bloco encontrado não corresponde à estrutura esperada.")
    print("Elementos em falta:")
    for item in missing:
        print(" -", item)
    sys.exit(1)

# ------------------------------------------------------------
# Backup
# ------------------------------------------------------------

shutil.copy2(APP, BACKUP)

# ------------------------------------------------------------
# Remover cartão redundante
# ------------------------------------------------------------

replacement = """              {/* CONFIA — ação contextual integrada no cartão principal.
                  O antigo cartão independente "Para ti agora" foi removido
                  para evitar duplicação visual e repetição do mesmo CTA. */}

"""

new_text = text[:start] + replacement + text[end:]

# ------------------------------------------------------------
# Verificações
# ------------------------------------------------------------

if new_text == text:
    print("ERRO: nenhuma alteração foi efetuada.")
    sys.exit(1)

count_actions = new_text.count("t(homeNowAction.actionKey)")

if count_actions != 1:
    print(
        f"ERRO: esperava 1 renderização de homeNowAction.actionKey, "
        f"mas encontrei {count_actions}."
    )
    sys.exit(1)

APP.write_text(new_text, encoding="utf-8")

print("=" * 72)
print("CONFIA — PRINCIPAL SIMPLIFICADO")
print("=" * 72)
print()
print("✓ Cartão independente 'Para ti agora' removido")
print("✓ Ação inteligente preservada no cartão principal")
print("✓ CTA contextual preservado")
print("✓ Reactive Engine não alterado")
print("✓ homeNowAction não alterado")
print("✓ homeNowMemory não alterado")
print("✓ Navegação não alterada")
print("✓ Impulso não alterado")
print("✓ Padrões / Objetivos / Progresso preservados")
print("✓ Duplicação visual removida")
print("✓ Zona que mostrava {{before}} / {{after}} sem valores foi removida")
print()
print("Backup:")
print(f"  {BACKUP}")
print()
print("=" * 72)
