from pathlib import Path
import shutil
import sys

APP = Path("src/App.tsx")
BACKUP = Path(
    "/tmp/App.tsx.before_companheiro_premium_a3_3"
)

if not APP.exists():
    print("ERRO: src/App.tsx não encontrado.")
    sys.exit(1)

source = APP.read_text(encoding="utf-8")

# ============================================================
# CONFIA — COMPANHEIRO PREMIUM A3.3
#
# VOZ ÚNICA
#
# Remove APENAS o cartão visual reativo do Principal.
#
# Preserva:
# - reactiveMessageKey
# - setReactiveMessageKey
# - analyzeReactiveState
# - recordReactiveResponse
# - histórico/cooldown
# - resposta reativa dos Objetivos
# - Companion Reaction Engine
# - homeReactiveResult
# - homeNowAction
# ============================================================

start_marker = '''{reactiveMessageKey && (
  <div
    className={`mt-4 rounded-[28px]'''

end_marker = '''  </div>
)}

  </>
)}'''

start = source.find(start_marker)

if start == -1:
    print(
        "ERRO: início do cartão reativo "
        "do Principal não encontrado."
    )
    sys.exit(1)

end = source.find(end_marker, start)

if end == -1:
    print(
        "ERRO: fim do cartão reativo "
        "do Principal não encontrado."
    )
    sys.exit(1)

# Não remover os fechos estruturais seguintes.
# Cortamos apenas até antes do "\n\n  </>\n)}".
card_end_marker = '''  </div>
)}'''

card_end = source.find(
    card_end_marker,
    start,
)

if card_end == -1 or card_end > end:
    print(
        "ERRO: limite seguro do cartão "
        "não encontrado."
    )
    sys.exit(1)

card_end += len(card_end_marker)

removed = source[start:card_end]

# Segurança: confirmar que estamos a remover
# precisamente o cartão pretendido.
required_inside = [
    "reactiveInsightTitle",
    "earlyLearningInsight.eyebrow",
    "t(reactiveMessageKey)",
    "<Sparkles",
]

for marker in required_inside:
    if marker not in removed:
        print(
            "ERRO: o bloco encontrado não parece "
            f"ser o cartão correto: {marker}"
        )
        sys.exit(1)

# Não aceitar remoção demasiado grande.
removed_lines = removed.count("\n") + 1

if removed_lines > 80:
    print(
        "ERRO: bloco encontrado é demasiado grande "
        f"({removed_lines} linhas). Nada alterado."
    )
    sys.exit(1)

shutil.copy2(APP, BACKUP)

replacement = '''{/* CONFIA A3.3 — a reação do Principal é agora
    apresentada pela própria CONFIA através do seu balão.
    reactiveMessageKey permanece ativo para os restantes
    fluxos reativos e separadores. */}'''

updated = (
    source[:start]
    + replacement
    + source[card_end:]
)

APP.write_text(
    updated,
    encoding="utf-8",
)

# ============================================================
# VALIDAÇÃO
# ============================================================

written = APP.read_text(encoding="utf-8")

checks = {
    "Cartão do Principal removido":
        "CONFIA A3.3" in written,

    "Estado reactiveMessageKey preservado":
        "const [reactiveMessageKey, setReactiveMessageKey]"
        in written,

    "Setter preservado":
        "setReactiveMessageKey(" in written,

    "Histórico reativo preservado":
        "recordReactiveResponse({" in written,

    "Reactive Engine preservado":
        "analyzeReactiveState({" in written,

    "Cérebro geral preservado":
        "const homeReactiveResult = (() => {"
        in written,

    "Companheiro preservado":
        "<ConfiaCompanionHome" in written,

    "Ação inteligente preservada":
        "const homeNowAction = (() => {"
        in written,

    "Objetivos continuam a usar reactiveMessageKey":
        "currentTab === 1 && reactiveMessageKey"
        in written,
}

failed = [
    name
    for name, ok in checks.items()
    if not ok
]

if failed:
    shutil.copy2(BACKUP, APP)

    print("ERRO: validação falhou.")
    for item in failed:
        print(" -", item)

    print()
    print("App.tsx restaurado automaticamente.")
    sys.exit(1)

# Confirmar que ainda existem utilizações da key
# fora do cartão eliminado.
remaining_uses = written.count(
    "reactiveMessageKey"
)

if remaining_uses < 3:
    shutil.copy2(BACKUP, APP)

    print(
        "ERRO: reactiveMessageKey parece ter sido "
        "removido em excesso."
    )
    print("App.tsx restaurado automaticamente.")
    sys.exit(1)

print("=" * 76)
print("CONFIA — COMPANHEIRO PREMIUM A3.3")
print("=" * 76)
print()
print("✓ Cartão reativo duplicado removido do Principal")
print("✓ A CONFIA passa a ser a voz reativa do Principal")
print("✓ reactiveMessageKey preservado")
print("✓ setReactiveMessageKey preservado")
print("✓ Resposta reativa dos Objetivos preservada")
print("✓ analyzeReactiveState preservado")
print("✓ recordReactiveResponse preservado")
print("✓ Histórico/cooldown preservado")
print("✓ homeReactiveResult preservado")
print("✓ homeNowAction preservado")
print("✓ Companion Reaction Engine preservado")
print("✓ XP não alterado")
print("✓ Navegação não alterada")
print("✓ Traduções não alteradas")
print("✓ Nenhum storage alterado")
print("✓ Nenhum timer adicionado")
print()
print(f"Bloco removido: {removed_lines} linhas")
print()
print("Backup:")
print(f"  {BACKUP}")
print()
print("A3.3 aplicado.")
print("=" * 76)
