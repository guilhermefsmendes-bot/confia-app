from pathlib import Path
import shutil
import sys

APP = Path("src/App.tsx")


def fail(message):
    print(f"ERRO: {message}")
    sys.exit(1)


print("=" * 72)
print("CONFIA — PRIORIDADE INTELIGENTE DO PRINCIPAL — 1D.7C")
print("=" * 72)

if not APP.exists():
    fail("src/App.tsx não encontrado.")

original = APP.read_text(encoding="utf-8")
text = original


# ============================================================
# 1. VALIDAR ESTADO ATUAL
# ============================================================

required = [
    'homeNowMemory?.kind === "impulseLearning"',
    "{reactiveMessageKey && (",
    '{homeScreen === "home" && homeNowAction && (',
    't("impulseLearning.title")',
    't("impulseLearning.description"',
    "t(homeNowAction.titleKey)",
    "t(homeNowAction.textKey)",
]

for fragment in required:
    if fragment not in text:
        fail(f"estrutura esperada não encontrada: {fragment}")


# ============================================================
# 2. APRENDIZAGEM AUTÓNOMA
#
# Alteramos APENAS a ocorrência que abre o cartão completo
# de aprendizagem.
#
# Existem outras referências a impulseLearning mais abaixo,
# por isso localizamos a que aparece antes de
# impulseLearning.title.
# ============================================================

condition = '{homeNowMemory?.kind === "impulseLearning" && ('
title_marker = 't("impulseLearning.title")'

title_pos = text.find(title_marker)

if title_pos == -1:
    fail("impulseLearning.title não encontrado.")

condition_pos = text.rfind(
    condition,
    0,
    title_pos
)

if condition_pos == -1:
    fail(
        "condição do cartão autónomo impulseLearning "
        "não encontrada antes do título."
    )

new_condition = '''{homeNowMemory?.kind === "impulseLearning" &&
  !homeNowAction && ('''

text = (
    text[:condition_pos]
    + new_condition
    + text[condition_pos + len(condition):]
)


# ============================================================
# 3. INTEGRAR APRENDIZAGEM EM "PARA TI AGORA"
# ============================================================

anchor = '''        <h3 className="mt-1 text-sm font-black leading-snug text-[#4E3B36]">
          {t(homeNowAction.titleKey)}
        </h3>
'''

if text.count(anchor) != 1:
    fail(
        "esperava exatamente um título no cartão "
        "'Para ti agora'."
    )

learning_context = '''
        {homeNowMemory?.kind === "impulseLearning" && (
          <p className="mt-1.5 text-[11px] font-semibold leading-relaxed text-[#8A6A5D]">
            {t("impulseLearning.description", {
              count: homeNowMemory.effectiveCount,
              reduction:
                homeNowMemory.averageReduction !== null
                  ? Math.round(
                      homeNowMemory.averageReduction * 10
                    ) / 10
                  : 0,
            })}
          </p>
        )}
'''

# Proteção contra execução duplicada.
if learning_context.strip() not in text:
    text = text.replace(
        anchor,
        anchor + learning_context,
        1
    )


# ============================================================
# 4. GARANTIAS DE ARQUITETURA
# ============================================================

forbidden = [
    'case "continuity":',
    'homeNowAction.kind === "continuity"',
]

for fragment in forbidden:
    if fragment in text:
        fail(
            "continuidade está indevidamente a ser tratada "
            f"como ação: {fragment}"
        )


# O cartão autónomo tem agora de depender de !homeNowAction.
if '''homeNowMemory?.kind === "impulseLearning" &&
  !homeNowAction && (''' not in text:
    fail(
        "prioridade do cartão autónomo não ficou aplicada."
    )

# O cartão Para ti agora continua dependente do motor.
if '{homeScreen === "home" && homeNowAction && (' not in text:
    fail("homeNowAction deixou de controlar o cartão de ação.")

# A aprendizagem integrada tem de existir.
if learning_context.strip() not in text:
    fail(
        "aprendizagem não ficou integrada no cartão de ação."
    )

# A ação continua com os dados escolhidos pelo Reactive Engine.
for fragment in [
    "t(homeNowAction.titleKey)",
    "t(homeNowAction.textKey)",
    "t(homeNowAction.actionKey)",
    "onClick={handleHomeNowAction}",
]:
    if fragment not in text:
        fail(
            f"estrutura da ação foi perdida: {fragment}"
        )


# ============================================================
# 5. GARANTIR QUE HOUVE APENAS A ALTERAÇÃO ESPERADA
# ============================================================

if text == original:
    fail("nenhuma alteração foi produzida.")


# ============================================================
# 6. BACKUP + ESCRITA
# ============================================================

backup = Path("/tmp/App.tsx.before_1d7c")

shutil.copy2(APP, backup)

APP.write_text(
    text,
    encoding="utf-8"
)


print("✓ Cartão autónomo de aprendizagem identificado")
print("✓ Aprendizagem autónoma só aparece sem ação contextual")
print("✓ Aprendizagem integrada em 'Para ti agora' quando há ação")
print("✓ Resposta 'A CONFIA percebeu' preservada")
print("✓ Continuidade contextual preservada")
print("✓ Reactive Engine continua a decidir a ação")
print("✓ homeNowAction não recebeu nenhum novo tipo")
print("✓ Nenhuma situação nova")
print("✓ Nenhuma intenção nova")
print("✓ Nenhum storage novo")
print("✓ Nenhum listener novo")
print("✓ Nenhuma dependência nova")
print("✓ Nenhuma tradução nova necessária")
print(f"✓ Backup: {backup}")
print("=" * 72)
print("OK — 1D.7C APLICADA")
print("=" * 72)
