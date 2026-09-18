from pathlib import Path

print("=" * 76)
print("CONFIA — A9.4 — INSPEÇÃO FINAL UX DO COMPANHEIRO")
print("=" * 76)

home = Path(
    "src/components/Companheiro/ConfiaCompanionHome.tsx"
)

memory = Path(
    "src/data/reactive/companionRelationalMemory.ts"
)

app = Path("src/App.tsx")

if not home.exists():
    print("ERRO: CompanionHome não encontrado")
    raise SystemExit(1)

if not memory.exists():
    print("ERRO: companionRelationalMemory não encontrado")
    raise SystemExit(1)

if not app.exists():
    print("ERRO: App.tsx não encontrado")
    raise SystemExit(1)

home_text = home.read_text(encoding="utf-8")
memory_text = memory.read_text(encoding="utf-8")
app_text = app.read_text(encoding="utf-8")

print()
print("1. MENSAGEM DO COMPANHEIRO")
print("-" * 76)

checks = [
    "companionMessage",
    "companionReaction",
    "companionRelationalMemory",
    "companionRelationalExpression",
]

for item in checks:
    if item in home_text:
        print(f"✓ {item}")
    else:
        print(f"✗ AUSENTE: {item}")

print()
print("2. HIERARQUIA DE PRIORIDADE")
print("-" * 76)

if "companionReaction.priority >= 70" in home_text:
    print("✓ Reação prioritária >= 70 protegida")
else:
    print("✗ Proteção >= 70 ausente")

if "companionReaction.priority < 70" in home_text:
    print("✓ Ação contextual limitada a prioridade < 70")
else:
    print("✗ Limite < 70 ausente")

print()
print("3. PRÓXIMO PASSO")
print("-" * 76)

for item in [
    "companionRelationalNextStep",
    "companionRelationalNextStep.target",
    "companionRelationalNextStep.translationKey",
]:
    if item in home_text:
        print(f"✓ {item}")
    else:
        print(f"✗ AUSENTE: {item}")

print()
print("4. BOTÃO")
print("-" * 76)

button_items = [
    "<button",
    "onCompanionAction(",
    "companionRelationalNextStep.target",
    "companionRelationalNextStep.translationKey",
]

for item in button_items:
    if item in home_text:
        print(f"✓ {item}")
    else:
        print(f"✗ AUSENTE: {item}")

print()
print("5. BOTÃO CONDICIONAL")
print("-" * 76)

if "companionRelationalNextStep &&" in home_text:
    print("✓ Botão só aparece quando existe próximo passo")
else:
    print("✗ Condição do botão não encontrada")

print()
print("6. AÇÃO → DESTINO")
print("-" * 76)

destinations = [
    '"impulse"',
    '"patterns"',
    '"progress"',
    '"record"',
]

for destination in destinations:
    if destination in memory_text:
        print(f"✓ destino {destination}")
    else:
        print(f"✗ destino ausente: {destination}")

print()
print("7. NAVEGAÇÃO")
print("-" * 76)

navigation = [
    'setCurrentTab(3)',
    'setHomeScreen("patterns")',
    'setHomeScreen("progress")',
    'setCurrentTab(0)',
]

for item in navigation:
    if item in app_text:
        print(f"✓ {item}")
    else:
        print(f"✗ AUSENTE: {item}")

print()
print("8. DUPLICAÇÃO DE SISTEMAS")
print("-" * 76)

for item in [
    "resolveCompanionReaction(",
    "resolveCompanionRelationalMemory(",
    "resolveCompanionRelationalExpression(",
    "resolveCompanionRelationalAction(",
]:

    count = home_text.count(item)

    print(f"{item} {count} ocorrência(s)")

print()
print("9. ELEMENTOS TEMPORAIS")
print("-" * 76)

for item in [
    "setInterval",
    "setTimeout",
    "requestAnimationFrame",
]:

    count = home_text.count(item)

    if count == 0:
        print(f"✓ {item}: 0")
    else:
        print(
            f"! {item}: {count} ocorrência(s) "
            "(existente no componente)"
        )

print()
print("10. ELEMENTOS DE PERSISTÊNCIA")
print("-" * 76)

for item in [
    "localStorage.setItem",
    "localStorage.getItem",
]:

    count = home_text.count(item)

    if count == 0:
        print(f"✓ {item}: 0")
    else:
        print(f"! {item}: {count}")

print()
print("11. FLUXO FINAL")
print("-" * 76)

print("""
Estado reativo
      ↓
Reação prioritária?
      │
      ├── SIM → mensagem/reação prioritária
      │
      └── NÃO
            ↓
      Memória relacional
            ↓
      Expressão contextual
            ↓
      Ação contextual
            ↓
      Próximo passo
            ↓
      Navegação existente
""")

print("=" * 76)
print("FIM DA INSPEÇÃO A9.4")
print("=" * 76)
