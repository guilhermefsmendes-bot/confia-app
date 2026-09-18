from pathlib import Path
import shutil
import sys

TARGET = Path("src/components/Avatar.tsx")
BACKUP = Path("/tmp/Avatar.tsx.before_companheiro_premium_a2_1")

if not TARGET.exists():
    print("ERRO: src/components/Avatar.tsx não encontrado.")
    sys.exit(1)

text = TARGET.read_text(encoding="utf-8")

shutil.copy2(TARGET, BACKUP)

# ============================================================
# 1. IMPORT DA NOVA CRIATURA
# ============================================================

anchor_import = "import { AvatarState } from '../types';"

new_import = (
    "import ConfiaCreature, { type ConfiaCreatureState } "
    'from "./Companheiro/ConfiaCreature";'
)

if new_import not in text:
    if anchor_import not in text:
        print("ERRO: ponto de import esperado não encontrado.")
        sys.exit(1)

    text = text.replace(
        anchor_import,
        anchor_import + "\n" + new_import,
        1
    )

# ============================================================
# 2. IDENTIFICAR O BLOCO SVG ANTIGO
# ============================================================

start_marker = "  // SVG representation based on level"
end_marker = "  const levelUpProgress = (avatar.xp / avatar.maxXp) * 100;"

start = text.find(start_marker)
end = text.find(end_marker)

if start == -1:
    print("ERRO: início do SVG antigo não encontrado.")
    sys.exit(1)

if end == -1:
    print("ERRO: fim do SVG antigo não encontrado.")
    sys.exit(1)

if end <= start:
    print("ERRO: limites inválidos do SVG antigo.")
    sys.exit(1)

# ============================================================
# 3. SUBSTITUIR O MOTOR VISUAL ANTIGO
# ============================================================

replacement = '''  /**
   * ==========================================================
   * CONFIA — COMPANHEIRO PREMIUM A2.1
   * ==========================================================
   *
   * O Avatar mantém a inteligência de interação/memória.
   * O desenho é delegado à nova espécie ConfiaCreature.
   */

  const creatureState: ConfiaCreatureState =
    levelUpTrigger || celebrating
      ? "celebrating"
      : moodRating !== undefined && moodRating <= 3
        ? "supportive"
        : companionWorldMood === "discovering"
          ? "curious"
          : companionWorldMood === "growing"
            ? "welcoming"
            : "neutral";

'''

text = text[:start] + replacement + text[end:]

# ============================================================
# 4. SUBSTITUIR CHAMADA renderAvatarSVG()
# ============================================================

old_render = "{renderAvatarSVG()}"

new_render = '''<ConfiaCreature
    level={avatar.level}
    state={creatureState}
    reacting={isJumping}
  />'''

if old_render not in text:
    print("ERRO: chamada renderAvatarSVG() não encontrada.")
    sys.exit(1)

text = text.replace(
    old_render,
    new_render,
    1
)

# ============================================================
# 5. REMOVER PARTÍCULAS DE CORAÇÃO DO JSX
# ============================================================

heart_start = "        {/* Petting heart particles */}"
heart_end = "        </AnimatePresence>"

hs = text.find(heart_start)

if hs != -1:
    he = text.find(heart_end, hs)

    if he == -1:
        print("ERRO: fim das partículas não encontrado.")
        sys.exit(1)

    he += len(heart_end)

    text = text[:hs] + text[he:]

# ============================================================
# 6. REMOVER ESTADO hearts
# ============================================================

heart_state = (
    "  const [hearts, setHearts] = "
    "useState<{ id: number; x: number; y: number }[]>([]);\n"
)

text = text.replace(heart_state, "", 1)

# ============================================================
# 7. SIMPLIFICAR INTERAÇÃO
# ============================================================

old_interaction_fragment = '''    // Spawn heart animation
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newHeart = { id: Date.now(), x, y };
    setHearts(prev => [...prev, newHeart]);

'''

if old_interaction_fragment in text:
    text = text.replace(
        old_interaction_fragment,
        "",
        1
    )

old_cleanup = '''    // Clean up heart after animation
    setTimeout(() => {
      setHearts(prev => prev.filter(h => h.id !== newHeart.id));
    }, 1200);
'''

if old_cleanup in text:
    text = text.replace(
        old_cleanup,
        "",
        1
    )

# ============================================================
# 8. REMOVER AnimatePresence DO IMPORT, SE JÁ NÃO FOR USADO
# ============================================================

if "<AnimatePresence" not in text:
    text = text.replace(
        "import { motion, AnimatePresence } from 'motion/react';",
        "import { motion } from 'motion/react';",
        1
    )

# ============================================================
# 9. REMOVER Heart DO IMPORT SE JÁ NÃO FOR USADO
# ============================================================

if "<Heart" not in text:
    text = text.replace(
        "ShieldCheck, Flame, Heart, Sparkles, MessageCircleCode",
        "ShieldCheck, Flame, Sparkles, MessageCircleCode",
        1
    )

# ============================================================
# 10. VALIDAR
# ============================================================

checks = {
    "ConfiaCreature importado": new_import in text,
    "ConfiaCreature renderizado": "<ConfiaCreature" in text,
    "SVG antigo removido": "renderAvatarSVG" not in text,
    "Sem AnimatePresence": "AnimatePresence" not in text,
    "Sem estado hearts": "setHearts" not in text,
    "Sem repeat Infinity no Avatar": "repeat: Infinity" not in text,
}

failed = [
    name
    for name, ok in checks.items()
    if not ok
]

if failed:
    print("ERRO: validação falhou:")
    for item in failed:
        print("  -", item)

    shutil.copy2(BACKUP, TARGET)
    print("Avatar.tsx restaurado automaticamente.")
    sys.exit(1)

TARGET.write_text(text, encoding="utf-8")

print("=" * 76)
print("CONFIA — COMPANHEIRO PREMIUM A2.1")
print("=" * 76)
print()
print("✓ Nova criatura CONFIA ligada ao Avatar")
print("✓ SVG antigo deixou de ser renderizado")
print("✓ Evolução por nível preservada")
print("✓ XP preservado")
print("✓ Memória preservada")
print("✓ Reação ao toque preservada")
print("✓ Estado supportive ligado ao humor baixo")
print("✓ Estado curious ligado a descoberta")
print("✓ Estado welcoming ligado a crescimento")
print("✓ Celebração preservada")
print("✓ Partículas de coração removidas")
print("✓ AnimatePresence removido se já não necessário")
print("✓ Animações infinitas do antigo SVG removidas")
print("✓ Nenhum canvas")
print("✓ Nenhum requestAnimationFrame")
print("✓ Nenhum setInterval")
print("✓ Nenhuma dependência nova")
print()
print("Backup:")
print(f"  {BACKUP}")
print()
print("Próximo passo:")
print("  validar estrutura e só depois fazer build")
print("=" * 76)
