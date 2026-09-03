import React, { useState } from "react";
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
  companionLevel: number;
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
  companionLevel,
  spendXp,
  onBuy,
}) => {

  const { t } = useTranslation();

  const [, setRefresh] = useState(0);

  const inventory = getInventory();

  const companionItems =
    homeItems.filter(isCompanionAccessory);


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

    const requiredLevel =
      item.minCompanionLevel ?? 1;

    const levelLocked =
      isCompanionAccessory(item) &&
      companionLevel < requiredLevel;

    if (
      owned ||
      levelLocked ||
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

    const requiredLevel =
      item.minCompanionLevel ?? 1;

    /**
     * Uma compra antiga nunca é invalidada.
     * O bloqueio aplica-se apenas a acessórios ainda não obtidos.
     */
    const levelLocked =
      !owned &&
      companionLevel < requiredLevel;

    const canBuy =
      !owned &&
      !levelLocked &&
      xp >= item.cost;

    const slotKey =
      item.companionSlot === "head" ||
      item.companionSlot === "face" ||
      item.companionSlot === "neck" ||
      item.companionSlot === "body" ||
      item.companionSlot === "hand" ||
      item.companionSlot === "aura" ||
      item.companionSlot === "skin" ||
      item.companionSlot === "mark" ||
      item.companionSlot === "flame" ||
      item.companionSlot === "eyes"
        ? item.companionSlot
        : "other";

    const slotLabel =
      t(`companionCustomization.slots.${slotKey}`);

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

          {levelLocked && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#E6D8CF] bg-[#F7F1ED] px-2.5 py-1 text-[10px] font-extrabold text-[#8C776E]">
              <span aria-hidden="true">
                🔒
              </span>

              <span>
                {t(
                  "companionShop.availableAtLevel",
                  { level: requiredLevel }
                )}
              </span>
            </div>
          )}

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
            : levelLocked
              ? `🔒 ${t(
                  "companionShop.levelRequired",
                  { level: requiredLevel }
                )}`
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

    </div>
  );
};


export default HomeShop;
