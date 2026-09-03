from pathlib import Path
import shutil
import sys

path = Path("src/App.tsx")

if not path.exists():
    print("ERRO: src/App.tsx não encontrado.")
    sys.exit(1)

text = path.read_text(encoding="utf-8")
original = text

shutil.copy2(path, "/tmp/App.tsx.before_premium_microdetails")

# =========================================================
# 1. Remover pulse permanente do nível
# =========================================================

old = '<Sparkles size={13} className="text-[#E5A88B] animate-pulse" />'
new = '<Sparkles size={13} strokeWidth={1.9} className="text-[#E5A88B]" />'

if old not in text:
    print("ERRO: Sparkles animado do nível não encontrado.")
    sys.exit(1)

text = text.replace(old, new, 1)

# =========================================================
# 2. Refinar badge de nível
# =========================================================

old = 'className="flex items-center gap-1.5 bg-[#E5A88B]/10 text-[#C97B5E] px-3 py-1.5 rounded-xl border border-[#E5A88B]/25 text-xs font-black font-mono"'

new = 'className="flex items-center gap-1.5 bg-[#FFF8F4] text-[#C97B5E] px-3 py-1.5 rounded-xl border border-[#E5A88B]/20 text-xs font-bold font-mono"'

if old not in text:
    print("ERRO: badge de nível não encontrado.")
    sys.exit(1)

text = text.replace(old, new, 1)

# =========================================================
# 3. Trocar emoji do insight por Lucide
# =========================================================

old = """      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-lg shadow-sm">
        ✨
      </div>"""

new = """      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white border border-[#E5A88B]/15">
        <Sparkles
          size={18}
          strokeWidth={1.8}
          className="text-[#C97B5E]"
        />
      </div>"""

if old not in text:
    print("ERRO: emoji do insight reativo não encontrado.")
    sys.exit(1)

text = text.replace(old, new, 1)

# =========================================================
# SEGURANÇA
# =========================================================

checks = [
    't("level")',
    't("reactiveInsightTitle")',
    't(reactiveMessageKey)',
    "<HomeWorld",
    "<HomeProgressSummary",
]

for check in checks:
    if check not in text:
        print(f"ERRO de segurança: desapareceu {check}")
        sys.exit(1)

if text == original:
    print("ERRO: nenhuma alteração produzida.")
    sys.exit(1)

path.write_text(text, encoding="utf-8")

print("=" * 72)
print("CONFIA — PREMIUM 1A.5")
print("=" * 72)
print("✓ Pulse permanente do nível removido")
print("✓ Badge de nível tornado mais discreto")
print("✓ Emoji do insight substituído por Lucide Sparkles")
print("✓ Linguagem visual mais consistente")
print("✓ Zero textos novos")
print("✓ PT / EN / ES / FR preservados")
print("✓ Zero bibliotecas novas")
print("✓ Zero assets novos")
print("✓ Menos uma animação permanente")
print()
print("OK — Fase 1A.5 aplicada.")
