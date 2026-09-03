from pathlib import Path
import shutil
import sys

APP = Path("src/App.tsx")
BACKUP = Path("/tmp/App.tsx.before_home_reativa")

if not APP.exists():
    print("ERRO: não foi encontrado src/App.tsx")
    sys.exit(1)

source = APP.read_text(encoding="utf-8")

# ------------------------------------------------------------
# 1. Backup
# ------------------------------------------------------------
shutil.copy2(APP, BACKUP)

# ------------------------------------------------------------
# 2. Estrutura esperada
# ------------------------------------------------------------
anchor = '''const [reactiveMessageKey, setReactiveMessageKey] =
    useState<string | null>(null);'''

if anchor not in source:
    print("ERRO: não foi encontrada a definição esperada de reactiveMessageKey.")
    print("NENHUMA ALTERAÇÃO FOI FEITA.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

# Evitar duplicação caso o script seja executado novamente
if "Analisa o contexto existente quando a Home é aberta" in source:
    print("AVISO: a reatividade automática da Home já existe.")
    print("NENHUMA ALTERAÇÃO FOI FEITA.")
    sys.exit(0)

# ------------------------------------------------------------
# 3. Novo efeito
# ------------------------------------------------------------
effect = '''

  // Analisa o contexto existente quando a Home é aberta.
  //
  // Importante:
  // - apenas lê o contexto existente;
  // - não regista uma nova resposta no histórico;
  // - não altera o reactiveEngine;
  // - respostas provocadas explicitamente pelo utilizador
  //   continuam a ser registadas em handleSaveRatings.
  useEffect(() => {
    if (currentTab !== 0 || homeScreen !== "home") return;

    if (ratings.length === 0) {
      setReactiveMessageKey(null);
      return;
    }

    const reactiveResult = analyzeReactiveState({
      source: "mood",
    });

    if (reactiveResult?.response?.translationKey) {
      setReactiveMessageKey(
        reactiveResult.response.translationKey
      );
    }
  }, [currentTab, homeScreen, ratings]);
'''

# ------------------------------------------------------------
# 4. Aplicar alteração
# ------------------------------------------------------------
updated = source.replace(anchor, anchor + effect, 1)

if updated == source:
    print("ERRO: a alteração não produziu mudanças.")
    print("NENHUMA ALTERAÇÃO FOI FEITA.")
    sys.exit(1)

APP.write_text(updated, encoding="utf-8")

# ------------------------------------------------------------
# 5. Verificação
# ------------------------------------------------------------
check = APP.read_text(encoding="utf-8")

required = [
    "Analisa o contexto existente quando a Home é aberta",
    'if (currentTab !== 0 || homeScreen !== "home") return;',
    'const reactiveResult = analyzeReactiveState({',
    'setReactiveMessageKey(',
]

missing = [item for item in required if item not in check]

if missing:
    print("ERRO: validação pós-escrita falhou.")
    print("A restaurar backup...")
    shutil.copy2(BACKUP, APP)
    print("Backup restaurado.")
    sys.exit(1)

print("=" * 80)
print("CONFIA — HOME REATIVA / FASE 1")
print("=" * 80)
print()
print("OK: backup criado em /tmp/App.tsx.before_home_reativa")
print("OK: análise automática ao abrir a Home adicionada.")
print("OK: apenas Home é afetada.")
print("OK: ratings vazio limpa reactiveMessageKey.")
print("OK: analyzeReactiveState continua a ser utilizado.")
print("OK: recordReactiveResponse NÃO é chamado pela abertura da Home.")
print("OK: handleSaveRatings permanece intacto.")
print("OK: reactiveEngine não foi alterado.")
print("OK: respostas e traduções não foram alteradas.")
print("OK: localStorage não foi alterado diretamente.")
print()
print("PRÓXIMO PASSO: auditoria do diff.")
print("NÃO EXECUTAR BUILD AINDA.")
print("=" * 80)
