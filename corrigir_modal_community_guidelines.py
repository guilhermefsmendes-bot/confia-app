import json
import shutil
from pathlib import Path

APP = Path("src/App.tsx")

LOCALES = {
    "pt": Path("src/locales/pt.json"),
    "en": Path("src/locales/en.json"),
    "es": Path("src/locales/es.json"),
    "fr": Path("src/locales/fr.json"),
}

CLOSE_TRANSLATIONS = {
    "pt": "Fechar",
    "en": "Close",
    "es": "Cerrar",
    "fr": "Fermer",
}

# =========================================================
# BACKUPS
# =========================================================

app_backup = Path("src/App.tsx.backup_community_modal")

if not app_backup.exists():
    shutil.copy2(APP, app_backup)
    print(f"Backup App.tsx criado: {app_backup}")
else:
    print(f"Backup App.tsx já existe: {app_backup}")

for lang, path in LOCALES.items():

    backup = path.with_suffix(path.suffix + ".backup_community_modal")

    if not backup.exists():
        shutil.copy2(path, backup)
        print(f"Backup {lang} criado: {backup}")

# =========================================================
# ADICIONAR CHAVE CLOSE
# =========================================================

for lang, path in LOCALES.items():

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if "close" not in data:
        data["close"] = CLOSE_TRANSLATIONS[lang]

        with open(path, "w", encoding="utf-8") as f:
            json.dump(
                data,
                f,
                ensure_ascii=False,
                indent=2
            )
            f.write("\n")

        print(f"✓ {lang}: chave 'close' adicionada")

    else:
        print(f"✓ {lang}: chave 'close' já existe")

# =========================================================
# APP.TSX
# =========================================================

text = APP.read_text(encoding="utf-8")

# ---------------------------------------------------------
# REMOVER O PRIMEIRO CARTÃO DUPLICADO
# ---------------------------------------------------------

old_card = """<div className="bg-white border border-[#E5A88B]/20 rounded-3xl p-5 shadow-sm">
  <h3 className="text-sm font-black text-[#4E3B36] mb-2">
    {t("communityTerms")}
  </h3>

  <p className="text-xs text-slate-500 leading-relaxed">
    {t("communityGuidelinesDescription")}
  </p>
</div>


"""

if old_card in text:

    text = text.replace(old_card, "", 1)

    print("✓ Cartão duplicado das Community Guidelines removido")

else:

    print("⚠ Cartão duplicado não encontrado exatamente")

# ---------------------------------------------------------
# CRIAR MODAL
# ---------------------------------------------------------

modal = r'''

{/* Community Guidelines Modal */}

{showCommunityTerms && (
  <div
    className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-5"
    onClick={() => setShowCommunityTerms(false)}
  >

    <div
      className="w-full max-w-md bg-white rounded-[32px] shadow-2xl p-6"
      onClick={(e) => e.stopPropagation()}
    >

      <div className="flex items-center justify-between mb-5">

        <h2 className="text-xl font-black text-[#4E3B36]">
          {t("communityGuidelines")}
        </h2>

        <button
          onClick={() => setShowCommunityTerms(false)}
          className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-500"
          aria-label={t("close")}
        >
          ×
        </button>

      </div>

      <div className="text-sm text-slate-600 leading-relaxed">
        {t("communityGuidelinesDescription")}
      </div>

      <button
        onClick={() => setShowCommunityTerms(false)}
        className="w-full mt-6 py-3.5 rounded-2xl bg-[#FFF0E8] border border-[#E5A88B]/30 text-[#C97B5E] font-black text-xs uppercase tracking-wide"
      >
        {t("close")}
      </button>

    </div>

  </div>
)}

'''

# ---------------------------------------------------------
# INSERIR MODAL ANTES DA NAVEGAÇÃO DOS SEPARADORES
# ---------------------------------------------------------

marker = "{currentTab === 1 && ("

if modal.strip() not in text:

    if marker in text:

        text = text.replace(
            marker,
            modal + "\n" + marker,
            1
        )

        print("✓ Modal Community Guidelines adicionado")

    else:

        print("⚠ Não encontrei o ponto de inserção do modal")

else:

    print("✓ Modal já existe")

# =========================================================
# GRAVAR APP
# =========================================================

APP.write_text(text, encoding="utf-8")

# =========================================================
# VERIFICAÇÃO
# =========================================================

print()
print("==============================================")
print("VERIFICAÇÃO FINAL")
print("==============================================")

final = APP.read_text(encoding="utf-8")

checks = {
    'showCommunityTerms': "showCommunityTerms &&",
    'communityGuidelines': 't("communityGuidelines")',
    'communityGuidelinesDescription':
        't("communityGuidelinesDescription")',
    'communityGuidelinesShort':
        't("communityGuidelinesShort")',
    'communityTermsButton':
        't("communityTermsButton")',
    'close':
        't("close")',
}

for name, pattern in checks.items():

    if pattern in final:
        print(f"✓ {name}")
    else:
        print(f"⚠ {name} NÃO encontrado")

print()
print("=== TRADUÇÕES CLOSE ===")

for lang, path in LOCALES.items():

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"✓ {lang}: {data.get('close')}")

print()
print("Correção concluída.")
print()
print("PRÓXIMO PASSO:")
print("npm run build")
