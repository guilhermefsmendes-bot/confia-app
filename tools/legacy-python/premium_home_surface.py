from pathlib import Path
import shutil
import sys

path = Path("src/App.tsx")

if not path.exists():
    print("ERRO: src/App.tsx não encontrado.")
    sys.exit(1)

text = path.read_text(encoding="utf-8")
original = text

shutil.copy2(path, "/tmp/App.tsx.before_premium_home_surface")

changes = []

# =========================================================
# 1. Ritmo vertical da Home
# =========================================================

old = 'className="space-y-6"'
new = 'className="space-y-5"'

if old not in text:
    print("ERRO: space-y-6 principal da Home não encontrado.")
    sys.exit(1)

text = text.replace(old, new, 1)
changes.append("ritmo vertical")

# =========================================================
# 2. Remover aparência de grande cartão exterior
#    Preservamos o wrapper para não arriscar a estrutura JSX.
# =========================================================

old = 'className="bg-white border border-[#E5A88B]/15 rounded-[32px] p-6 shadow-sm space-y-4"'
new = 'className="space-y-4"'

if old not in text:
    print("ERRO: cartão exterior do HomeWorld não encontrado.")
    sys.exit(1)

text = text.replace(old, new, 1)
changes.append("superfície exterior do HomeWorld")

# =========================================================
# 3. SOS — retirar animação permanente
# =========================================================

old = 'className="p-3 bg-[#E5A88B] text-white rounded-2xl shadow-md shadow-[#E5A88B]/20 animate-pulse"'
new = 'className="p-3 bg-[#E5A88B] text-white rounded-2xl"'

if old not in text:
    print("ERRO: ícone animado do SOS não encontrado.")
    sys.exit(1)

text = text.replace(old, new, 1)
changes.append("pulse permanente do SOS")

# =========================================================
# 4. SOS — superfície mais discreta
# =========================================================

old = 'className="w-full p-5 bg-[#FFF0E8] border border-[#E5A88B]/35 rounded-[32px] flex items-center justify-between group shadow-sm transition-all hover:bg-[#FFE8DE] cursor-pointer"'

new = 'className="w-full px-5 py-4 bg-[#FFF8F4] border border-[#E5A88B]/20 rounded-[28px] flex items-center justify-between group transition-colors duration-200 active:bg-[#FFF0E8] cursor-pointer"'

if old not in text:
    print("ERRO: superfície atual do SOS não encontrada.")
    sys.exit(1)

text = text.replace(old, new, 1)
changes.append("superfície SOS")

# =========================================================
# 5. Evitar hover transform desnecessário no SOS
# =========================================================

old = 'className="text-xs font-black text-[#C97B5E] group-hover:translate-x-1 transition-transform font-display"'
new = 'className="text-xs font-black text-[#C97B5E] font-display"'

if old not in text:
    print("ERRO: indicador SOS não encontrado.")
    sys.exit(1)

text = text.replace(old, new, 1)
changes.append("microanimação SOS")

# =========================================================
# SEGURANÇA
# =========================================================

if text == original:
    print("ERRO: nenhuma alteração produzida.")
    sys.exit(1)

# Não estamos autorizados a alterar conteúdo/i18n nesta fase.
if 't("crisisQuestion")' not in text:
    print("ERRO: crisisQuestion desapareceu.")
    sys.exit(1)

if 't("crisisStartSupport")' not in text:
    print("ERRO: crisisStartSupport desapareceu.")
    sys.exit(1)

if "<HomeWorld" not in text:
    print("ERRO: HomeWorld desapareceu.")
    sys.exit(1)

if "<HomeProgressSummary" not in text:
    print("ERRO: HomeProgressSummary desapareceu.")
    sys.exit(1)

path.write_text(text, encoding="utf-8")

print("=" * 72)
print("CONFIA — PREMIUM HOME 1A.4")
print("=" * 72)

for change in changes:
    print(f"✓ {change}")

print()
print("✓ HomeWorld e lógica preservados")
print("✓ HomeProgressSummary preservado")
print("✓ Insight reativo preservado")
print("✓ SOS funcionalmente preservado")
print("✓ Zero traduções novas")
print("✓ PT / EN / ES / FR inalterados")
print("✓ Zero bibliotecas novas")
print("✓ Zero assets novos")
print("✓ Uma animação permanente removida")
print()
print("OK — Fase 1A.4 aplicada.")
