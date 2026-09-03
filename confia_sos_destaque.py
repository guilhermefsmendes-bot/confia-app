from pathlib import Path
import shutil
import sys

APP = Path("src/App.tsx")
BACKUP = Path("/tmp/App.tsx.before_sos_destaque")

if not APP.exists():
    print("ERRO: src/App.tsx não encontrado.")
    sys.exit(1)

text = APP.read_text(encoding="utf-8")

start_marker = "/* Apoio — acesso SOS discreto e sempre disponível */"
end_marker = "/* Evolução — ecrã próprio dentro do Principal */"

start = text.find(start_marker)
end = text.find(end_marker, start)

if start == -1 or end == -1:
    print("ERRO: bloco SOS não localizado.")
    sys.exit(1)

block = text[start:end]

required = [
    'onClick={() => setTriageOpen(true)}',
    'SOS',
    'crisisQuestion',
    'crisisStartSupport',
]

for item in required:
    if item not in block:
        print(f"ERRO: elemento esperado não encontrado no bloco SOS: {item}")
        sys.exit(1)

block_new = block

block_new = block_new.replace(
    'className="group w-full rounded-[22px] border border-[#E8DDD7]/60 bg-white/45 px-4 py-3 text-left transition-colors duration-200 active:bg-[#FFF8F4]"',
    'className="group w-full rounded-[22px] border border-[#8F433A]/35 bg-gradient-to-r from-[#A65349] to-[#93443C] px-4 py-3 text-left shadow-[0_8px_22px_rgba(130,58,50,0.16)] transition-all duration-200 active:scale-[0.99] active:opacity-95"'
)

block_new = block_new.replace(
    'className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E5A88B]/20 bg-[#FFF8F4]"',
    'className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10"'
)

block_new = block_new.replace(
    'className="text-[#C97B5E]"',
    'className="text-white"'
)

block_new = block_new.replace(
    'className="text-xs font-black text-[#4E3B36] font-display"',
    'className="text-xs font-black text-white font-display"'
)

block_new = block_new.replace(
    'className="mt-0.5 truncate text-[10px] font-semibold text-slate-400"',
    'className="mt-0.5 truncate text-[10px] font-semibold text-white/70"'
)

block_new = block_new.replace(
    'className="text-[10px] font-black tracking-wide text-[#C97B5E]"',
    'className="text-[10px] font-black tracking-wide text-white"'
)

block_new = block_new.replace(
    'className="text-sm font-light text-[#C97B5E]"',
    'className="text-sm font-light text-white/90"'
)

if block_new == block:
    print("ERRO: nenhuma alteração foi efetuada.")
    sys.exit(1)

shutil.copy2(APP, BACKUP)

new_text = text[:start] + block_new + text[end:]

APP.write_text(new_text, encoding="utf-8")

print("=" * 72)
print("CONFIA — SOS COM DESTAQUE VISUAL")
print("=" * 72)
print()
print("✓ Alteração limitada exclusivamente ao bloco SOS")
print("✓ Fundo vermelho terracota escuro")
print("✓ Ícone branco")
print("✓ Texto branco")
print("✓ SOS destacado")
print("✓ Sombra discreta")
print("✓ onClick e triage preservados")
print()
print("Backup:")
print(f"  {BACKUP}")
print()
print("=" * 72)
