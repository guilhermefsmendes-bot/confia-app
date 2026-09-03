from pathlib import Path
import shutil
import sys

# ============================================================
# CONFIA — OBJETIVOS PREMIUM 2G
# Recompensa + microcelebração
#
# FLUXO:
# concluir
#   ↓
# XP real continua no App.tsx
#   ↓
# feedback visual imediato no ObjectivosList
#   ↓
# +XP flutua suavemente
#   ↓
# desaparece
#
# ALTERA:
# - src/components/ObjectivosList.tsx
#
# NÃO ALTERA:
# - App.tsx
# - XP real
# - Reactive Engine
# - storage
# - traduções
# - dependências
# ============================================================

ROOT = Path.cwd()

FILE = ROOT / "src/components/ObjectivosList.tsx"

BACKUP = Path(
    "/tmp/ObjectivosList.tsx.before_objectives_2g"
)


def fail(message: str):
    print()
    print("=" * 72)
    print("ERRO — 2G NÃO APLICADA")
    print("=" * 72)
    print()
    print(message)
    print()
    print("Nenhum ficheiro foi alterado.")
    print("=" * 72)
    sys.exit(1)


# ============================================================
# 1. VALIDAR
# ============================================================

if not FILE.exists():
    fail(
        f"Ficheiro não encontrado: {FILE}"
    )


original = FILE.read_text(
    encoding="utf-8"
)


# ============================================================
# 2. CONFIRMAR ARQUITETURA ATUAL
# ============================================================

required = [
    "import React, { useState } from 'react';",
    "import { motion, AnimatePresence } from 'motion/react';",
    "onToggleComplete: (id: string) => void;",
    "const [showForm, setShowForm] = useState(false);",
    "const featuredObjective =",
    "const remainingObjectives = featuredObjective",
    "onToggleComplete(featuredObjective.id)",
    "onToggleComplete(objective.id)",
    "+{featuredObjective.xpReward} XP",
    "+{objective.xpReward} XP",
]

for marker in required:
    if marker not in original:
        fail(
            "ObjectivosList.tsx não corresponde "
            "à estrutura auditada.\n\n"
            f"Falta:\n{marker}"
        )


# ============================================================
# 3. EVITAR DUPLICAÇÃO
# ============================================================

for marker in [
    "objectiveCelebration",
    "handleObjectiveToggle",
]:
    if marker in original:
        fail(
            "A 2G parece já estar aplicada.\n\n"
            f"Encontrado: {marker}"
        )


new = original


# ============================================================
# 4. ESTADO TRANSITÓRIO
# ============================================================

state_anchor = """  const [showForm, setShowForm] = useState(false);"""

state_replacement = """  const [showForm, setShowForm] = useState(false);

  /**
   * 2G — microcelebração transitória.
   *
   * Não representa estado persistente da aplicação.
   * Existe apenas para tornar a recompensa já atribuída
   * pelo App.tsx perceptível visualmente.
   */
  const [objectiveCelebration, setObjectiveCelebration] =
    useState<{
      id: string;
      xp: number;
    } | null>(null);"""

if new.count(state_anchor) != 1:
    fail(
        "Não encontrei exatamente showForm."
    )

new = new.replace(
    state_anchor,
    state_replacement,
    1,
)


# ============================================================
# 5. HANDLER VISUAL
# ============================================================

#
# Importante:
# verificamos objective.completed ANTES do toggle.
#
# Se está pendente:
#   conclusão -> celebração
#
# Se já está concluído:
#   reversão -> sem celebração
#
# O XP real continua exclusivamente no App.tsx.
#

handler_anchor = """  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    onAddCustomObjective(newText.trim(), newCategory);
    setNewText('');
    setShowForm(false);
  };"""

handler_replacement = """  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    onAddCustomObjective(newText.trim(), newCategory);
    setNewText('');
    setShowForm(false);
  };

  const handleObjectiveToggle = (
    objective: Objective
  ) => {
    const isCompleting = !objective.completed;

    if (isCompleting) {
      setObjectiveCelebration({
        id: objective.id,
        xp: objective.xpReward,
      });

      window.setTimeout(() => {
        setObjectiveCelebration(current =>
          current?.id === objective.id
            ? null
            : current
        );
      }, 1600);
    } else if (
      objectiveCelebration?.id === objective.id
    ) {
      setObjectiveCelebration(null);
    }

    onToggleComplete(objective.id);
  };"""

if new.count(handler_anchor) != 1:
    fail(
        "Não encontrei exatamente handleSubmit."
    )

new = new.replace(
    handler_anchor,
    handler_replacement,
    1,
)


# ============================================================
# 6. FEATURED OBJECTIVE USA HANDLER VISUAL
# ============================================================

featured_old = """                onClick={() =>
                  onToggleComplete(featuredObjective.id)
                }"""

featured_new = """                onClick={() =>
                  handleObjectiveToggle(featuredObjective)
                }"""

if new.count(featured_old) != 1:
    fail(
        "Não encontrei exatamente o toggle "
        "do objetivo em destaque."
    )

new = new.replace(
    featured_old,
    featured_new,
    1,
)


# ============================================================
# 7. SMALL WINS USA HANDLER VISUAL
# ============================================================

small_old = """                        onClick={() =>
                          onToggleComplete(objective.id)
                        }"""

small_new = """                        onClick={() =>
                          handleObjectiveToggle(objective)
                        }"""

if new.count(small_old) != 1:
    fail(
        "Não encontrei exatamente o toggle "
        "das pequenas vitórias."
    )

new = new.replace(
    small_old,
    small_new,
    1,
)


# ============================================================
# 8. MICROCELEBRAÇÃO GLOBAL NO TOPO
# ============================================================

#
# Colocamos imediatamente dentro do container principal.
#
# Vantagens:
# - funciona para featured e small wins;
# - não desaparece quando featuredObjective muda;
# - não duplica UI por objetivo;
# - AnimatePresence gere entrada/saída;
# - pointer-events-none;
# - curta e discreta.
#

container_anchor = """    <div className="max-w-md mx-auto space-y-5 py-4">
      {/* 2B — Identidade premium + progresso diário */}"""

celebration_block = """    <div className="relative max-w-md mx-auto space-y-5 py-4">
      <AnimatePresence>
        {objectiveCelebration && (
          <motion.div
            key={objectiveCelebration.id}
            initial={{
              opacity: 0,
              y: 8,
              scale: 0.94
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1
            }}
            exit={{
              opacity: 0,
              y: -10,
              scale: 0.97
            }}
            transition={{
              duration: 0.28,
              ease: "easeOut"
            }}
            className="pointer-events-none fixed left-1/2 top-20 z-50 -translate-x-1/2"
            aria-live="polite"
          >
            <div className="flex items-center gap-2 rounded-full border border-[#E5A88B]/30 bg-white/95 px-4 py-2.5 text-[#C97B5E] shadow-[0_12px_30px_rgba(92,64,52,0.14)] backdrop-blur-sm">
              <motion.span
                initial={{
                  rotate: -12,
                  scale: 0.75
                }}
                animate={{
                  rotate: 0,
                  scale: 1
                }}
                transition={{
                  duration: 0.32,
                  ease: "easeOut"
                }}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFF0E8]"
              >
                <Sparkles
                  size={14}
                  strokeWidth={2.3}
                />
              </motion.span>

              <motion.span
                initial={{
                  opacity: 0,
                  x: -4
                }}
                animate={{
                  opacity: 1,
                  x: 0
                }}
                transition={{
                  duration: 0.25,
                  delay: 0.05
                }}
                className="text-xs font-black tracking-wide"
              >
                +{objectiveCelebration.xp} XP
              </motion.span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2B — Identidade premium + progresso diário */}"""

if new.count(container_anchor) != 1:
    fail(
        "Não encontrei exatamente o container "
        "principal do ObjectivosList."
    )

new = new.replace(
    container_anchor,
    celebration_block,
    1,
)


# ============================================================
# 9. MICROANIMAÇÃO DO XP ACUMULADO
# ============================================================

xp_old = """                <span className="text-[10px] font-black">
                  +{earnedXp} XP
                </span>"""

xp_new = """                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={earnedXp}
                    initial={{
                      opacity: 0,
                      y: 4,
                      scale: 0.94
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1
                    }}
                    exit={{
                      opacity: 0,
                      y: -3
                    }}
                    transition={{
                      duration: 0.22,
                      ease: "easeOut"
                    }}
                    className="text-[10px] font-black"
                  >
                    +{earnedXp} XP
                  </motion.span>
                </AnimatePresence>"""

if new.count(xp_old) != 1:
    fail(
        "Não encontrei exatamente o XP acumulado "
        "do cabeçalho."
    )

new = new.replace(
    xp_old,
    xp_new,
    1,
)


# ============================================================
# 10. VALIDAÇÕES EM MEMÓRIA
# ============================================================

for marker in [
    "const [objectiveCelebration, setObjectiveCelebration]",
    "const handleObjectiveToggle =",
    "const isCompleting = !objective.completed;",
    "xp: objective.xpReward",
    "window.setTimeout(() => {",
    "}, 1600);",
    "handleObjectiveToggle(featuredObjective)",
    "handleObjectiveToggle(objective)",
    "objectiveCelebration.xp",
    'key={earnedXp}',
    'aria-live="polite"',
]:
    if marker not in new:
        fail(
            "Validação em memória falhou:\n"
            f"{marker}"
        )


# ============================================================
# 11. GARANTIR QUE O CALLBACK REAL CONTINUA ÚNICO
# ============================================================

#
# Depois da alteração, o componente só deve chamar
# onToggleComplete diretamente dentro do novo handler.
#

if new.count(
    "onToggleComplete(objective.id);"
) != 1:
    fail(
        "onToggleComplete(objective.id) não ficou "
        "centralizado exatamente uma vez."
    )


# ============================================================
# 12. GARANTIR QUE NÃO ATRIBUÍMOS XP REAL
# ============================================================

for forbidden in [
    "addXp(",
    "setAvatar(",
    "localStorage.setItem(",
    "recordReactiveResponse(",
    "analyzeReactiveState(",
]:
    if forbidden in new:
        fail(
            "ObjectivosList passou a conter lógica "
            "que não lhe pertence:\n"
            f"{forbidden}"
        )


# ============================================================
# 13. GARANTIR DEPENDÊNCIAS EXISTENTES
# ============================================================

if (
    "from 'motion/react'"
    not in new
):
    fail(
        "motion/react deixou de estar disponível."
    )


# ============================================================
# 14. CONTAGEM DE ESTADO
# ============================================================

expected_use_state_delta = 1

if (
    new.count("useState")
    != original.count("useState")
       + expected_use_state_delta
):
    fail(
        "A alteração de useState não foi "
        "exatamente +1."
    )


# ============================================================
# 15. GARANTIR UM ÚNICO TIMER NOVO
# ============================================================

if (
    new.count("setTimeout")
    != original.count("setTimeout") + 1
):
    fail(
        "A alteração de setTimeout não foi "
        "exatamente +1."
    )


# ============================================================
# 16. PRESERVAR FEATURED / SMALL WINS
# ============================================================

for marker in [
    "const featuredObjective =",
    "const remainingObjectives = featuredObjective",
    "featuredObjective && featuredCategory",
    "remainingObjectives.map(objective =>",
    "objective.completed",
    "objective.isCustom",
    "onDeleteObjective(objective.id)",
]:
    if marker not in new:
        fail(
            "Estrutura existente dos Objetivos "
            "foi perdida:\n"
            f"{marker}"
        )


# ============================================================
# 17. BACKUP
# ============================================================

shutil.copy2(
    FILE,
    BACKUP
)


# ============================================================
# 18. ESCREVER
# ============================================================

FILE.write_text(
    new,
    encoding="utf-8"
)


# ============================================================
# 19. VALIDAÇÃO FINAL
# ============================================================

written = FILE.read_text(
    encoding="utf-8"
)

for marker in [
    "objectiveCelebration",
    "handleObjectiveToggle",
    "objectiveCelebration.xp",
    "handleObjectiveToggle(featuredObjective)",
    "handleObjectiveToggle(objective)",
]:
    if marker not in written:
        print()
        print("ATENÇÃO:")
        print("Validação final falhou:")
        print(marker)
        print()
        print("Backup:")
        print(BACKUP)
        sys.exit(1)


# ============================================================
# 20. RESULTADO
# ============================================================

print()
print("=" * 72)
print("CONFIA — OBJETIVOS PREMIUM 2G")
print("=" * 72)
print()
print("✓ Microcelebração adicionada")
print("✓ +XP torna-se perceptível após conclusão")
print("✓ XP acumulado anima quando muda")
print("✓ Featured Objective participa na celebração")
print("✓ Pequenas vitórias participam na celebração")
print("✓ Desmarcar não celebra")
print("✓ XP real continua exclusivamente no App.tsx")
print("✓ Reação da CONFIA continua no App.tsx")
print("✓ Reactive Engine não foi duplicado")
print("✓ AnimatePresence existente reutilizado")
print("✓ motion/react existente reutilizado")
print("✓ Apenas 1 estado transitório novo")
print("✓ Apenas 1 timer curto novo")
print("✓ Sem novo localStorage")
print("✓ Sem novas dependências")
print("✓ Sem novas traduções")
print()
print("Backup:")
print(f"  {BACKUP}")
print()
print("PRÓXIMO PASSO:")
print("  npm run build")
print("=" * 72)
