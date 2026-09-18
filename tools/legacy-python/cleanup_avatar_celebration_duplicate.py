from pathlib import Path
import shutil
import sys

path = Path("src/components/Avatar.tsx")

if not path.exists():
    print("ERRO: Avatar.tsx não encontrado.")
    sys.exit(1)

text = path.read_text(encoding="utf-8")
original = text

shutil.copy2(
    path,
    "/tmp/Avatar.tsx.before_celebration_cleanup"
)

# ============================================================
# CONFIA — 1B.4D.3B
# REMOÇÃO SEGURA DO EFEITO DE CELEBRAÇÃO DUPLICADO
# ============================================================

block = '''{celebrating && (
  <motion.circle
    cx="100"
    cy="110"
    r="90"
    fill="none"
    stroke="#fef08a"
    strokeWidth="4"
    animate={{
      opacity: [0, 1, 0],
      scale: [0.8, 1.2, 0.8],
    }}
    transition={{
      duration: 1,
      repeat: Infinity,
    }}
  />
)}'''

count = text.count(block)

if count != 2:
    print(f"ERRO: esperavam-se 2 círculos de celebração idênticos, encontrados: {count}")
    print("Nenhuma alteração efetuada.")
    sys.exit(1)

# Remover apenas uma das duas cópias
first = text.find(block)
second = text.find(block, first + len(block))

if second == -1:
    print("ERRO: segunda ocorrência não encontrada.")
    sys.exit(1)

text = text[:second] + text[second + len(block):]

# ------------------------------------------------------------
# Verificações
# ------------------------------------------------------------

if text.count(block) != 1:
    print("ERRO: deveria restar exatamente 1 círculo de celebração.")
    sys.exit(1)

required = [
    "celebrating &&",
    "stroke=\"#fef08a\"",
    "scaleY: celebrating",
    "scaleX: celebrating",
    "y: celebrating",
    "onClick={handleInteraction}",
    "{renderAvatarSVG()}",
    "<AnimatePresence>",
]

for item in required:
    if item not in text:
        print(f"ERRO: comportamento importante desapareceu: {item}")
        sys.exit(1)

if text == original:
    print("ERRO: nenhuma alteração efetuada.")
    sys.exit(1)

path.write_text(text, encoding="utf-8")

print("=" * 72)
print("CONFIA — AVATAR 1B.4D.3B")
print("=" * 72)
print("✓ Duplicação identificada")
print("✓ Um círculo de celebração removido")
print("✓ Um círculo de celebração preservado")
print("✓ Efeito visual de celebração preservado")
print("✓ Respiração do Avatar preservada")
print("✓ Movimento de celebração preservado")
print("✓ Piscar dos olhos preservado")
print("✓ Interação ao toque preservada")
print("✓ Corações preservados")
print("✓ Zero texto alterado")
print("✓ PT / EN / ES / FR não afetados")
print("✓ Zero dependências novas")
print()
print("OK — celebração duplicada limpa.")
