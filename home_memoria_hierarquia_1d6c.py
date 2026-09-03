from pathlib import Path
import re
import shutil
import sys


APP = Path("src/App.tsx")


def fail(message):
    print(f"ERRO: {message}")
    sys.exit(1)


if not APP.exists():
    fail("src/App.tsx não encontrado.")


text = APP.read_text(encoding="utf-8")


# ============================================================
# BACKUP
# ============================================================

backup = Path("/tmp/App.tsx.before_1d6c")
shutil.copy2(APP, backup)


# ============================================================
# 1. LOCALIZAR O BLOCO homeNowMemory
# ============================================================

start_marker = 'const homeNowMemory = (() => {'
end_marker = 'const homeNowAction = (() => {'


start = text.find(start_marker)

if start == -1:
    fail("bloco homeNowMemory não encontrado.")

end = text.find(end_marker, start)

if end == -1:
    fail("fim do bloco homeNowMemory não encontrado.")


old_block = text[start:end]


# ============================================================
# 2. NOVA HIERARQUIA DA MEMÓRIA
#
# Aprendizagem pessoal tem prioridade quando existe
# evidência suficiente.
#
# A memória da última experiência eficaz continua disponível
# como contexto complementar.
# ============================================================

new_block = '''const homeNowMemory = (() => {
  if (currentTab !== 0 || homeScreen !== "home") {
    return null;
  }

  try {
    const memory = collectReactiveRecentMemory();

    const effectiveImpulse =
      memory?.recentEffectiveImpulse ?? null;

    /*
     * 1D.6C — HIERARQUIA DA MEMÓRIA
     *
     * Primeiro verificamos se existe aprendizagem pessoal
     * suficiente para apresentar um padrão observado.
     *
     * A aprendizagem exige pelo menos dois episódios eficazes.
     * Isto evita transformar uma única experiência numa conclusão.
     *
     * A necessidade observada é apenas memória contextual.
     * Nunca escolhe automaticamente o percurso.
     */
    if (memory?.hasImpulseLearning) {
      return {
        kind: "impulseLearning" as const,

        effectiveCount:
          memory.effectiveImpulseCount,

        recentCount:
          memory.recentImpulseCount,

        averageReduction:
          memory.recentImpulseAverageReduction ?? null,

        need:
          memory.effectiveImpulseNeed ?? null,

        needCount:
          memory.effectiveImpulseNeedCount,

        /*
         * Mantemos a última experiência eficaz disponível
         * para eventual utilização visual futura.
         */
        recentEffective:
          effectiveImpulse &&
          typeof effectiveImpulse.initialIntensity === "number" &&
          typeof effectiveImpulse.finalIntensity === "number"
            ? {
                before: effectiveImpulse.initialIntensity,
                after: effectiveImpulse.finalIntensity,
                reduction: effectiveImpulse.reduction,
                need: effectiveImpulse.need ?? null,
              }
            : null,
      };
    }

    /*
     * 2. Ainda não existe evidência suficiente para falar
     * de aprendizagem.
     *
     * Nesse caso mantemos a memória da última experiência
     * eficaz exatamente como anteriormente.
     */
    if (
      effectiveImpulse &&
      typeof effectiveImpulse.initialIntensity === "number" &&
      typeof effectiveImpulse.finalIntensity === "number"
    ) {
      return {
        kind: "impulseMemory" as const,

        need:
          effectiveImpulse.need ?? null,

        before:
          effectiveImpulse.initialIntensity,

        after:
          effectiveImpulse.finalIntensity,

        reduction:
          effectiveImpulse.reduction,
      };
    }

    return null;
  } catch {
    /*
     * A memória é apenas uma camada complementar.
     *
     * Se não estiver disponível, o Principal continua
     * a funcionar normalmente através do Reactive Engine.
     */
    return null;
  }
})();


'''


# ============================================================
# 3. SUBSTITUIR
# ============================================================

text = text[:start] + new_block + text[end:]


# ============================================================
# 4. GARANTIAS DE SEGURANÇA
# ============================================================

if text.count('const homeNowMemory = (() => {') != 1:
    shutil.copy2(backup, APP)
    fail("resultado inseguro: definição duplicada de homeNowMemory.")


if 'kind: "impulseLearning" as const' not in text:
    shutil.copy2(backup, APP)
    fail("aprendizagem do Impulso não ficou presente.")


if 'kind: "impulseMemory" as const' not in text:
    shutil.copy2(backup, APP)
    fail("memória do Impulso deixou de estar presente.")


APP.write_text(text, encoding="utf-8")


# ============================================================
# RESULTADO
# ============================================================

print("=" * 72)
print("CONFIA — MEMÓRIA / HIERARQUIA — 1D.6C")
print("=" * 72)
print("✓ Aprendizagem pessoal passa a ter prioridade")
print("✓ Critério hasImpulseLearning preservado")
print("✓ Última experiência eficaz preservada")
print("✓ Antes / Agora continuam disponíveis")
print("✓ Necessidade continua apenas como contexto")
print("✓ Nenhuma seleção automática de percurso")
print("✓ Reactive Engine não alterado")
print("✓ Nenhum storage novo")
print("✓ Nenhum listener novo")
print("✓ Nenhuma dependência nova")
print("✓ Backup criado em /tmp/App.tsx.before_1d6c")
print("=" * 72)
print("OK — 1D.6C APLICADA")
print("=" * 72)
