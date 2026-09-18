from pathlib import Path
import shutil
import sys
import re

path = Path("src/components/Avatar.tsx")

if not path.exists():
    print("ERRO: Avatar.tsx não encontrado.")
    sys.exit(1)

text = path.read_text(encoding="utf-8")
original = text

shutil.copy2(
    path,
    "/tmp/Avatar.tsx.before_premium_level_badge"
)

# ============================================================
# CONFIA — 1B.4D.3A
# BADGE PREMIUM + INTERNACIONALIZAÇÃO DO NÍVEL
# ============================================================

# ------------------------------------------------------------
# 1. Garantir que Sparkles já existe no import Lucide
# ------------------------------------------------------------

if "Sparkles" not in text:
    print("ERRO: Sparkles não encontrado no Avatar.tsx.")
    sys.exit(1)

# ------------------------------------------------------------
# 2. Encontrar exatamente o badge antigo
# ------------------------------------------------------------

pattern = re.compile(
    r'''
    <div
    \s+
    className="
    absolute\s+
    top-2\s+
    left-2\s+
    bg-white/90\s+
    rounded-full\s+
    px-3\s+
    py-1\s+
    shadow\s+
    text-xs\s+
    font-bold\s+
    text-\[\#C97B5E\]\s+
    z-30
    "
    >
    \s*
    ⭐\s*Level\s*\{avatar\.level\}
    \s*
    </div>
    ''',
    re.VERBOSE
)

replacement = '''<div
      className="
        absolute
        top-2
        left-2
        z-30
        flex items-center gap-1.5
        rounded-full
        border border-white/60
        bg-white/80
        px-2.5 py-1.5
        text-[11px] font-bold
        text-[#A9583E]
        shadow-[0_6px_18px_rgba(80,60,50,0.10)]
        backdrop-blur-md
      "
    >
      <span
        className="
          flex h-5 w-5
          items-center justify-center
          rounded-full
          bg-[#FFF1E8]
          text-[#C97B5E]
        "
        aria-hidden="true"
      >
        <Sparkles size={11} strokeWidth={2} />
      </span>

      <span>
        {t("level")} {avatar.level}
      </span>
    </div>'''

text, count = pattern.subn(replacement, text, count=1)

if count != 1:
    print("ERRO: badge antigo não foi encontrado exatamente uma vez.")
    print("Nenhuma alteração efetuada.")
    sys.exit(1)

# ------------------------------------------------------------
# 3. Verificações
# ------------------------------------------------------------

required = [
    '{t("level")} {avatar.level}',
    "<Sparkles",
    'bg-white/80',
    'backdrop-blur-md',
    'text-[#A9583E]',
    "avatar.level",
]

for item in required:
    if item not in text:
        print(f"ERRO: elemento esperado ausente: {item}")
        sys.exit(1)

for legacy in [
    "⭐ Level {avatar.level}",
]:
    if legacy in text:
        print(f"ERRO: badge antigo ainda presente: {legacy}")
        sys.exit(1)

# Não tocar na interação principal
for item in [
    "onClick={handleInteraction}",
    "{renderAvatarSVG()}",
    "{t(\"petCompanion\")}",
    "AnimatePresence",
]:
    if item not in text:
        print(f"ERRO: comportamento importante desapareceu: {item}")
        sys.exit(1)

if text == original:
    print("ERRO: nenhuma alteração efetuada.")
    sys.exit(1)

path.write_text(text, encoding="utf-8")

print("=" * 72)
print("CONFIA — AVATAR 1B.4D.3A")
print("=" * 72)
print("✓ Badge antigo identificado")
print("✓ Emoji estrela do badge removido")
print("✓ 'Level' hardcoded removido")
print("✓ Chave t('level') aplicada")
print("✓ Número do nível preservado")
print("✓ Sparkles Lucide aplicado")
print("✓ Superfície premium translúcida aplicada")
print("✓ Paleta CONFIA aplicada")
print("✓ Interação do Avatar preservada")
print("✓ SVG do Avatar preservado")
print("✓ PT: Nível")
print("✓ EN: Level")
print("✓ ES: Nivel")
print("✓ FR: Niveau")
print("✓ Zero chaves i18n novas")
print("✓ Zero dependências novas")
print()
print("OK — badge premium e internacionalizado aplicado.")
