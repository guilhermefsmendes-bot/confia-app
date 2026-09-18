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
# CONFIA — PRINCIPAL PREMIUM 1B.5A.1
# Separar Padrões do fluxo principal da Home
# ============================================================

# ------------------------------------------------------------
# 1. Alargar homeScreen
# ------------------------------------------------------------

old_state = '''const [homeScreen, setHomeScreen] = useState<
"home" | "shop" | "inventory" | "settings"
>("home");'''

new_state = '''const [homeScreen, setHomeScreen] = useState<
  "home" | "companion" | "patterns" | "shop" | "inventory" | "settings"
>("home");'''

if text.count(old_state) != 1:
    print("ERRO: definição esperada de homeScreen não encontrada exatamente uma vez.")
    sys.exit(1)

text = text.replace(old_state, new_state, 1)

# ------------------------------------------------------------
# 2. Retirar a página completa de Padrões de dentro da Home
# ------------------------------------------------------------

old_patterns = '''{/* Conhece os teus Padrões */}

{patternsPage === "menu" && (
  <PatternsNew
    onBack={() => setCurrentTab(0)}
    onOpenAssessment={() => setPatternsPage("assessment")}
    onOpenDaily={() => setPatternsPage("daily")}
    onOpenEvolution={() => setPatternsPage("evolution")}
  />
)}

{patternsPage === "assessment" && (
  <HabitAssessment
    onBack={() => setPatternsPage("menu")}
  />
)}

{patternsPage === "daily" && (
  <HabitDailyCheck
    onBack={() => setPatternsPage("menu")}
  />
)}

{patternsPage === "evolution" && (
  <HabitEvolution
    onBack={() => setPatternsPage("menu")}
  />
)}'''

if text.count(old_patterns) != 1:
    print("ERRO: bloco atual de Padrões não encontrado exatamente uma vez.")
    print("Nenhuma alteração escrita.")
    sys.exit(1)

text = text.replace(old_patterns, "", 1)

# ------------------------------------------------------------
# 3. Criar ecrã próprio de Padrões
# Inserimos antes do ecrã Companion.
# ------------------------------------------------------------

anchor = '''{currentTab === 0 && homeScreen === "companion" && ('''

patterns_screen = '''{/* Padrões — ecrã próprio dentro do Principal */}
{currentTab === 0 && homeScreen === "patterns" && (
  <>
    {patternsPage === "menu" && (
      <PatternsNew
        onBack={() => {
          setPatternsPage("menu");
          setHomeScreen("home");
        }}
        onOpenAssessment={() => setPatternsPage("assessment")}
        onOpenDaily={() => setPatternsPage("daily")}
        onOpenEvolution={() => setPatternsPage("evolution")}
      />
    )}

    {patternsPage === "assessment" && (
      <HabitAssessment
        onBack={() => setPatternsPage("menu")}
      />
    )}

    {patternsPage === "daily" && (
      <HabitDailyCheck
        onBack={() => setPatternsPage("menu")}
      />
    )}

    {patternsPage === "evolution" && (
      <HabitEvolution
        onBack={() => setPatternsPage("menu")}
      />
    )}
  </>
)}

'''

if text.count(anchor) != 1:
    print("ERRO: ponto de inserção antes do Companion não encontrado.")
    sys.exit(1)

text = text.replace(anchor, patterns_screen + anchor, 1)

# ------------------------------------------------------------
# 4. Acrescentar Padrões à navegação secundária da Home
#
# Usamos a chave já existente:
# patternsPremium.habits
#
# Não adicionamos texto novo aos locales.
# ------------------------------------------------------------

shop_anchor = '''      <button
        type="button"
        onClick={() => setHomeScreen("shop")}'''

patterns_button = '''      <button
        type="button"
        onClick={() => {
          setPatternsPage("menu");
          setHomeScreen("patterns");
        }}
        className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-1 text-slate-500 transition-colors duration-200 active:bg-[#FFF8F4]"
      >
        <ChartNoAxesCombined
          size={15}
          strokeWidth={1.8}
          className="text-[#C97B5E]"
        />

        <span className="text-[9px] font-bold">
          {t("patternsPremium.habits")}
        </span>
      </button>

'''

if text.count(shop_anchor) != 1:
    print("ERRO: botão Loja não encontrado como ponto de inserção.")
    sys.exit(1)

text = text.replace(shop_anchor, patterns_button + shop_anchor, 1)

# A navegação passa de 3 para 4 utilitários.
old_grid = '''<div className="mt-2 grid grid-cols-3 border-t border-[#E8DDD7]/60 pt-2">'''
new_grid = '''<div className="mt-2 grid grid-cols-4 border-t border-[#E8DDD7]/60 pt-2">'''

if text.count(old_grid) != 1:
    print("ERRO: grelha de utilitários da Home não encontrada.")
    sys.exit(1)

text = text.replace(old_grid, new_grid, 1)

# ------------------------------------------------------------
# 5. Verificações
# ------------------------------------------------------------

required = [
    '"home" | "companion" | "patterns" | "shop" | "inventory" | "settings"',
    'homeScreen === "patterns"',
    'setHomeScreen("patterns")',
    'setPatternsPage("menu")',
    'onOpenAssessment={() => setPatternsPage("assessment")}',
    'onOpenDaily={() => setPatternsPage("daily")}',
    'onOpenEvolution={() => setPatternsPage("evolution")}',
    'homeScreen === "companion"',
    'grid-cols-4',
    't("patternsPremium.habits")',
]

for fragment in required:
    if fragment not in text:
        print(f"ERRO: verificação falhou: {fragment}")
        sys.exit(1)

if text == original:
    print("ERRO: nenhuma alteração efetuada.")
    sys.exit(1)

# Backup fora do projeto
backup = Path("/tmp/App.tsx.before_principal_patterns")
shutil.copy2(path, backup)

path.write_text(text, encoding="utf-8")

print("=" * 72)
print("CONFIA — PRINCIPAL PREMIUM 1B.5A.1")
print("=" * 72)
print("✓ Padrões removido do fluxo vertical da Home")
print("✓ Padrões ganhou ecrã próprio")
print("✓ Avaliação preservada")
print("✓ Registo de hábitos preservado")
print("✓ Evolução preservada")
print("✓ Voltar do menu de Padrões regressa à Home")
print("✓ Voltar dos subecrãs regressa ao menu de Padrões")
print("✓ Companion incluído corretamente no tipo homeScreen")
print("✓ Padrões incluído no tipo homeScreen")
print("✓ Acesso a Hábitos/Padrões adicionado à navegação da Home")
print("✓ Navegação utilitária 3 → 4 colunas")
print("✓ Traduções existentes reutilizadas")
print("✓ PT / EN / ES / FR preservados")
print("✓ Zero localStorage novo")
print("✓ Zero dependências novas")
print()
print("OK — Padrões separado da Home.")
