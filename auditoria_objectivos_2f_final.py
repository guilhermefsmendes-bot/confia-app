from pathlib import Path
import re

ROOT = Path.cwd()

ENGINE = ROOT / "src/data/reactive/reactiveEngine.ts"
APP = ROOT / "src/App.tsx"
RESPONSES = ROOT / "src/data/reactive/reactiveResponses.ts"
INTENTS = ROOT / "src/data/reactive/reactiveIntentEngine.ts"

print("=" * 78)
print("CONFIA — AUDITORIA FINAL 2F")
print("=" * 78)
print()


def show_section(title, text, start_pattern, chars=5000):
    print()
    print("=" * 78)
    print(title)
    print("=" * 78)

    match = re.search(start_pattern, text)

    if not match:
        print("NÃO ENCONTRADO")
        return

    start = match.start()
    print(text[start:start + chars])


files = {
    "ENGINE": ENGINE,
    "APP": APP,
    "RESPONSES": RESPONSES,
    "INTENTS": INTENTS,
}

contents = {}

for name, path in files.items():
    if not path.exists():
        print(f"ERRO: {path} não existe.")
        raise SystemExit(1)

    contents[name] = path.read_text(encoding="utf-8")


engine = contents["ENGINE"]
app = contents["APP"]
responses = contents["RESPONSES"]
intents = contents["INTENTS"]


# ============================================================
# 1. SOURCE OBJECTIVE
# ============================================================

show_section(
    "1. BUILD REACTIVE CONTEXT — SOURCE OBJECTIVE",
    engine,
    r'input\.source === "objective"',
    4500,
)


# ============================================================
# 2. DETECT SITUATION
# ============================================================

show_section(
    "2. DETECT SITUATION — ORDEM COMPLETA",
    engine,
    r'function detectSituation',
    10000,
)


# ============================================================
# 3. MÉTRICAS DE OBJETIVOS
# ============================================================

show_section(
    "3. MÉTRICAS TEMPORAIS DOS OBJETIVOS",
    engine,
    r'const validObjectiveRecords',
    5000,
)


# ============================================================
# 4. EFFECT DO SEPARADOR OBJETIVOS
# ============================================================

show_section(
    "4. LEITURA PASSIVA AO ENTRAR NOS OBJETIVOS",
    app,
    r'Objetivos — leitura contextual ao entrar',
    3500,
)


# ============================================================
# 5. CONCLUSÃO EXPLÍCITA
# ============================================================

show_section(
    "5. CONCLUSÃO EXPLÍCITA DE OBJETIVO",
    app,
    r'2F\.1 — conclusão atual',
    4000,
)


# ============================================================
# 6. UI DA REAÇÃO
# ============================================================

match = re.search(
    r'currentTab === 1 && reactiveMessageKey',
    app
)

print()
print("=" * 78)
print("6. UI DA REAÇÃO NO SEPARADOR OBJETIVOS")
print("=" * 78)

if match:
    start = max(0, match.start() - 700)
    print(app[start:match.start() + 3000])
else:
    print("NÃO ENCONTRADO")


# ============================================================
# 7. RESPOSTAS OBJECTIVE
# ============================================================

show_section(
    "7. RESPOSTAS OBJECTIVE",
    responses,
    r'"objective_completed_01"',
    4500,
)


# ============================================================
# 8. INTENTS OBJECTIVE
# ============================================================

show_section(
    "8. INTENTS OBJECTIVE",
    intents,
    r'id: "objective_success"',
    3000,
)


# ============================================================
# 9. CHECKS AUTOMÁTICOS
# ============================================================

print()
print("=" * 78)
print("9. CHECKS AUTOMÁTICOS")
print("=" * 78)
print()

checks = [
    (
        "objective_completed explícito",
        'situation: "objective_completed" as const'
        in engine,
    ),
    (
        "source objective explícito",
        'input.source === "objective"'
        in engine,
    ),
    (
        "melhoria temporal",
        'situation: "objectives_improving"'
        in engine,
    ),
    (
        "declínio temporal",
        'situation: "objectives_declining"'
        in engine,
    ),
    (
        "consistência temporal",
        'situation: "objectives_consistent"'
        in engine,
    ),
    (
        "mínimo 2 dias recentes",
        "metrics.objectiveValidDays >= 2"
        in engine,
    ),
    (
        "mínimo 2 dias anteriores",
        "metrics.previousObjectiveValidDays >= 2"
        in engine,
    ),
    (
        "registos inválidos ignorados",
        "item.total > 0"
        in engine,
    ),
    (
        "intent consistency",
        'intent: "recognize_consistency"'
        in intents,
    ),
    (
        "resposta consistency",
        '"objectives_consistent_01"'
        in responses,
    ),
    (
        "resposta imediata guardada",
        "objectiveReactiveResult.response.translationKey"
        in app,
    ),
    (
        "resposta explícita registada",
        "objectiveReactiveResult.response.id"
        in app
        and "recordReactiveResponse({"
        in app,
    ),
    (
        "leitura passiva no tab 1",
        'if (currentTab !== 1) return;'
        in app,
    ),
    (
        "UI Objective usa resposta reativa",
        "currentTab === 1 && reactiveMessageKey"
        in app,
    ),
]

for label, ok in checks:
    status = "✓" if ok else "✗"
    print(f"{status} {label}")


# ============================================================
# 10. POSSÍVEL FALLBACK GENÉRICO
# ============================================================

print()
print("=" * 78)
print("10. RISCO DE FALLBACK GENÉRICO")
print("=" * 78)
print()

objective_pos = engine.find(
    'input.source === "objective"'
)

fallback_pos = engine.find(
    "detection = detectSituation(metrics, data);"
)

if objective_pos != -1 and fallback_pos != -1:
    print(
        "source objective position:",
        objective_pos
    )
    print(
        "fallback detectSituation position:",
        fallback_pos
    )

    if fallback_pos > objective_pos:
        print()
        print(
            "ATENÇÃO: existe fallback para "
            "detectSituation depois dos ramos "
            "source-specific."
        )
        print(
            "Precisamos confirmar pelo output acima "
            "se source='objective' sem conclusão "
            "pode receber situações não relacionadas "
            "com Objetivos."
        )
else:
    print(
        "Não foi possível localizar automaticamente "
        "a relação entre Objective e fallback."
    )


# ============================================================
# FINAL
# ============================================================

print()
print("=" * 78)
print("AUDITORIA TERMINADA — APENAS LEITURA")
print("=" * 78)
print()
print("Nenhum ficheiro foi alterado.")
print()
