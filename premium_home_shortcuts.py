from pathlib import Path
import shutil
import sys

app = Path("src/App.tsx")

if not app.exists():
    print("ERRO: src/App.tsx não encontrado.")
    sys.exit(1)

text = app.read_text(encoding="utf-8")
original = text

shutil.copy2(app, "/tmp/App.tsx.before_premium_home_shortcuts")

# =========================================================
# 1. Acrescentar ícones Lucide necessários
# =========================================================

marker = """  ChartNoAxesCombined
} from 'lucide-react';"""

replacement = """  ChartNoAxesCombined,
  Backpack,
  Store,
  Settings
} from 'lucide-react';"""

if marker not in text:
    print("ERRO: final do import Lucide não encontrado como esperado.")
    sys.exit(1)

text = text.replace(marker, replacement, 1)

# =========================================================
# 2. Localizar exatamente o bloco atual dos 4 atalhos
# =========================================================

start_marker = """{/* Botões do menu principal — só existem quando homeScreen === "home" */}"""

end_marker = """              {/* Crisis Screening SOS Button */}"""

start = text.find(start_marker)
end = text.find(end_marker)

if start == -1:
    print("ERRO: início dos atalhos da Home não encontrado.")
    sys.exit(1)

if end == -1 or end <= start:
    print("ERRO: fim dos atalhos da Home não encontrado.")
    sys.exit(1)

old_block = text[start:end]

# verificações para garantir que estamos no bloco correto
required = [
    'setHomeScreen("inventory")',
    'setHomeScreen("shop")',
    'setHomeScreen("settings")',
    'setHomeScreen("companion")',
    '<Avatar',
]

for item in required:
    if item not in old_block:
        print(f"ERRO: bloco encontrado mas falta: {item}")
        print("Nenhuma alteração foi gravada.")
        sys.exit(1)

# =========================================================
# 3. Novo bloco premium
# =========================================================

new_block = """{/* Navegação secundária premium da Home */}
{homeScreen === "home" && (
  <div className="py-2">

    {/* Companion — elemento principal */}
    <button
      onClick={() => setHomeScreen("companion")}
      className="w-full flex items-center justify-between gap-4 rounded-[28px] border border-[#E5A88B]/20 bg-gradient-to-br from-[#FFF9F5] to-white px-5 py-4 text-left shadow-sm transition-transform duration-200 active:scale-[0.99]"
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className="w-14 h-14 shrink-0 rounded-2xl bg-white border border-[#E5A88B]/15 flex items-center justify-center overflow-hidden">
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
        </div>

        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#C97B5E]">
            CONFIA
          </p>
          <p className="mt-0.5 text-sm font-black text-[#4E3B36]">
            {t("companion")}
          </p>
        </div>
      </div>

      <span
        aria-hidden="true"
        className="shrink-0 text-lg font-light text-[#C97B5E]"
      >
        →
      </span>
    </button>

    {/* Acessos utilitários */}
    <div className="mt-3 grid grid-cols-3 gap-2">

      <button
        onClick={() => setHomeScreen("inventory")}
        className="flex min-h-[68px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-slate-200/70 bg-white/80 px-2 py-3 text-[#4E3B36] transition-colors duration-200 active:bg-[#FFF9F5]"
      >
        <Backpack size={18} strokeWidth={1.8} className="text-[#C97B5E]" />
        <span className="text-[10px] font-bold">
          {t("inventory")}
        </span>
      </button>

      <button
        onClick={() => setHomeScreen("shop")}
        className="flex min-h-[68px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-slate-200/70 bg-white/80 px-2 py-3 text-[#4E3B36] transition-colors duration-200 active:bg-[#FFF9F5]"
      >
        <Store size={18} strokeWidth={1.8} className="text-[#C97B5E]" />
        <span className="text-[10px] font-bold">
          {t("shop")}
        </span>
      </button>

      <button
        onClick={() => setHomeScreen("settings")}
        className="flex min-h-[68px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-slate-200/70 bg-white/80 px-2 py-3 text-[#4E3B36] transition-colors duration-200 active:bg-[#FFF9F5]"
      >
        <Settings size={18} strokeWidth={1.8} className="text-slate-400" />
        <span className="text-[10px] font-bold text-slate-500">
          {t("settings")}
        </span>
      </button>

    </div>
  </div>
)}

"""

text = text[:start] + new_block + text[end:]

# =========================================================
# 4. Segurança
# =========================================================

if 'setHomeScreen("companion")' not in new_block:
    print("ERRO interno: Companion perdido.")
    sys.exit(1)

if text == original:
    print("ERRO: nenhuma alteração produzida.")
    sys.exit(1)

app.write_text(text, encoding="utf-8")

# =========================================================
# 5. Traduções simples
# =========================================================

translations = {
    "pt": ("Inventário", "Loja"),
    "en": ("Inventory", "Shop"),
    "es": ("Inventario", "Tienda"),
    "fr": ("Inventaire", "Boutique"),
}

for lang, (inventory, shop) in translations.items():

    p = Path(f"src/locales/{lang}.json")

    if not p.exists():
        print(f"ERRO: {p} não encontrado.")
        sys.exit(1)

    locale = p.read_text(encoding="utf-8")
    shutil.copy2(p, f"/tmp/{lang}.json.before_premium_home_shortcuts")

    # Idempotência: só adicionar se ainda não existirem no nível simples
    if f'"inventory": "{inventory}"' not in locale:

        settings_marker = '"settings":'

        pos = locale.find(settings_marker)

        if pos == -1:
            print(f"ERRO: chave settings não encontrada em {p}.")
            sys.exit(1)

        line_start = locale.rfind("\n", 0, pos) + 1
        line_end = locale.find("\n", pos)

        settings_line = locale[line_start:line_end]

        indent = settings_line[:len(settings_line) - len(settings_line.lstrip())]

        insertion = (
            f'{indent}"inventory": "{inventory}",\n'
            f'{indent}"shop": "{shop}",\n'
        )

        locale = locale[:line_start] + insertion + locale[line_start:]

        p.write_text(locale, encoding="utf-8")

print("=" * 72)
print("CONFIA — PREMIUM HOME 1A.2")
print("=" * 72)
print("✓ Companion passou a elemento principal")
print("✓ Avatar reutilizado — nenhum asset novo")
print("✓ Inventário convertido para acesso secundário")
print("✓ Loja convertida para acesso secundário")
print("✓ Definições convertidas para acesso utilitário")
print("✓ Emojis grandes removidos")
print("✓ Ícones Lucide reutilizados")
print("✓ Traduções PT / EN / ES / FR preparadas")
print("✓ Nenhuma biblioteca adicionada")
print("✓ Nenhuma imagem adicionada")
print("✓ Nenhuma animação contínua adicionada")
print()
print("OK — Fase 1A.2 aplicada.")
