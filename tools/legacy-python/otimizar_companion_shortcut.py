from pathlib import Path
import shutil
import sys

path = Path("src/App.tsx")

if not path.exists():
    print("ERRO: src/App.tsx não encontrado.")
    sys.exit(1)

text = path.read_text(encoding="utf-8")
original = text

shutil.copy2(path, "/tmp/App.tsx.before_companion_shortcut_optimization")

old = """        <div className="w-14 h-14 shrink-0 rounded-2xl bg-white border border-[#E5A88B]/15 flex items-center justify-center overflow-hidden">
          <div
            className="w-40 h-40 flex items-center justify-center pointer-events-none"
            style={{
              transform: "scale(0.30)",
              transformOrigin: "center center"
            }}
          >
            <Avatar
              avatar={avatar}
              onPet={() => {}}
              compact
            />
          </div>
        </div>"""

new = """        <div className="w-14 h-14 shrink-0 rounded-2xl bg-white border border-[#E5A88B]/15 flex items-center justify-center">
          <Sparkles
            size={23}
            strokeWidth={1.7}
            className="text-[#C97B5E]"
          />
        </div>"""

count = text.count(old)

if count != 1:
    print(f"ERRO: esperava encontrar 1 Avatar no atalho; encontrei {count}.")
    print("Nenhuma alteração foi gravada.")
    sys.exit(1)

text = text.replace(old, new, 1)

path.write_text(text, encoding="utf-8")

print("=" * 72)
print("CONFIA — OTIMIZAÇÃO 1A.2b")
print("=" * 72)
print("✓ Segundo Avatar removido do atalho")
print("✓ Sparkles reutilizado")
print("✓ HomeWorld permanece intacto")
print("✓ Companion permanece destacado")
print("✓ Menos DOM")
print("✓ Menos trabalho de renderização")
print("✓ Nenhuma biblioteca ou asset novo")
print()
print("OK — atalho do Companion otimizado.")
