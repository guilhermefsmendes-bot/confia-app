from pathlib import Path
import shutil
import sys

path = Path("src/App.tsx")

if not path.exists():
    print("ERRO: src/App.tsx não encontrado.")
    sys.exit(1)

text = path.read_text(encoding="utf-8")
original = text

# ============================================================
# CONFIA — PRINCIPAL PREMIUM 1B.5B.2
# SOS discreto, acessível e integrado na hierarquia da Home
# ============================================================

start_marker = '''{/* Apoio — acesso SOS sempre disponível */}'''
end_marker = '''</div>

            </div>
          )}'''

start = text.find(start_marker)

if start == -1:
    print("ERRO: início do bloco SOS não encontrado.")
    sys.exit(1)

end = text.find(end_marker, start)

if end == -1:
    print("ERRO: fim da Home depois do SOS não encontrado.")
    sys.exit(1)

old_block = text[start:end]

required_old = [
    "setTriageOpen(true)",
    't("crisisQuestion")',
    't("crisisStartSupport")',
    "<Brain",
    "SOS",
]

for fragment in required_old:
    if fragment not in old_block:
        print(f"ERRO: bloco SOS incompleto: {fragment}")
        sys.exit(1)

new_block = '''{/* Apoio — acesso SOS discreto e sempre disponível */}
<button
  type="button"
  onClick={() => setTriageOpen(true)}
  className="group w-full rounded-[22px] border border-[#E8DDD7]/60 bg-white/45 px-4 py-3 text-left transition-colors duration-200 active:bg-[#FFF8F4]"
>
  <div className="flex items-center gap-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E5A88B]/20 bg-[#FFF8F4]">
      <Brain
        size={16}
        strokeWidth={1.7}
        className="text-[#C97B5E]"
      />
    </div>

    <div className="min-w-0 flex-1">
      <p className="text-xs font-black text-[#4E3B36] font-display">
        {t("crisisQuestion")}
      </p>

      <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-400">
        {t("crisisStartSupport")}
      </p>
    </div>

    <div className="flex shrink-0 items-center gap-1.5">
      <span className="text-[10px] font-black tracking-wide text-[#C97B5E]">
        SOS
      </span>

      <span
        aria-hidden="true"
        className="text-sm font-light text-[#C97B5E]"
      >
        →
      </span>
    </div>
  </div>
</button>

'''

text = text[:start] + new_block + text[end:]

# ============================================================
# Verificações
# ============================================================

required_new = [
    "Apoio — acesso SOS discreto e sempre disponível",
    "setTriageOpen(true)",
    't("crisisQuestion")',
    't("crisisStartSupport")',
    "<Brain",
    "SOS",
    "bg-white/45",
    "rounded-[22px]",
]

for fragment in required_new:
    if fragment not in text:
        print(f"ERRO: verificação final falhou: {fragment}")
        sys.exit(1)

if text.count("Apoio — acesso SOS discreto e sempre disponível") != 1:
    print("ERRO: bloco SOS premium não é único.")
    sys.exit(1)

# Garantir que a hierarquia continua correta.
today = text.find("/* Hoje — resumo + registo diário */")
space = text.find("/* O teu espaço — navegação secundária premium */")
sos = text.find("/* Apoio — acesso SOS discreto e sempre disponível */")
patterns = text.find("/* Padrões — ecrã próprio dentro do Principal */")

if -1 in [today, space, sos, patterns]:
    print("ERRO: não foi possível validar a hierarquia da Home.")
    sys.exit(1)

if not (today < space < sos < patterns):
    print("ERRO: hierarquia da Home deixou de estar correta.")
    sys.exit(1)

# Garantir que navegação importante continua presente.
for fragment in [
    'setHomeScreen("companion")',
    'setHomeScreen("patterns")',
    'setHomeScreen("inventory")',
    'setHomeScreen("shop")',
    'setHomeScreen("settings")',
]:
    if fragment not in text:
        print(f"ERRO: navegação perdida: {fragment}")
        sys.exit(1)

if text == original:
    print("ERRO: nenhuma alteração efetuada.")
    sys.exit(1)

# ============================================================
# Backup fora do projeto
# ============================================================

shutil.copy2(
    path,
    "/tmp/App.tsx.before_premium_home_sos"
)

# ============================================================
# Escrita
# ============================================================

path.write_text(text, encoding="utf-8")

print("=" * 72)
print("CONFIA — PRINCIPAL PREMIUM 1B.5B.2")
print("=" * 72)
print("✓ SOS continua sempre acessível")
print("✓ Ação setTriageOpen preservada")
print("✓ crisisQuestion preservada")
print("✓ crisisStartSupport preservada")
print("✓ SOS deixou de competir com Hoje")
print("✓ SOS deixou de competir com O teu espaço")
print("✓ Composição visual mais leve")
print("✓ Nenhuma tradução nova necessária")
print("✓ PT / EN / ES / FR preservados")
print("✓ Nenhum storage novo")
print("✓ Nenhuma dependência nova")
print()
print("OK — SOS integrado na hierarquia premium.")
