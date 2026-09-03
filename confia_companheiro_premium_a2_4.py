from pathlib import Path
import shutil
import sys

TARGET = Path("src/components/Avatar.tsx")
BACKUP = Path("/tmp/Avatar.tsx.before_companheiro_premium_a2_4")

if not TARGET.exists():
    print("ERRO: Avatar.tsx não encontrado.")
    sys.exit(1)

text = TARGET.read_text(encoding="utf-8")

required = [
    "CONFIA 4C — ESTADO VISÍVEL DO COMPANION",
    "{companionStatus.label}",
    '{t("level")} {avatar.level}',
    '{t("petCompanion")}',
    "<ConfiaCreature",
    "onClick={handleInteraction}",
]

for marker in required:
    if marker not in text:
        print(f"ERRO: estrutura esperada não encontrada: {marker}")
        sys.exit(1)

shutil.copy2(TARGET, BACKUP)

# ============================================================
# 1. REMOVER ESTADO VISÍVEL SUPERIOR
# ============================================================

start_marker = "      {/* CONFIA 4C — ESTADO VISÍVEL DO COMPANION */}"
end_marker = "      {/* Interactive Avatar Container */}"

start = text.find(start_marker)
end = text.find(end_marker)

if start == -1 or end == -1 or end <= start:
    print("ERRO: não foi possível localizar os badges superiores.")
    sys.exit(1)

text = text[:start] + "      {/* Interactive Avatar Container */}\n" + text[
    end + len(end_marker):
]

# ============================================================
# 2. REMOVER BADGE PET COMPANION
# ============================================================

pet_start = '''   <p className="text-xs text-slate-500 mt-1 mb-4 flex items-center gap-1 bg-white px-3 py-1.5 rounded-full border border-[#E5A88B]/15 shadow-sm shadow-[#E5A88B]/5">'''

pet_end = '''        </p>'''

ps = text.find(pet_start)

if ps == -1:
    print("ERRO: badge petCompanion não encontrado.")
    sys.exit(1)

pe = text.find(pet_end, ps)

if pe == -1:
    print("ERRO: fim do badge petCompanion não encontrado.")
    sys.exit(1)

pe += len(pet_end)

text = text[:ps] + text[pe:]

# ============================================================
# 3. COMPACTAR WRAPPER DO AVATAR
# ============================================================

old_wrapper = '''
return (
  <div className="relative flex flex-col items-center justify-center pt-2 pb-4 px-4">
'''

new_wrapper = '''
return (
  <div className="relative flex items-center justify-center">
'''

if old_wrapper not in text:
    print("ERRO: wrapper principal esperado não encontrado.")
    sys.exit(1)

text = text.replace(old_wrapper, new_wrapper, 1)

# ============================================================
# 4. TORNAR INTERAÇÃO MAIS LIMPA
# ============================================================

old_interaction_class = '''        className="relative cursor-pointer transition-transform hover:scale-105 active:scale-95 flex items-center justify-center p-4"'''

new_interaction_class = '''        className="relative flex items-center justify-center cursor-pointer select-none"'''

if old_interaction_class not in text:
    print("ERRO: classe de interação esperada não encontrada.")
    sys.exit(1)

text = text.replace(
    old_interaction_class,
    new_interaction_class,
    1
)

# ============================================================
# 5. VALIDAÇÃO
# ============================================================

checks = {
    "Criatura preservada":
        "<ConfiaCreature" in text,

    "Toque preservado":
        "onClick={handleInteraction}" in text,

    "Micro-reação preservada":
        "animate={isJumping ?" in text,

    "Badge nível removido":
        '{t("level")} {avatar.level}' not in text,

    "Badge petCompanion removido":
        '{t("petCompanion")}' not in text,

    "Estado visual removido":
        "{companionStatus.label}" not in text,

    "Sem animate-pulse":
        "animate-pulse" not in text,

    "Sem repeat Infinity":
        "repeat: Infinity" not in text,

    "Sem AnimatePresence":
        "AnimatePresence" not in text,

    "Sem partículas":
        "setHearts" not in text,
}

failed = [
    name
    for name, ok in checks.items()
    if not ok
]

if failed:
    shutil.copy2(BACKUP, TARGET)

    print("ERRO: validação falhou.")
    for item in failed:
        print(" -", item)

    print()
    print("Avatar.tsx restaurado automaticamente.")
    sys.exit(1)

TARGET.write_text(text, encoding="utf-8")

print("=" * 76)
print("CONFIA — COMPANHEIRO PREMIUM A2.4")
print("=" * 76)
print()
print("✓ Badge interno de nível removido")
print("✓ Estado visual superior removido")
print("✓ Badge 'Companheiro' removido")
print("✓ animate-pulse removido")
print("✓ Criatura preservada")
print("✓ Toque preservado")
print("✓ Micro-reação ao toque preservada")
print("✓ Memória e lógica do Avatar preservadas")
print("✓ XP e níveis preservados")
print("✓ Casa premium passa a controlar toda a apresentação")
print("✓ Sem animações permanentes")
print("✓ Sem partículas")
print("✓ Sem novas dependências")
print()
print("Backup:")
print(f"  {BACKUP}")
print()
print("A2.4 aplicado.")
print("=" * 76)
