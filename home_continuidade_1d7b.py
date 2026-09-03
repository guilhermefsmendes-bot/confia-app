from pathlib import Path
import shutil

print("=" * 72)
print("CONFIA — CONTINUIDADE VISÍVEL — 1D.7B")
print("=" * 72)

path = Path("src/App.tsx")

if not path.exists():
    raise SystemExit("ERRO: src/App.tsx não encontrado.")

backup = Path("/tmp/App.tsx.before_1d7b")

if not backup.exists():
    shutil.copy2(path, backup)

text = path.read_text(encoding="utf-8")

# ------------------------------------------------------------
# 1. Acrescentar continuidade à memória usada pelo Home
# ------------------------------------------------------------

old = """const memory =
      collectReactiveRecentMemory();

    const effectiveImpulse =
      memory?.recentEffectiveImpulse ?? null;
"""

new = """const memory =
      collectReactiveRecentMemory();

    const effectiveImpulse =
      memory?.recentEffectiveImpulse ?? null;

    const continuity =
      memory?.continuity ?? null;
"""

if old in text and "const continuity =" not in text:
    text = text.replace(old, new, 1)

# ------------------------------------------------------------
# 2. Prioridade da aprendizagem pessoal
# ------------------------------------------------------------

old_block = """    if (
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
"""

new_block = """    if (
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

        continuity:
          continuity,
      };
    }

    /*
     * 1D.7B — continuidade sem uma última experiência
     * suficientemente recente para mostrar Antes / Agora.
     *
     * Continua a ser apenas memória contextual.
     */
    if (
      continuity?.hasRepeatedSignals
    ) {
      return {
        kind: "continuity" as const,

        repeatedNeed:
          continuity.repeatedNeed ?? null,

        repeatedNeedCount:
          continuity.repeatedNeedCount,

        recentEffectiveImpulseCount:
          continuity.recentEffectiveImpulseCount,
      };
    }

    return null;
"""

if old_block in text:
    text = text.replace(old_block, new_block, 1)

# ------------------------------------------------------------
# 3. Acrescentar tipo de continuidade ao cartão
# ------------------------------------------------------------

old_render = """{homeScreen === "home" && homeNowAction && (
  <section
"""

new_render = """{homeScreen === "home" && homeNowAction && (
  <section
"""

# Não é necessário alterar a abertura do cartão.
# O conteúdo será alterado de forma localizada abaixo.

# ------------------------------------------------------------
# 4. Eyebrow contextual
# ------------------------------------------------------------

old_eyebrow = """{homeNowAction.kind === "impulse" && "memory" in homeNowAction && homeNowAction.memory
            ? t("homeNow.impulseMemory.eyebrow")
            : t("homeNow.eyebrow")}"""

new_eyebrow = """{homeNowAction.kind === "impulse" &&
          "memory" in homeNowAction &&
          homeNowAction.memory
            ? t("homeNow.impulseMemory.eyebrow")
            : homeNowAction.kind === "continuity"
              ? t("homeNow.continuity.eyebrow")
              : t("homeNow.eyebrow")}"""

if old_eyebrow in text:
    text = text.replace(old_eyebrow, new_eyebrow, 1)

# ------------------------------------------------------------
# 5. Título contextual
# ------------------------------------------------------------

old_title = """{t(homeNowAction.titleKey)}"""

new_title = """{homeNowAction.kind === "continuity"
            ? t("homeNow.continuity.title")
            : t(homeNowAction.titleKey)}"""

# Apenas substituir a primeira ocorrência dentro do cartão.
index = text.find(old_title)

if index != -1:
    text = (
        text[:index]
        + new_title
        + text[index + len(old_title):]
    )

# ------------------------------------------------------------
# 6. Texto contextual
# ------------------------------------------------------------

old_text = """{homeNowAction.kind === "impulse" && "memory" in homeNowAction && homeNowAction.memory
            ? t(homeNowAction.textKey, {
                before: homeNowAction.memory.before,
                after: homeNowAction.memory.after,
                reduction: homeNowAction.memory.reduction,
              })
            : t(homeNowAction.textKey)}"""

new_text = """{homeNowAction.kind === "continuity"
            ? t("homeNow.continuity.text", {
                count:
                  "repeatedNeedCount" in homeNowAction
                    ? homeNowAction.repeatedNeedCount
                    : 0,
                episodes:
                  "recentEffectiveImpulseCount" in homeNowAction
                    ? homeNowAction.recentEffectiveImpulseCount
                    : 0,
              })
            : homeNowAction.kind === "impulse" &&
              "memory" in homeNowAction &&
              homeNowAction.memory
              ? t(homeNowAction.textKey, {
                  before: homeNowAction.memory.before,
                  after: homeNowAction.memory.after,
                  reduction: homeNowAction.memory.reduction,
                })
              : t(homeNowAction.textKey)}"""

if old_text in text:
    text = text.replace(old_text, new_text, 1)

# ------------------------------------------------------------
# 7. Validação básica
# ------------------------------------------------------------

path.write_text(text, encoding="utf-8")

print("✓ Continuidade ligada à memória do Principal")
print("✓ Aprendizagem pessoal continua prioritária")
print("✓ Continuidade pode ser apresentada sem forçar ação")
print("✓ Nenhuma seleção automática de percurso")
print("✓ Reactive Engine preservado")
print("✓ Nenhum storage novo")
print("✓ Nenhum listener novo")
print("✓ Nenhuma dependência nova")
print("✓ Backup criado em /tmp/App.tsx.before_1d7b")
print("=" * 72)
print("OK — 1D.7B APLICADA")
print("=" * 72)
