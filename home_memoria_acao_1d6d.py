from pathlib import Path
import shutil
import sys


APP = Path("src/App.tsx")


def fail(message):
    print(f"ERRO: {message}")
    sys.exit(1)


print("=" * 72)
print("CONFIA — MEMÓRIA / AÇÃO — 1D.6D")
print("=" * 72)


# ============================================================
# VALIDAR
# ============================================================

if not APP.exists():
    fail("src/App.tsx não encontrado.")


text = APP.read_text(encoding="utf-8")


# ============================================================
# BACKUP
# ============================================================

backup = Path("/tmp/App.tsx.before_1d6d")
shutil.copy2(APP, backup)


# ============================================================
# BLOCO ATUAL
# ============================================================

old = '''  /*
   * 1D.5 — memória eficaz recente.
   *
   * Tem prioridade porque representa uma experiência real
   * já vivida pelo utilizador.
   */
  if (homeNowMemory) {
    return {
      kind: "impulse" as const,
      memory: homeNowMemory,
      titleKey: "homeNow.impulseMemory.title",
      textKey: "homeNow.impulseMemory.text",
      actionKey: "homeNow.impulseMemory.action",
    };
  }

  /*
   * 1D.4 — decisão normal do Reactive Engine.
   */
  const result = analyzeReactiveState({
    source: "general",
  });
'''


# ============================================================
# NOVO BLOCO
# ============================================================

new = '''  /*
   * 1D.6D — separação entre MEMÓRIA e AÇÃO.
   *
   * A memória contextual não deve decidir sozinha
   * qual é a próxima ação do utilizador.
   *
   * Ela informa o Principal sobre experiências anteriores.
   * O Reactive Engine continua a ser responsável
   * pela decisão da ação atual.
   */

  /*
   * 1D.4 — decisão normal do Reactive Engine.
   */
  const result = analyzeReactiveState({
    source: "general",
  });
'''


if old not in text:
    fail(
        "bloco 1D.5 esperado não encontrado. "
        "Nenhuma alteração foi feita."
    )


text = text.replace(old, new, 1)


# ============================================================
# GARANTIAS
# ============================================================

if 'homeNowMemory) {' in text:
    # Não é necessariamente erro em outros contextos,
    # por isso apenas verificamos o padrão específico
    # da antiga ação automática.
    forbidden = '''if (homeNowMemory) {
    return {
      kind: "impulse" as const,
      memory: homeNowMemory'''
    if forbidden in text:
        shutil.copy2(backup, APP)
        fail(
            "a ação automática baseada diretamente em "
            "homeNowMemory ainda existe."
        )


if 'const result = analyzeReactiveState({' not in text:
    shutil.copy2(backup, APP)
    fail("Reactive Engine deixou de ser utilizado.")


if text.count('const homeNowAction = (() => {') != 1:
    shutil.copy2(backup, APP)
    fail("definição de homeNowAction inconsistente.")


# ============================================================
# GRAVAR
# ============================================================

APP.write_text(text, encoding="utf-8")


# ============================================================
# RESULTADO
# ============================================================

print("✓ Memória deixou de forçar automaticamente o Impulso")
print("✓ Reactive Engine continua a decidir a ação")
print("✓ homeNowMemory continua preservada")
print("✓ Aprendizagem 1D.6A / 1D.6B / 1D.6C preservada")
print("✓ Nenhum storage novo")
print("✓ Nenhum listener novo")
print("✓ Nenhuma dependência nova")
print("✓ Backup criado em /tmp/App.tsx.before_1d6d")

print()
print("=" * 72)
print("OK — 1D.6D APLICADA")
print("=" * 72)
