from pathlib import Path
import shutil
import json
import re
import sys

SHOP = Path("src/components/HomeShop.tsx")

LOCALES = {
    "pt": Path("src/locales/pt.json"),
    "en": Path("src/locales/en.json"),
    "es": Path("src/locales/es.json"),
    "fr": Path("src/locales/fr.json"),
}

BACKUPS = {
    SHOP:
        Path("/tmp/HomeShop.tsx.before_companheiro_premium_a5_6a"),
    LOCALES["pt"]:
        Path("/tmp/pt.json.before_companheiro_premium_a5_6a"),
    LOCALES["en"]:
        Path("/tmp/en.json.before_companheiro_premium_a5_6a"),
    LOCALES["es"]:
        Path("/tmp/es.json.before_companheiro_premium_a5_6a"),
    LOCALES["fr"]:
        Path("/tmp/fr.json.before_companheiro_premium_a5_6a"),
}

for path in BACKUPS:
    if not path.exists():
        print(f"ERRO: ficheiro não encontrado: {path}")
        sys.exit(1)

for path, backup in BACKUPS.items():
    shutil.copy2(path, backup)


translations = {
    "pt": {
        "title": "Loja da CONFIA",
        "subtitle": "Escolhe pequenos detalhes para tornar a tua CONFIA ainda mais tua.",
        "xpAvailable": "XP disponível",
        "accessoriesTitle": "Para a tua CONFIA",
        "accessoriesSubtitle": "Acessórios que podes usar na tua companheira.",
        "collectionTitle": "Outros objetos",
        "collectionSubtitle": "A tua coleção clássica continua disponível.",
        "buy": "Comprar",
        "owned": "Já tens",
        "notEnoughXp": "XP insuficiente",
    },
    "en": {
        "title": "CONFIA Shop",
        "subtitle": "Choose small details to make your CONFIA feel even more like yours.",
        "xpAvailable": "Available XP",
        "accessoriesTitle": "For your CONFIA",
        "accessoriesSubtitle": "Accessories you can use on your companion.",
        "collectionTitle": "Other items",
        "collectionSubtitle": "Your classic collection is still available.",
        "buy": "Buy",
        "owned": "Owned",
        "notEnoughXp": "Not enough XP",
    },
    "es": {
        "title": "Tienda de CONFIA",
        "subtitle": "Elige pequeños detalles para hacer que tu CONFIA sea aún más tuya.",
        "xpAvailable": "XP disponible",
        "accessoriesTitle": "Para tu CONFIA",
        "accessoriesSubtitle": "Accesorios que puedes usar en tu compañera.",
        "collectionTitle": "Otros objetos",
        "collectionSubtitle": "Tu colección clásica sigue disponible.",
        "buy": "Comprar",
        "owned": "Ya lo tienes",
        "notEnoughXp": "XP insuficiente",
    },
    "fr": {
        "title": "Boutique CONFIA",
        "subtitle": "Choisis de petits détails pour rendre ta CONFIA encore plus personnelle.",
        "xpAvailable": "XP disponible",
        "accessoriesTitle": "Pour ta CONFIA",
        "accessoriesSubtitle": "Des accessoires que tu peux utiliser sur ta compagne.",
        "collectionTitle": "Autres objets",
        "collectionSubtitle": "Ta collection classique reste disponible.",
        "buy": "Acheter",
        "owned": "Déjà obtenu",
        "notEnoughXp": "XP insuffisant",
    },
}


def restore_all():
    for path, backup in BACKUPS.items():
        shutil.copy2(backup, path)


try:

    # ==========================================================
    # 1. TRADUÇÕES
    # ==========================================================

    for lang, path in LOCALES.items():
        src = path.read_text(encoding="utf-8")

        if '"companionShop"' in src:
            raise RuntimeError(
                f"{lang}: companionShop já existe."
            )

        data = translations[lang]

        block = (
            '  "companionShop": {\n'
            f'    "title": {json.dumps(data["title"], ensure_ascii=False)},\n'
            f'    "subtitle": {json.dumps(data["subtitle"], ensure_ascii=False)},\n'
            f'    "xpAvailable": {json.dumps(data["xpAvailable"], ensure_ascii=False)},\n'
            f'    "accessoriesTitle": {json.dumps(data["accessoriesTitle"], ensure_ascii=False)},\n'
            f'    "accessoriesSubtitle": {json.dumps(data["accessoriesSubtitle"], ensure_ascii=False)},\n'
            f'    "collectionTitle": {json.dumps(data["collectionTitle"], ensure_ascii=False)},\n'
            f'    "collectionSubtitle": {json.dumps(data["collectionSubtitle"], ensure_ascii=False)},\n'
            f'    "buy": {json.dumps(data["buy"], ensure_ascii=False)},\n'
            f'    "owned": {json.dumps(data["owned"], ensure_ascii=False)},\n'
            f'    "notEnoughXp": {json.dumps(data["notEnoughXp"], ensure_ascii=False)}\n'
            '  },\n'
        )

        # Inserimos após a chave global "shop".
        pattern = r'(^  "shop":\s*".*?",\s*$)'

        match = re.search(
            pattern,
            src,
            flags=re.MULTILINE
        )

        if not match:
            raise RuntimeError(
                f"{lang}: chave global shop não encontrada."
            )

        src = (
            src[:match.end()]
            + "\n"
            + block
            + src[match.end():]
        )

        # Validar antes de gravar.
        json.loads(src)

        path.write_text(
            src,
            encoding="utf-8"
        )

    # ==========================================================
    # 2. NOVA HOMESHOP
    # ==========================================================

    shop_src = '''import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  homeItems,
  isCompanionAccessory,
} from "../data/homeItems";

import {
  getInventory,
  buyItem,
} from "../storage/homeInventory";


interface HomeShopProps {
  onBack: () => void;
  xp: number;
  spendXp: (amount: number) => void;

  /**
   * Callback legacy.
   *
   * O App atual não o fornece, por isso é opcional.
   * Se algum outro consumidor o fornecer, continua a funcionar.
   */
  onBuy?: (item: any) => void;
}


const HomeShop: React.FC<HomeShopProps> = ({
  onBack,
  xp,
  spendXp,
  onBuy,
}) => {

  const { t } = useTranslation();

  const [, setRefresh] = useState(0);

  const inventory = getInventory();

  const companionItems =
    homeItems.filter(isCompanionAccessory);

  const legacyItems =
    homeItems.filter(
      item => !isCompanionAccessory(item)
    );


  /**
   * A5.6A
   *
   * Mantém o fluxo de compra original:
   *
   * XP
   * ↓
   * spendXp
   * ↓
   * buyItem
   * ↓
   * callback legacy, se existir
   * ↓
   * refresh visual
   */
  const handleBuy = (item: typeof homeItems[number]) => {

    const owned =
      inventory.includes(item.id);

    if (
      owned ||
      xp < item.cost
    ) {
      return;
    }

    spendXp(item.cost);

    buyItem(item.id);

    onBuy?.(item);

    setRefresh(v => v + 1);
  };


  const renderAccessory = (
    item: typeof homeItems[number]
  ) => {

    const owned =
      inventory.includes(item.id);

    const canBuy =
      !owned &&
      xp >= item.cost;

    const slotLabel =
      item.companionSlot === "head"
        ? t("companionCustomization.slots.head")
        : item.companionSlot === "neck"
          ? t("companionCustomization.slots.neck")
          : t("companionCustomization.slots.other");

    return (
      <div
        key={item.id}
        className={`relative overflow-hidden rounded-[24px] border p-4 ${
          owned
            ? "border-[#D5A287] bg-[#FFF7F1] shadow-[0_10px_26px_rgba(177,112,82,0.11)]"
            : "border-[#E9DDD5] bg-white shadow-[0_8px_22px_rgba(92,67,58,0.06)]"
        }`}
      >

        {owned && (
          <div className="absolute right-3 top-3 rounded-full bg-[#C87960] px-2.5 py-1 text-[10px] font-extrabold text-white">
            {t("companionShop.owned")}
          </div>
        )}

        <div className="flex h-16 w-16 items-center justify-center rounded-[20px] border border-[#EFE0D6] bg-gradient-to-br from-[#FFFDFB] to-[#F8E9DF] text-4xl shadow-inner">
          {item.emoji}
        </div>

        <div className="mt-4 min-h-[76px]">

          <p className="pr-1 text-sm font-extrabold leading-snug text-[#4E3B36]">
            {t(
              `companionCustomization.items.${item.id}`
            )}
          </p>

          <p className="mt-1 text-xs font-semibold text-[#B07760]">
            {slotLabel}
          </p>

          <div className="mt-2 flex items-center gap-1 text-sm font-extrabold text-[#6B5148]">
            <span aria-hidden="true">
              ✦
            </span>

            <span>
              {item.cost} XP
            </span>
          </div>

        </div>

        <button
          type="button"
          disabled={!canBuy}
          onClick={() => handleBuy(item)}
          className={`mt-3 w-full rounded-xl px-3 py-2.5 text-xs font-extrabold transition-colors ${
            owned
              ? "cursor-default bg-[#C87960] text-white"
              : canBuy
                ? "bg-[#684F46] text-white"
                : "cursor-not-allowed bg-[#EEE8E4] text-[#A69790]"
          }`}
        >
          {owned
            ? `✓ ${t("companionShop.owned")}`
            : canBuy
              ? t("companionShop.buy")
              : t("companionShop.notEnoughXp")
          }
        </button>

      </div>
    );
  };


  const renderLegacyItem = (
    item: typeof homeItems[number]
  ) => {

    const owned =
      inventory.includes(item.id);

    const canBuy =
      !owned &&
      xp >= item.cost;

    return (
      <div
        key={item.id}
        className={`rounded-[20px] border p-3 text-center ${
          owned
            ? "border-[#D9B29D] bg-[#FFF8F3]"
            : "border-[#ECE2DC] bg-white"
        }`}
      >

        <div className="text-4xl">
          {item.emoji}
        </div>

        <div className="mt-2 text-xs font-extrabold text-[#6B5148]">
          {item.cost} XP
        </div>

        <button
          type="button"
          disabled={!canBuy}
          onClick={() => handleBuy(item)}
          className={`mt-3 w-full rounded-lg px-2 py-2 text-[11px] font-bold ${
            owned
              ? "cursor-default bg-[#C87960] text-white"
              : canBuy
                ? "bg-[#F1E7E1] text-[#654D45]"
                : "cursor-not-allowed bg-[#F2EFED] text-[#AAA09B]"
          }`}
        >
          {owned
            ? `✓ ${t("companionShop.owned")}`
            : canBuy
              ? t("companionShop.buy")
              : t("companionShop.notEnoughXp")
          }
        </button>

      </div>
    );
  };


  return (

    <div className="space-y-7 pb-8">

      {/* =====================================================
          CABEÇALHO PREMIUM
      ===================================================== */}

      <div className="relative overflow-hidden rounded-[30px] border border-[#E7D8CC] bg-gradient-to-br from-[#FFF9F3] via-white to-[#F8ECE4] px-5 pb-6 pt-5 shadow-[0_14px_36px_rgba(118,81,67,0.09)]">

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-[#E9B99F]/20 blur-2xl"
        />

        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#E7D8CC] bg-white/80 text-xl text-[#654A42] shadow-sm"
        >
          ←
        </button>

        <div className="relative mt-4 text-center">

          <div
            aria-hidden="true"
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#E7CDBD] bg-white/80 text-3xl shadow-sm"
          >
            ✦
          </div>

          <h1 className="mt-4 text-xl font-extrabold tracking-tight text-[#4E3B36]">
            {t("companionShop.title")}
          </h1>

          <p className="mx-auto mt-2 max-w-[320px] text-sm leading-relaxed text-[#826D65]">
            {t("companionShop.subtitle")}
          </p>

          <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-[#E8D5C8] bg-white/80 px-4 py-2 shadow-sm">

            <span
              aria-hidden="true"
              className="text-[#B8795E]"
            >
              ✦
            </span>

            <span className="text-xs font-bold text-[#8A756D]">
              {t("companionShop.xpAvailable")}
            </span>

            <span className="text-sm font-extrabold text-[#4E3B36]">
              {xp} XP
            </span>

          </div>

        </div>

      </div>


      {/* =====================================================
          ACESSÓRIOS DA CONFIA
      ===================================================== */}

      {companionItems.length > 0 && (

        <section className="space-y-4">

          <div className="px-1">

            <div className="flex items-center gap-2">

              <span
                aria-hidden="true"
                className="text-lg"
              >
                ✦
              </span>

              <h2 className="font-extrabold text-[#4E3B36]">
                {t("companionShop.accessoriesTitle")}
              </h2>

            </div>

            <p className="mt-1 text-sm leading-relaxed text-[#8A756D]">
              {t("companionShop.accessoriesSubtitle")}
            </p>

          </div>

          <div className="grid grid-cols-2 gap-3">

            {companionItems.map(
              renderAccessory
            )}

          </div>

        </section>

      )}


      {/* =====================================================
          OBJETOS LEGACY
      ===================================================== */}

      {legacyItems.length > 0 && (

        <section className="space-y-4">

          <div className="px-1">

            <h2 className="font-extrabold text-[#4E3B36]">
              {t("companionShop.collectionTitle")}
            </h2>

            <p className="mt-1 text-sm leading-relaxed text-[#8A756D]">
              {t("companionShop.collectionSubtitle")}
            </p>

          </div>

          <div className="grid grid-cols-3 gap-3">

            {legacyItems.map(
              renderLegacyItem
            )}

          </div>

        </section>

      )}

    </div>
  );
};


export default HomeShop;
'''

    SHOP.write_text(
        shop_src,
        encoding="utf-8"
    )

    # ==========================================================
    # 3. VALIDAÇÕES
    # ==========================================================

    final_shop = SHOP.read_text(
        encoding="utf-8"
    )

    checks = {
        "i18n":
            "useTranslation"
            in final_shop,

        "acessórios separados":
            "homeItems.filter(isCompanionAccessory)"
            in final_shop,

        "legacy separado":
            "!isCompanionAccessory(item)"
            in final_shop,

        "spendXp preservado":
            "spendXp(item.cost);"
            in final_shop,

        "buyItem preservado":
            "buyItem(item.id);"
            in final_shop,

        "callback seguro":
            "onBuy?.(item);"
            in final_shop,

        "onBuy opcional":
            "onBuy?: (item: any) => void;"
            in final_shop,

        "owned verificado":
            "inventory.includes(item.id)"
            in final_shop,

        "xp verificado":
            "xp < item.cost"
            in final_shop,

        "sem localStorage":
            "localStorage"
            not in final_shop,

        "sem timers":
            "setTimeout("
            not in final_shop
            and "setInterval("
            not in final_shop,

        "sem rAF":
            "requestAnimationFrame("
            not in final_shop,
    }

    for lang, path in LOCALES.items():

        parsed = json.loads(
            path.read_text(encoding="utf-8")
        )

        checks[
            f"{lang} companionShop"
        ] = (
            "companionShop"
            in parsed
        )

    failed = [
        name
        for name, ok in checks.items()
        if not ok
    ]

    if failed:
        raise RuntimeError(
            "Validação falhou:\n - "
            + "\n - ".join(failed)
        )

except Exception as exc:

    restore_all()

    print("ERRO:", exc)
    print()
    print("Os 5 ficheiros foram restaurados.")
    sys.exit(1)


print("=" * 76)
print("CONFIA — LOJA PREMIUM A5.6A")
print("=" * 76)
print()
print("✓ Loja centrada na CONFIA")
print("✓ Acessórios apresentados primeiro")
print("✓ Laço / lenço / amuleto com nome e slot")
print("✓ Custo XP visível")
print("✓ Estado comprado visível")
print("✓ XP insuficiente identificado")
print("✓ Objetos legacy preservados numa secção secundária")
print("✓ spendXp preservado")
print("✓ buyItem preservado")
print("✓ home_inventory preservado")
print("✓ Callback onBuy tornado seguro")
print("✓ PT / EN / ES / FR")
print("✓ JSON validado nos 4 idiomas")
print("✓ Sem novo storage")
print("✓ Sem timers")
print("✓ Sem requestAnimationFrame")
print("✓ Sem dependências")
print()
print("Backups:")
for backup in BACKUPS.values():
    print(f"  {backup}")
print()
print("A5.6A aplicado.")
print("=" * 76)
