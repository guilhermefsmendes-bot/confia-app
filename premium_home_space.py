from pathlib import Path
import json
import shutil
import sys

app_path = Path("src/App.tsx")

locale_values = {
    "pt": {
        "title": "O teu espaço",
        "subtitle": "Tudo o que cresce contigo",
    },
    "en": {
        "title": "Your space",
        "subtitle": "Everything that grows with you",
    },
    "es": {
        "title": "Tu espacio",
        "subtitle": "Todo lo que crece contigo",
    },
    "fr": {
        "title": "Ton espace",
        "subtitle": "Tout ce qui grandit avec toi",
    },
}

if not app_path.exists():
    print("ERRO: src/App.tsx não encontrado.")
    sys.exit(1)

text = app_path.read_text(encoding="utf-8")
original = text

# ============================================================
# CONFIA — PRINCIPAL PREMIUM 1B.5B.1
#
# Evolução visual de "O teu espaço"
#
# Hierarquia:
# - título/contexto
# - Amigo como ação principal
# - Hábitos / Inventário / Loja
# - Definições discreta
#
# Sem alteração de lógica ou storage.
# ============================================================


# ------------------------------------------------------------
# 1. Localizar bloco atual da navegação
# ------------------------------------------------------------

start_marker = '''{/* O teu espaço — navegação secundária da Home */}'''

end_marker = '''{/* Apoio — acesso SOS sempre disponível */}'''

start = text.find(start_marker)

if start == -1:
    print("ERRO: início de 'O teu espaço' não encontrado.")
    sys.exit(1)

end = text.find(end_marker, start)

if end == -1:
    print("ERRO: fim de 'O teu espaço' não encontrado.")
    sys.exit(1)

old_block = text[start:end]

required_old = [
    'setHomeScreen("companion")',
    'setHomeScreen("inventory")',
    'setHomeScreen("patterns")',
    'setHomeScreen("shop")',
    'setHomeScreen("settings")',
    't("companion")',
    't("inventory")',
    't("patternsPremium.habits")',
    't("shop")',
    't("settings")',
]

for fragment in required_old:
    if fragment not in old_block:
        print(f"ERRO: bloco atual incompleto: {fragment}")
        sys.exit(1)


# ------------------------------------------------------------
# 2. Novo bloco premium
# ------------------------------------------------------------

new_block = '''{/* O teu espaço — navegação secundária premium */}
{homeScreen === "home" && (
  <section
    className="overflow-hidden rounded-[30px] border border-[#E8DDD7]/70 bg-gradient-to-br from-white via-[#FFFDFC] to-[#FFF8F4] shadow-[0_10px_30px_rgba(92,64,52,0.05)]"
    aria-label={t("homeSpace.title")}
  >
    {/* Cabeçalho */}
    <div className="px-5 pt-5 pb-3">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#C97B5E]">
        {t("homeSpace.title")}
      </p>

      <p className="mt-1 text-[11px] font-semibold text-slate-400">
        {t("homeSpace.subtitle")}
      </p>
    </div>

    {/* Amigo — protagonista */}
    <div className="px-3">
      <button
        type="button"
        onClick={() => setHomeScreen("companion")}
        className="w-full flex items-center justify-between gap-4 rounded-[22px] border border-[#E5A88B]/15 bg-white/85 px-4 py-3.5 text-left shadow-[0_6px_18px_rgba(92,64,52,0.04)] transition-colors duration-200 active:bg-[#FFF8F4]"
      >
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFF5EF] to-[#F7E9E0]">
            <Sparkles
              size={19}
              strokeWidth={1.8}
              className="text-[#C97B5E]"
            />
          </div>

          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#C97B5E]">
              CONFIA
            </p>

            <p className="mt-0.5 text-sm font-black text-[#4E3B36]">
              {t("companion")}
            </p>
          </div>
        </div>

        <span
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFF5EF] text-base font-light text-[#C97B5E]"
        >
          →
        </span>
      </button>
    </div>

    {/* Áreas do espaço */}
    <div className="mt-3 grid grid-cols-3 px-3">
      {/* Hábitos */}
      <button
        type="button"
        onClick={() => {
          setPatternsPage("menu");
          setHomeScreen("patterns");
        }}
        className="group flex min-h-[76px] flex-col items-center justify-center gap-2 rounded-2xl px-2 transition-colors duration-200 active:bg-[#FFF8F4]"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF5EF]">
          <ChartNoAxesCombined
            size={16}
            strokeWidth={1.8}
            className="text-[#C97B5E]"
          />
        </div>

        <span className="text-[10px] font-bold text-[#6D5A53]">
          {t("patternsPremium.habits")}
        </span>
      </button>

      {/* Inventário */}
      <button
        type="button"
        onClick={() => setHomeScreen("inventory")}
        className="group flex min-h-[76px] flex-col items-center justify-center gap-2 border-x border-[#E8DDD7]/55 rounded-2xl px-2 transition-colors duration-200 active:bg-[#FFF8F4]"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF5EF]">
          <Backpack
            size={16}
            strokeWidth={1.8}
            className="text-[#C97B5E]"
          />
        </div>

        <span className="text-[10px] font-bold text-[#6D5A53]">
          {t("inventory")}
        </span>
      </button>

      {/* Loja */}
      <button
        type="button"
        onClick={() => setHomeScreen("shop")}
        className="group flex min-h-[76px] flex-col items-center justify-center gap-2 rounded-2xl px-2 transition-colors duration-200 active:bg-[#FFF8F4]"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF5EF]">
          <Store
            size={16}
            strokeWidth={1.8}
            className="text-[#C97B5E]"
          />
        </div>

        <span className="text-[10px] font-bold text-[#6D5A53]">
          {t("shop")}
        </span>
      </button>
    </div>

    {/* Definições — utilidade secundária */}
    <div className="mx-4 mt-1 border-t border-[#E8DDD7]/55">
      <button
        type="button"
        onClick={() => setHomeScreen("settings")}
        className="flex w-full items-center justify-end gap-1.5 px-1 py-3 text-slate-400 transition-colors duration-200 active:text-[#C97B5E]"
      >
        <Settings
          size={13}
          strokeWidth={1.8}
        />

        <span className="text-[9px] font-bold">
          {t("settings")}
        </span>
      </button>
    </div>
  </section>
)}

'''

text = text[:start] + new_block + text[end:]


# ------------------------------------------------------------
# 3. Preparar traduções PT / EN / ES / FR
# ------------------------------------------------------------

locale_data = {}

for lang, values in locale_values.items():
    path = Path(f"src/locales/{lang}.json")

    if not path.exists():
        print(f"ERRO: locale não encontrado: {path}")
        sys.exit(1)

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"ERRO ao ler {path}: {exc}")
        sys.exit(1)

    if "homeSpace" in data:
        existing = data["homeSpace"]

        if existing != values:
            print(
                f"ERRO: homeSpace já existe com conteúdo "
                f"diferente em {path}."
            )
            sys.exit(1)
    else:
        data["homeSpace"] = values

    locale_data[path] = data


# ------------------------------------------------------------
# 4. Verificações finais do JSX
# ------------------------------------------------------------

required_new = [
    't("homeSpace.title")',
    't("homeSpace.subtitle")',
    'setHomeScreen("companion")',
    'setHomeScreen("patterns")',
    'setHomeScreen("inventory")',
    'setHomeScreen("shop")',
    'setHomeScreen("settings")',
    't("companion")',
    't("patternsPremium.habits")',
    't("inventory")',
    't("shop")',
    't("settings")',
    "grid-cols-3",
    "O teu espaço — navegação secundária premium",
]

for fragment in required_new:
    if fragment not in text:
        print(f"ERRO: verificação final falhou: {fragment}")
        sys.exit(1)

# Cada acesso deve continuar presente.
for action in [
    'setHomeScreen("companion")',
    'setHomeScreen("patterns")',
    'setHomeScreen("inventory")',
    'setHomeScreen("shop")',
    'setHomeScreen("settings")',
]:
    if text.count(action) < 1:
        print(f"ERRO: navegação perdida: {action}")
        sys.exit(1)

# Confirma que não ficou a grelha antiga de quatro utilitários.
if "mt-2 grid grid-cols-4 border-t" in text:
    print("ERRO: grelha antiga de 4 colunas ainda encontrada.")
    sys.exit(1)

if text == original:
    print("ERRO: nenhuma alteração efetuada.")
    sys.exit(1)


# ------------------------------------------------------------
# 5. Backups fora do projeto
# ------------------------------------------------------------

shutil.copy2(
    app_path,
    "/tmp/App.tsx.before_premium_home_space"
)

for path in locale_data:
    shutil.copy2(
        path,
        f"/tmp/{path.name}.before_premium_home_space"
    )


# ------------------------------------------------------------
# 6. Escrita
# ------------------------------------------------------------

app_path.write_text(text, encoding="utf-8")

for path, data in locale_data.items():
    path.write_text(
        json.dumps(
            data,
            ensure_ascii=False,
            indent=2
        ) + "\n",
        encoding="utf-8",
    )


# ------------------------------------------------------------
# 7. Resultado
# ------------------------------------------------------------

print("=" * 72)
print("CONFIA — PRINCIPAL PREMIUM 1B.5B.1")
print("=" * 72)
print("✓ 'O teu espaço' ganhou identidade própria")
print("✓ Amigo elevado a ação principal")
print("✓ Hábitos preservados")
print("✓ Inventário preservado")
print("✓ Loja preservada")
print("✓ Definições tornadas utilidade secundária")
print("✓ Grelha principal reduzida de 4 para 3 áreas")
print("✓ Navegação e handlers preservados")
print("✓ Nenhum storage novo")
print("✓ Nenhuma dependência nova")
print("✓ PT / EN / ES / FR atualizados")
print()
print("OK — O teu espaço elevado para composição premium.")
