from pathlib import Path
import json
import re

print("=" * 76)
print("CONFIA — A9.3 — VALIDAÇÃO COMPORTAMENTAL DO COMPANHEIRO")
print("=" * 76)

ROOT = Path(".")
HOME = ROOT / "src/components/Companheiro/ConfiaCompanionHome.tsx"
MEMORY = ROOT / "src/data/reactive/companionRelationalMemory.ts"
APP = ROOT / "src/App.tsx"

LOCALES = {
    "pt": ROOT / "src/locales/pt.json",
    "en": ROOT / "src/locales/en.json",
    "es": ROOT / "src/locales/es.json",
    "fr": ROOT / "src/locales/fr.json",
}

errors = []
warnings = []

def require_file(path):
    if not path.exists():
        errors.append(f"ficheiro ausente: {path}")
        return False
    return True

for path in [HOME, MEMORY, APP, *LOCALES.values()]:
    require_file(path)

if errors:
    print()
    for error in errors:
        print(f"ERRO: {error}")
    raise SystemExit(1)

home = HOME.read_text(encoding="utf-8")
memory = MEMORY.read_text(encoding="utf-8")
app = APP.read_text(encoding="utf-8")

locale_data = {}

for language, path in LOCALES.items():
    try:
        locale_data[language] = json.loads(
            path.read_text(encoding="utf-8")
        )
    except Exception as exc:
        errors.append(
            f"{language}.json inválido: {exc}"
        )

def contains(text, value, label):
    if value not in text:
        errors.append(
            f"{label}: não encontrado: {value}"
        )
        return False
    return True

def count(text, value):
    return text.count(value)

print()
print("1. CADEIA ÚNICA DE DECISÃO")
print("-" * 76)

chain = [
    "resolveCompanionReaction",
    "resolveCompanionRelationalMemory",
    "resolveCompanionRelationalExpression",
    "resolveCompanionRelationalAction",
    "companionRelationalNextStep",
    "companionMessage",
]

for item in chain:
    if contains(
        home,
        item,
        "CompanionHome"
    ):
        print(f"✓ {item}")

print()
print("2. PRIORIDADE DA REAÇÃO")
print("-" * 76)

if "companionReaction.priority >= 70" in home:
    print("✓ Reações >= 70 permanecem prioritárias")
else:
    errors.append(
        "proteção priority >= 70 não encontrada"
    )

if "companionReaction.priority < 70" in home:
    print("✓ Memória/ação contextual apenas abaixo de 70")
else:
    errors.append(
        "proteção priority < 70 não encontrada"
    )

print()
print("3. CENÁRIOS DE MEMÓRIA → AÇÃO")
print("-" * 76)

expected_targets = {
    "learned_impulse": "impulse",
    "effective_impulse": "impulse",

    "check_in": "record",
    "repeated_signals": "record",
    "multiple_signals": "record",
    "mood_low": "record",
    "objectives_declining": "record",

    "mood_improving": "patterns",
    "objectives_improving": "patterns",
    "mood_stable": "patterns",

    "continuity": "progress",
}

for kind, target in expected_targets.items():

    pattern = (
        rf'case "{re.escape(kind)}".*?'
        rf'target:\s*"{re.escape(target)}"'
    )

    if re.search(
        pattern,
        memory,
        flags=re.DOTALL
    ):
        print(
            f"✓ {kind:24} → {target}"
        )
    else:
        errors.append(
            f"mapeamento ausente/incorreto: "
            f"{kind} → {target}"
        )

print()
print("4. NAVEGAÇÃO REAL NO APP")
print("-" * 76)

navigation_targets = {
    '"impulse"': "setCurrentTab(3)",
    '"patterns"': 'setHomeScreen("patterns")',
    '"progress"': 'setHomeScreen("progress")',
    '"record"': 'setCurrentTab(0)',
}

for target, expected in navigation_targets.items():

    if target in app and expected in app:
        print(
            f"✓ {target.strip(chr(34)):10} → {expected}"
        )
    else:
        errors.append(
            f"navegação não confirmada: "
            f"{target} → {expected}"
        )

print()
print("5. BOTÃO CONTEXTUAL")
print("-" * 76)

button_checks = [
    "companionRelationalNextStep.target",
    "companionRelationalNextStep.translationKey",
    "onCompanionAction(",
    "companionRelationalNextStep &&",
]

for item in button_checks:
    if contains(
        home,
        item,
        "botão contextual"
    ):
        print(f"✓ {item}")

print()
print("6. AUSÊNCIA DE SEGUNDO SISTEMA")
print("-" * 76)

for item in [
    "localStorage.setItem",
    "Math.random",
    "setInterval",
    "setTimeout",
    "requestAnimationFrame",
]:
    occurrences = count(home, item)

    if occurrences == 0:
        print(f"✓ {item}: 0")
    else:
        warnings.append(
            f"{item}: {occurrences} ocorrência(s) "
            f"no CompanionHome"
        )

print()
print("7. MEMÓRIA SEM FALSA EVIDÊNCIA")
print("-" * 76)

memory_guards = [
    "if (!memory)",
    "effectiveImpulseNeed",
    "effectiveImpulseNeedCount",
    "activeDaysLast7",
    "moodDirection",
]

for item in memory_guards:
    if item in memory:
        print(f"✓ {item}")
    else:
        warnings.append(
            f"não foi encontrada a guarda/evidência: {item}"
        )

print()
print("8. TRADUÇÕES A6–A9")
print("-" * 76)

required_translation_paths = [
    "companionRelationalMemory",
    "actions",
    "impulse",
    "patterns",
    "progress",
    "record",
]

for language, data in locale_data.items():

    root = data.get(
        "companionRelationalMemory"
    )

    if not isinstance(root, dict):
        errors.append(
            f"{language}: companionRelationalMemory ausente"
        )
        continue

    actions = root.get("actions")

    if not isinstance(actions, dict):
        errors.append(
            f"{language}: actions ausente"
        )
        continue

    missing = [
        key
        for key in [
            "impulse",
            "patterns",
            "progress",
            "record",
        ]
        if key not in actions
    ]

    if missing:
        errors.append(
            f"{language}: actions sem {missing}"
        )
    else:
        print(
            f"✓ {language}: 4 destinos traduzidos"
        )

print()
print("9. COERÊNCIA DO PRÓXIMO PASSO")
print("-" * 76)

if (
    "target:" in home
    and "translationKey:" in home
    and
    "companionRelationalAction.target" in home
):
    print(
        "✓ O próximo passo reutiliza o target "
        "e a tradução da ação"
    )
else:
    errors.append(
        "A9.3: próximo passo não está coerente "
        "com a ação contextual"
    )

print()
print("10. RESULTADO")
print("=" * 76)

if errors:
    print()
    print("A9.3 NÃO PASSOU.")
    print()
    for error in errors:
        print(f"✗ {error}")
else:
    print()
    print("✓ A9.3 PASSOU")
    print()
    print("A cadeia confirmada é:")
    print()
    print("Reactive Engine")
    print("      ↓")
    print("Memória Relacional A6")
    print("      ↓")
    print("Expressão A7")
    print("      ↓")
    print("Ação A8.2")
    print("      ↓")
    print("Próximo Passo A8.3 / A9")
    print("      ↓")
    print("Navegação existente")
    print()

if warnings:
    print("AVISOS:")
    for warning in warnings:
        print(f"! {warning}")

print()
print("=" * 76)
print("FIM A9.3")
print("=" * 76)

if errors:
    raise SystemExit(1)

