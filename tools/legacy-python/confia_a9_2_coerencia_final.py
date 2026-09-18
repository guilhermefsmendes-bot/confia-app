from pathlib import Path
import shutil
import json

print("=" * 76)
print("CONFIA — A9.2 — COERÊNCIA FINAL DO COMPANHEIRO")
print("=" * 76)

COMPANION = Path(
    "src/components/Companheiro/ConfiaCompanionHome.tsx"
)

LOCALES = {
    "pt": Path("src/locales/pt.json"),
    "en": Path("src/locales/en.json"),
    "es": Path("src/locales/es.json"),
    "fr": Path("src/locales/fr.json"),
}

BACKUP = Path(
    "/tmp/ConfiaCompanionHome.tsx.before_a9_2"
)


def fail(message):
    print()
    print(f"ERRO: {message}")
    print()
    print("A9.2 revertido através dos backups.")

    if BACKUP.exists():
        shutil.copy2(BACKUP, COMPANION)

    raise SystemExit(1)


# ============================================================
# 1. EXISTÊNCIA
# ============================================================

if not COMPANION.exists():
    fail(
        "ConfiaCompanionHome.tsx não encontrado."
    )

for lang, path in LOCALES.items():
    if not path.exists():
        fail(
            f"Ficheiro de tradução ausente: {path}"
        )


# ============================================================
# 2. BACKUP
# ============================================================

try:
    shutil.copy2(
        COMPANION,
        BACKUP
    )

    for lang, path in LOCALES.items():
        shutil.copy2(
            path,
            Path(f"/tmp/{lang}.json.before_a9_2")
        )

except Exception as exc:
    fail(
        f"não foi possível criar backup: {exc}"
    )


# ============================================================
# 3. LEITURA
# ============================================================

text = COMPANION.read_text(
    encoding="utf-8"
)


# ============================================================
# 4. CONFIRMAR A8.2 / A8.3
# ============================================================

required = [
    "companionRelationalAction",
    "companionRelationalNextStep",
    "resolveCompanionRelationalAction",
    "onCompanionAction",
]

for item in required:
    if item not in text:
        fail(
            f"elemento obrigatório ausente: {item}"
        )


# ============================================================
# 5. CONFIRMAR A ESTRUTURA REAL DO BOTÃO
# ============================================================

old_condition = (
    "{companionRelationalAction && ("
)

old_target = """onCompanionAction(
                    companionRelationalAction.target
                  )"""

old_translation = """{t(
                  companionRelationalMemory.nextStep
                )}"""


if old_condition not in text:
    fail(
        "condição atual do botão não encontrada."
    )

if old_target not in text:
    fail(
        "target atual do botão não encontrado."
    )

if old_translation not in text:
    fail(
        "tradução atual do botão não encontrada."
    )


# ============================================================
# 6. A9.2 — CONDIÇÃO
# ============================================================
#
# A8.2 continua a decidir se existe uma ação.
#
# A9.2 apenas apresenta essa ação através do
# objeto normalizado companionRelationalNextStep.
#

text = text.replace(
    old_condition,
    "{companionRelationalNextStep && (",
    1
)


# ============================================================
# 7. A9.2 — TARGET
# ============================================================

text = text.replace(
    old_target,
    """onCompanionAction(
                    companionRelationalNextStep.target
                  )""",
    1
)


# ============================================================
# 8. A9.2 — TEXTO
# ============================================================
#
# IMPORTANTE:
#
# O resolver A8.2 já fornece a translationKey correta.
#
# Portanto não criamos novas decisões nem novo namespace.
#

text = text.replace(
    old_translation,
    """{t(
                  companionRelationalNextStep.translationKey
                )}""",
    1
)


# ============================================================
# 9. GARANTIR QUE NÃO EXISTE MAIS REFERÊNCIA VISUAL
#    À ESTRUTURA ANTIGA
# ============================================================

button_region_start = text.find(
    "{companionRelationalNextStep && ("
)

if button_region_start == -1:
    fail(
        "novo bloco do botão não encontrado."
    )

button_region_end = text.find(
    "</button>",
    button_region_start
)

if button_region_end == -1:
    fail(
        "fecho do botão não encontrado."
    )

button_region = text[
    button_region_start:
    button_region_end
]

if "companionRelationalAction.target" in button_region:
    fail(
        "botão ainda utiliza companionRelationalAction.target."
    )

if "companionRelationalMemory.nextStep" in button_region:
    fail(
        "botão ainda utiliza companionRelationalMemory.nextStep."
    )


# ============================================================
# 10. CONFIRMAR A8.2 INTACTO
# ============================================================

if (
    "companionReaction.priority < 70"
    not in text
):
    fail(
        "proteção de prioridade A8.2 desapareceu."
    )

if (
    "resolveCompanionRelationalAction("
    not in text
):
    fail(
        "resolver A8.2 desapareceu."
    )


# ============================================================
# 11. CONFIRMAR A6 / A7 INTACTOS
# ============================================================

for item in [
    "resolveCompanionRelationalMemory(",
    "resolveCompanionRelationalExpression(",
    "companionReaction",
]:
    if item not in text:
        fail(
            f"elemento A6/A7 ausente: {item}"
        )


# ============================================================
# 12. PROIBIDOS NOVOS
# ============================================================
#
# Não removemos elementos antigos do avatar.
# Apenas garantimos que A9.2 não acrescentou nenhum.
#

original = BACKUP.read_text(
    encoding="utf-8"
)

forbidden = [
    "Math.random(",
    "setTimeout(",
    "setInterval(",
    "requestAnimationFrame(",
    "localStorage.setItem(",
]

for item in forbidden:
    before = original.count(item)
    after = text.count(item)

    if after > before:
        fail(
            f"A9.2 introduziu novo elemento proibido: {item}"
        )


# ============================================================
# 13. VALIDAR TRADUÇÕES
# ============================================================

for lang, path in LOCALES.items():

    try:
        data = json.loads(
            path.read_text(
                encoding="utf-8"
            )
        )
    except Exception as exc:
        fail(
            f"{lang}: JSON inválido: {exc}"
        )

    try:
        actions = data[
            "companionRelationalMemory"
        ]["actions"]
    except Exception:
        fail(
            f"{lang}: companionRelationalMemory.actions ausente."
        )

    required_actions = [
        "impulse",
        "patterns",
        "progress",
        "record",
    ]

    for action in required_actions:
        if action not in actions:
            fail(
                f"{lang}: ação ausente: {action}"
            )


# ============================================================
# 14. ESCRITA
# ============================================================

try:

    COMPANION.write_text(
        text,
        encoding="utf-8"
    )

except Exception as exc:

    fail(
        f"não foi possível escrever CompanionHome: {exc}"
    )


# ============================================================
# 15. VALIDAÇÃO FINAL
# ============================================================

final_text = COMPANION.read_text(
    encoding="utf-8"
)

final_checks = [
    "companionRelationalNextStep &&",
    "companionRelationalNextStep.target",
    "companionRelationalNextStep.translationKey",
]

for item in final_checks:

    if item not in final_text:

        fail(
            f"validação final falhou: {item}"
        )


# ============================================================
# 16. GARANTIR QUE O BOTÃO ANTIGO DESAPARECEU
# ============================================================

if (
    "companionRelationalMemory.nextStep"
    in final_text
):
    fail(
        "a referência antiga companionRelationalMemory.nextStep ainda existe."
    )


# ============================================================
# 17. RESULTADO
# ============================================================

print()
print("✓ A6 preservado")
print("✓ A7 preservado")
print("✓ A8.2 preservado")
print("✓ A8.3 preservado")
print("✓ companionRelationalNextStep passa a controlar a apresentação")
print("✓ target usa companionRelationalNextStep.target")
print("✓ texto usa companionRelationalNextStep.translationKey")
print("✓ Navegação existente preservada")
print("✓ Resolver de ação preservado")
print("✓ Prioridade >= 70 preservada")
print("✓ Sem segundo sistema de decisão")
print("✓ Sem novo sistema de memória")
print("✓ Sem novo storage")
print("✓ Sem novo histórico")
print("✓ Sem novos timers")
print("✓ Sem novo requestAnimationFrame")
print("✓ Sem novo Math.random")
print("✓ PT / EN / ES / FR")
print("✓ JSON dos 4 idiomas validado")

print()
print("Backup:")
print(f"  {BACKUP}")

print()
print("A9.2 aplicado.")
print("=" * 76)
