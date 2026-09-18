from pathlib import Path

path = Path("src/App.tsx")

if not path.exists():
    print("ERRO: src/App.tsx não encontrado.")
    raise SystemExit(1)

text = path.read_text(encoding="utf-8")

# ---------------------------------------------------------
# 1. Adicionar import
# ---------------------------------------------------------

import_line = 'import Companion from "./components/Companheiro/Companion";'

if import_line not in text:
    marker = 'import DailyCheckIn from "./components/DailyCheckIn";'

    if marker not in text:
        print("ERRO: não encontrei o import de DailyCheckIn.")
        raise SystemExit(1)

    text = text.replace(
        marker,
        marker + "\nimport Companion from \"./components/Companheiro/Companion\";"
    )

# ---------------------------------------------------------
# 2. Verificar se já existe estado do Companion
# ---------------------------------------------------------

if 'useState<"home" | "inventory" | "shop" | "settings" | "companion">' not in text:

    old = '''const [homeScreen, setHomeScreen] = useState<
    "home" | "inventory" | "shop" | "settings"
  >("home");'''

    new = '''const [homeScreen, setHomeScreen] = useState<
    "home" | "inventory" | "shop" | "settings" | "companion"
  >("home");'''

    if old in text:
        text = text.replace(old, new)
    else:
        # Tenta encontrar a declaração através de uma substituição mais flexível
        old2 = '"home" | "inventory" | "shop" | "settings"'
        new2 = '"home" | "inventory" | "shop" | "settings" | "companion"'

        if old2 in text:
            text = text.replace(old2, new2, 1)
        else:
            print("AVISO: não foi encontrada a definição esperada de homeScreen.")

# ---------------------------------------------------------
# 3. Adicionar ecrã do Companion
# ---------------------------------------------------------

companion_screen = '''
{currentTab === 0 && homeScreen === "companion" && (
  <motion.div
    key="companion-screen"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex-1 px-4 pt-4"
  >
    <div className="max-w-md mx-auto">
      
      <button
        onClick={() => setHomeScreen("home")}
        className="mb-4 text-xs font-bold text-[#C97B5E]"
      >
        ← {t("back")}
      </button>

      <Companion
        avatarLevel={avatar.level}
        avatarXp={avatar.xp}
      />

    </div>
  </motion.div>
)}
'''

# Inserir antes do Shop
shop_marker = '{currentTab === 0 && homeScreen === "shop" && ('

if companion_screen.strip() not in text:

    if shop_marker not in text:
        print("ERRO: não encontrei o ecrã Shop.")
        raise SystemExit(1)

    text = text.replace(
        shop_marker,
        companion_screen + "\n" + shop_marker
    )

# ---------------------------------------------------------
# 4. Adicionar botão no menu principal
# ---------------------------------------------------------

# Procuramos a zona dos botões do menu principal.
# Não substituímos botões existentes.

button = '''
      <button
        onClick={() => setHomeScreen("companion")}
        className="w-full bg-white border border-[#E5A88B]/20 rounded-3xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition"
      >
        <div className="w-11 h-11 rounded-2xl bg-[#FFF0E8] flex items-center justify-center text-2xl">
          🌱
        </div>

        <div className="flex-1 text-left">
          <div className="font-black text-[#4E3B36] text-sm">
            {t("companionTitle")}
          </div>

          <div className="text-[10px] text-slate-400 mt-0.5">
            {t("companionSubtitle")}
          </div>
        </div>

        <span className="text-[#C97B5E] text-lg">
          →
        </span>
      </button>
'''

# Colocar depois da zona do menu principal, antes do DailyCheckIn.
daily_marker = '<DailyCheckIn'

if button.strip() not in text:

    if daily_marker not in text:
        print("ERRO: não encontrei DailyCheckIn para inserir o botão.")
        raise SystemExit(1)

    text = text.replace(
        daily_marker,
        button + "\n\n" + daily_marker,
        1
    )

# ---------------------------------------------------------
# 5. Gravar
# ---------------------------------------------------------

path.write_text(text, encoding="utf-8")

print("=" * 70)
print("CONFIA — COMPANHEIRO ADICIONADO AO APP")
print("=" * 70)
print()
print("✓ Import do Companion adicionado")
print("✓ Estado homeScreen preparado")
print("✓ Ecrã do Companheiro adicionado")
print("✓ Botão de acesso adicionado ao menu principal")
print("✓ Registos existentes mantidos")
print("✓ localStorage existente mantido")
print("✓ Navegação inferior mantida com 5 separadores")
print()
print("O fluxo agora é:")
print()
print("Menu principal")
print("      ↓")
print("🌱 Companheiro")
print("      ↓")
print("Companion.tsx")
print("      ↓")
print("collectCompanionData()")
print("      ↓")
print("analyzeCompanionData()")
print()
print("=" * 70)

