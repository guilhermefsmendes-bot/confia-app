from pathlib import Path
import shutil
import sys

path = Path("src/App.tsx")

if not path.exists():
    print("ERRO: src/App.tsx não encontrado.")
    sys.exit(1)

text = path.read_text(encoding="utf-8")
original = text

shutil.copy2(
    path,
    "/tmp/App.tsx.before_premium_1B3"
)

start_marker = """{/* Navegação secundária premium da Home */}"""
end_marker = """              {/* Crisis Screening SOS Button */}"""

start = text.find(start_marker)
end = text.find(end_marker)

if start == -1:
    print("ERRO: início da navegação secundária não encontrado.")
    sys.exit(1)

if end == -1 or end <= start:
    print("ERRO: fim da navegação secundária não encontrado.")
    sys.exit(1)

old_block = text[start:end]

required = [
    'setHomeScreen("companion")',
    'setHomeScreen("inventory")',
    'setHomeScreen("shop")',
    'setHomeScreen("settings")',
    't("companion")',
    't("inventory")',
    't("shop")',
    't("settings")',
]

for item in required:
    if item not in old_block:
        print(f"ERRO: elemento esperado não encontrado: {item}")
        sys.exit(1)

new_block = """{/* Navegação secundária premium da Home */}
{homeScreen === "home" && (
  <nav
    className="rounded-[24px] border border-[#E8DDD7]/70 bg-white/65 px-3 py-3"
    aria-label="Home"
  >

    {/* Companion */}
    <button
      type="button"
      onClick={() => setHomeScreen("companion")}
      className="w-full flex items-center justify-between gap-3 rounded-2xl px-2 py-2 text-left transition-colors duration-200 active:bg-[#FFF8F4]"
    >
      <div className="flex min-w-0 items-center gap-3">

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF5EF]">
          <Sparkles
            size={17}
            strokeWidth={1.8}
            className="text-[#C97B5E]"
          />
        </div>

        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#C97B5E]">
            CONFIA
          </p>

          <p className="text-xs font-black text-[#4E3B36]">
            {t("companion")}
          </p>
        </div>

      </div>

      <span
        aria-hidden="true"
        className="shrink-0 pr-1 text-base font-light text-[#C97B5E]"
      >
        →
      </span>
    </button>

    {/* Utilitários */}
    <div className="mt-2 grid grid-cols-3 border-t border-[#E8DDD7]/60 pt-2">

      <button
        type="button"
        onClick={() => setHomeScreen("inventory")}
        className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-1 text-slate-500 transition-colors duration-200 active:bg-[#FFF8F4]"
      >
        <Backpack
          size={15}
          strokeWidth={1.8}
          className="text-[#C97B5E]"
        />

        <span className="text-[9px] font-bold">
          {t("inventory")}
        </span>
      </button>

      <button
        type="button"
        onClick={() => setHomeScreen("shop")}
        className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-1 text-slate-500 transition-colors duration-200 active:bg-[#FFF8F4]"
      >
        <Store
          size={15}
          strokeWidth={1.8}
          className="text-[#C97B5E]"
        />

        <span className="text-[9px] font-bold">
          {t("shop")}
        </span>
      </button>

      <button
        type="button"
        onClick={() => setHomeScreen("settings")}
        className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-1 text-slate-500 transition-colors duration-200 active:bg-[#FFF8F4]"
      >
        <Settings
          size={15}
          strokeWidth={1.8}
          className="text-slate-400"
        />

        <span className="text-[9px] font-bold">
          {t("settings")}
        </span>
      </button>

    </div>

  </nav>
)}

"""

text = text[:start] + new_block + text[end:]

# =========================================================
# VERIFICAÇÕES
# =========================================================

checks = [
    'setHomeScreen("companion")',
    'setHomeScreen("inventory")',
    'setHomeScreen("shop")',
    'setHomeScreen("settings")',
    't("companion")',
    't("inventory")',
    't("shop")',
    't("settings")',
    "<Backpack",
    "<Store",
    "<Settings",
    "<Sparkles",
]

for item in checks:
    if item not in text:
        print(f"ERRO de segurança: desapareceu {item}")
        sys.exit(1)

if text == original:
    print("ERRO: nenhuma alteração produzida.")
    sys.exit(1)

path.write_text(text, encoding="utf-8")

print("=" * 72)
print("CONFIA — PREMIUM HOME 1B.3")
print("=" * 72)
print("✓ Companion convertido para acesso compacto")
print("✓ Inventário deixou de ser cartão independente")
print("✓ Loja deixou de ser cartão independente")
print("✓ Definições deixou de ser cartão independente")
print("✓ Todos os quatro acessos preservados")
print("✓ Hierarquia da Home mais limpa")
print("✓ Menos altura ocupada")
print("✓ Menos superfícies visuais")
print("✓ Zero textos novos")
print("✓ PT / EN / ES / FR preservados")
print("✓ Zero bibliotecas novas")
print("✓ Zero assets novos")
print("✓ Zero animações novas")
print()
print("OK — Fase 1B.3 aplicada.")
